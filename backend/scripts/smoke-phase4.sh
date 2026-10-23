#!/usr/bin/env bash
# End-to-end feed + search smoke test (Phase 4).
#
# Requires: cargo, curl, jq, initdb, pg_ctl, createdb,
#           neo4j, neo4j-admin, cypher-shell, java.
# On Nix:
#   nix shell nixpkgs#cargo nixpkgs#rustc nixpkgs#postgresql nixpkgs#neo4j \
#     nixpkgs#jdk -c bash scripts/smoke-phase4.sh
#
# Uses isolated ports and throwaway Postgres/Neo4j instances.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME="${JULINK_PHASE4_SMOKE_DIR:-/tmp/opencode/julink-phase4-smoke}"
PGDATA="$RUNTIME/pgdata"
SOCK="$RUNTIME/sock"
LOG="$RUNTIME/logs"
NEO4J_DIST="$RUNTIME/neo4j"
PGPORT="${JULINK_PHASE4_SMOKE_PGPORT:-55435}"
NEO4J_BOLT_PORT="${JULINK_PHASE4_SMOKE_NEO4J_BOLT_PORT:-17691}"
NEO4J_HTTP_PORT="${JULINK_PHASE4_SMOKE_NEO4J_HTTP_PORT:-17481}"
IDENTITY_PORT="${JULINK_PHASE4_SMOKE_IDENTITY_PORT:-19030}"
SOCIAL_PORT="${JULINK_PHASE4_SMOKE_SOCIAL_PORT:-19031}"
CONTENT_PORT="${JULINK_PHASE4_SMOKE_CONTENT_PORT:-19032}"
FEED_PORT="${JULINK_PHASE4_SMOKE_FEED_PORT:-19033}"
SEARCH_PORT="${JULINK_PHASE4_SMOKE_SEARCH_PORT:-19034}"
GATEWAY_PORT="${JULINK_PHASE4_SMOKE_GATEWAY_PORT:-18084}"

for tool in cargo curl jq initdb pg_ctl createdb neo4j-admin cypher-shell java; do
    command -v "$tool" >/dev/null 2>&1 || {
        echo "missing required tool: $tool" >&2
        exit 1
    }
done

if [ -z "${JAVA_HOME:-}" ]; then
    JAVA_BIN="$(command -v java)"
    JAVA_HOME="$(dirname "$(dirname "$(readlink -f "$JAVA_BIN")")")"
    export JAVA_HOME
fi
export PATH="$JAVA_HOME/bin:$PATH"

rm -rf "$RUNTIME"
mkdir -p "$SOCK" "$LOG"

cleanup() {
    set +e
    [ -n "${GATEWAY_PID:-}" ] && kill "$GATEWAY_PID" 2>/dev/null
    [ -n "${SEARCH_PID:-}" ] && kill "$SEARCH_PID" 2>/dev/null
    [ -n "${FEED_PID:-}" ] && kill "$FEED_PID" 2>/dev/null
    [ -n "${CONTENT_PID:-}" ] && kill "$CONTENT_PID" 2>/dev/null
    [ -n "${SOCIAL_PID:-}" ] && kill "$SOCIAL_PID" 2>/dev/null
    [ -n "${IDENTITY_PID:-}" ] && kill "$IDENTITY_PID" 2>/dev/null
    [ -n "${NEO4J_PID:-}" ] && kill "$NEO4J_PID" 2>/dev/null
    if [ -n "${NEO4J_DIST:-}" ] && [ -d "$NEO4J_DIST" ]; then
        (cd "$NEO4J_DIST" && bin/neo4j stop >/dev/null 2>&1)
    fi
    pg_ctl -D "$PGDATA" stop -m fast >/dev/null 2>&1
}
trap cleanup EXIT

wait_for() {
    local url="$1" name="$2" log="$3"
    for _ in $(seq 1 160); do
        if curl -fsS "$url" >/dev/null 2>&1; then
            return 0
        fi
        sleep 0.25
    done
    echo "FAILED waiting for $name" >&2
    cat "$log" >&2
    return 1
}

http_code() {
    curl -s -o /dev/null -w '%{http_code}' "$@"
}

cd "$ROOT"
echo "== building =="
cargo build --quiet -p julink-identity -p julink-social -p julink-content -p julink-feed -p julink-search -p julink-gateway

echo "== preparing neo4j =="
NEO4J_SRC="$(dirname "$(dirname "$(command -v neo4j)")")/share/neo4j"
cp -r "$NEO4J_SRC" "$NEO4J_DIST"
chmod -R u+w "$NEO4J_DIST"
sed -i "s/^#server.default_listen_address=.*/server.default_listen_address=127.0.0.1/" "$NEO4J_DIST/conf/neo4j.conf"
sed -i "s/^#server.bolt.listen_address=.*/server.bolt.listen_address=:$NEO4J_BOLT_PORT/" "$NEO4J_DIST/conf/neo4j.conf"
sed -i "s/^#server.http.listen_address=.*/server.http.listen_address=:$NEO4J_HTTP_PORT/" "$NEO4J_DIST/conf/neo4j.conf"
sed -i "s/^#server.https.enabled=.*/server.https.enabled=false/" "$NEO4J_DIST/conf/neo4j.conf"
{
    echo "server.memory.heap.initial_size=512m"
    echo "server.memory.heap.max_size=512m"
    echo "server.memory.pagecache.size=512m"
} >>"$NEO4J_DIST/conf/neo4j.conf"
(cd "$NEO4J_DIST" && bin/neo4j-admin dbms set-initial-password julinkdev) >/dev/null

echo "== starting neo4j =="
(cd "$NEO4J_DIST" && exec bin/neo4j console) >"$LOG/neo4j.log" 2>&1 &
NEO4J_PID=$!
for _ in $(seq 1 180); do
    if cypher-shell -a "bolt://127.0.0.1:$NEO4J_BOLT_PORT" -u neo4j -p julinkdev \
        'RETURN 1' >/dev/null 2>&1; then
        break
    fi
    sleep 0.5
done
cypher-shell -a "bolt://127.0.0.1:$NEO4J_BOLT_PORT" -u neo4j -p julinkdev 'RETURN 1' >/dev/null

echo "== starting postgres =="
initdb -D "$PGDATA" -U postgres --auth=trust >/dev/null
pg_ctl -D "$PGDATA" -o "-p $PGPORT -k $SOCK -h 127.0.0.1" -l "$LOG/postgres.log" -w start >/dev/null
for db in julink_identity julink_social julink_content julink_search; do
    createdb -h "$SOCK" -p "$PGPORT" -U postgres "$db"
done

echo "== starting identity =="
env PORT="$IDENTITY_PORT" \
    DATABASE_URL="postgres://postgres@127.0.0.1:$PGPORT/julink_identity" \
    RUN_MIGRATIONS=true DEV_AUTH=true DEV_OTP=true \
    JWT_ISSUER=julink JWT_TTL_SECONDS=900 REFRESH_TTL_SECONDS=3600 \
    OTP_SECRET=phase4-smoke-secret OTP_RESEND_COOLDOWN_SECONDS=0 \
    COOKIE_SECURE=false CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-identity" >"$LOG/identity.log" 2>&1 &
IDENTITY_PID=$!
wait_for "http://127.0.0.1:$IDENTITY_PORT/health/ready" identity "$LOG/identity.log"

echo "== starting social =="
env PORT="$SOCIAL_PORT" \
    SOCIAL_DATABASE_URL="postgres://postgres@127.0.0.1:$PGPORT/julink_social" \
    RUN_MIGRATIONS=true \
    IDENTITY_URL="http://127.0.0.1:$IDENTITY_PORT" \
    NEO4J_URI="bolt://127.0.0.1:$NEO4J_BOLT_PORT" \
    NEO4J_USER=neo4j NEO4J_PASSWORD=julinkdev \
    CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-social" >"$LOG/social.log" 2>&1 &
SOCIAL_PID=$!
wait_for "http://127.0.0.1:$SOCIAL_PORT/health/ready" social "$LOG/social.log"

echo "== starting content =="
env PORT="$CONTENT_PORT" \
    CONTENT_DATABASE_URL="postgres://postgres@127.0.0.1:$PGPORT/julink_content" \
    RUN_MIGRATIONS=true CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-content" >"$LOG/content.log" 2>&1 &
CONTENT_PID=$!
wait_for "http://127.0.0.1:$CONTENT_PORT/health/ready" content "$LOG/content.log"

echo "== starting feed =="
env PORT="$FEED_PORT" \
    SOCIAL_URL="http://127.0.0.1:$SOCIAL_PORT" \
    CONTENT_URL="http://127.0.0.1:$CONTENT_PORT" \
    IDENTITY_URL="http://127.0.0.1:$IDENTITY_PORT" \
    FEED_CACHE_TTL_SECONDS=60 \
    CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-feed" >"$LOG/feed.log" 2>&1 &
FEED_PID=$!
wait_for "http://127.0.0.1:$FEED_PORT/health/live" feed "$LOG/feed.log"

echo "== starting search =="
env PORT="$SEARCH_PORT" \
    SEARCH_DATABASE_URL="postgres://postgres@127.0.0.1:$PGPORT/julink_search" \
    RUN_MIGRATIONS=true SYNC_ENABLED=false \
    IDENTITY_URL="http://127.0.0.1:$IDENTITY_PORT" \
    CONTENT_URL="http://127.0.0.1:$CONTENT_PORT" \
    CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-search" >"$LOG/search.log" 2>&1 &
SEARCH_PID=$!
wait_for "http://127.0.0.1:$SEARCH_PORT/health/ready" search "$LOG/search.log"

echo "== starting gateway =="
env PORT="$GATEWAY_PORT" \
    IDENTITY_URL="http://127.0.0.1:$IDENTITY_PORT" \
    SOCIAL_URL="http://127.0.0.1:$SOCIAL_PORT" \
    CONTENT_URL="http://127.0.0.1:$CONTENT_PORT" \
    FEED_URL="http://127.0.0.1:$FEED_PORT" \
    SEARCH_URL="http://127.0.0.1:$SEARCH_PORT" \
    MESSAGING_URL="http://127.0.0.1:19969" \
    REALTIME_WS_URL="ws://127.0.0.1:19968/ws" \
    CALLS_URL="http://127.0.0.1:19967" \
    COMMUNITY_URL="http://127.0.0.1:19966" \
    NOTIFICATIONS_URL="http://127.0.0.1:19965" \
    CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-gateway" >"$LOG/gateway.log" 2>&1 &
GATEWAY_PID=$!
wait_for "http://127.0.0.1:$GATEWAY_PORT/health/live" gateway "$LOG/gateway.log"

BASE="http://127.0.0.1:$GATEWAY_PORT"
PASSWORD="Phase4Pass123"
pass=0
fail=0
check() {
    local label="$1" expected="$2" actual="$3"
    if [ "$expected" = "$actual" ]; then
        echo "  ok   $label ($actual)"
        pass=$((pass + 1))
    else
        echo "  FAIL $label (expected $expected, got $actual)"
        fail=$((fail + 1))
    fi
}
check_bool() {
    local label="$1" condition="$2"
    check "$label" true "$([ "$condition" = "1" ] && echo true || echo false)"
}

create_user() {
    local username="$1" email="$2"
    local file="$RUNTIME/register-$username.json"
    local code otp token

    code=$(curl -s -o "$file" -w '%{http_code}' -X POST "$BASE/api/v1/auth/register" \
        -H 'content-type: application/json' \
        -d "{\"username\":\"$username\",\"email\":\"$email\",\"password\":\"$PASSWORD\",\"display_name\":\"$username\"}")
    [ "$code" = "202" ] || { echo "register $username failed: $code" >&2; cat "$file" >&2; return 1; }

    otp=$(jq -r '.dev_code // empty' "$file")
    [ ${#otp} -eq 6 ] || { echo "no dev OTP for $username" >&2; cat "$file" >&2; return 1; }

    code=$(http_code -X POST "$BASE/api/v1/auth/verify-otp" \
        -H 'content-type: application/json' \
        -d "{\"email\":\"$email\",\"code\":\"$otp\",\"purpose\":\"register\"}")
    [ "$code" = "200" ] || { echo "verify $username failed: $code" >&2; return 1; }

    token=$(curl -fsS -X POST "$BASE/api/v1/auth/login" \
        -H 'content-type: application/json' \
        -d "{\"identifier\":\"$email\",\"password\":\"$PASSWORD\"}" | jq -r .access_token)
    [ -n "$token" ] && [ "$token" != "null" ] || { echo "login $username failed" >&2; return 1; }
    echo "$token"
}

auth_json() {
    local token="$1" method="$2" url="$3" body="${4:-}"
    if [ -n "$body" ]; then
        curl -fsS -X "$method" "$url" -H "authorization: Bearer $token" \
            -H 'content-type: application/json' -d "$body"
    else
        curl -fsS -X "$method" "$url" -H "authorization: Bearer $token"
    fi
}

create_post() {
    local token="$1" body_json="$2"
    auth_json "$token" POST "$BASE/api/v1/posts" "{\"body\":$body_json}"
}

feed_bodies() {
    jq -r '[.items[].post.body] | sort | join("|")'
}

echo "== creating users and graph =="
ALICE=$(create_user alice alice@example.com)
BOB=$(create_user bob bob@example.com)
CAROL=$(create_user carol carol@example.com)
DAVE=$(create_user dave dave@example.com)
check_bool "four users registered" "$([ -n "$ALICE$BOB$CAROL$DAVE" ] && echo 1 || echo 0)"
check "alice follows bob" 204 "$(http_code -X POST "$BASE/api/v1/follow/bob" -H "authorization: Bearer $ALICE")"
check "bob follows carol" 204 "$(http_code -X POST "$BASE/api/v1/follow/carol" -H "authorization: Bearer $BOB")"

echo "== creating posts =="
BOB_POST=$(create_post "$BOB" '"Bob #Rust post"')
CAROL_POST=$(create_post "$CAROL" '"Carol #Campus post"')
ALICE_POST=$(create_post "$ALICE" '"Alice own post"')
check_bool "three posts created" "$(echo "$BOB_POST$CAROL_POST$ALICE_POST" | grep -q '"id"' && echo 1 || echo 0)"

echo "== home feed =="
ALICE_FEED=$(auth_json "$ALICE" GET "$BASE/api/v1/feed")
check "alice sees bob and herself" "Alice own post|Bob #Rust post" "$(echo "$ALICE_FEED" | feed_bodies)"
check "feed excludes carol" "alice,bob" \
    "$(echo "$ALICE_FEED" | jq -r '[.items[].author.username] | sort | join(",")')"
check "feed enriches author display names" "alice,bob" \
    "$(echo "$ALICE_FEED" | jq -r '[.items[].author.display_name] | sort | join(",")')"
check "feed reports total-like count" "2" "$(echo "$ALICE_FEED" | jq -r '.items | length')"

PAGE1=$(auth_json "$ALICE" GET "$BASE/api/v1/feed?limit=1")
check "feed first page" "1" "$(echo "$PAGE1" | jq -r '.items | length')"
CURSOR=$(echo "$PAGE1" | jq -r '.next_cursor // empty')
check_bool "feed returns a cursor" "$([ -n "$CURSOR" ] && echo 1 || echo 0)"
check "feed second page" "1" \
    "$(auth_json "$ALICE" GET "$BASE/api/v1/feed?limit=1&cursor=$CURSOR" | jq -r '.items | length')"
check "invalid feed cursor is rejected" 400 \
    "$(http_code -H "authorization: Bearer $ALICE" "$BASE/api/v1/feed?cursor=not-a-uuid")"

DAVE_FEED=$(auth_json "$DAVE" GET "$BASE/api/v1/feed")
check "new account falls back to the global feed" "Alice own post|Bob #Rust post|Carol #Campus post" \
    "$(echo "$DAVE_FEED" | feed_bodies)"
TRENDING=$(auth_json "$ALICE" GET "$BASE/api/v1/trending")
check "trending is global" "Alice own post|Bob #Rust post|Carol #Campus post" \
    "$(echo "$TRENDING" | feed_bodies)"

echo "== search read model =="
check "search reindex succeeds" 204 \
    "$(http_code -X POST "http://127.0.0.1:$SEARCH_PORT/internal/search/reindex")"

SEARCH=$(auth_json "$ALICE" GET "$BASE/api/v1/search?q=Rust")
check "search finds the Rust post" "1" "$(echo "$SEARCH" | jq -r '.posts | length')"
check "search returns the Rust hashtag" "rust" "$(echo "$SEARCH" | jq -r '.hashtags[0].hashtag')"
check "search post snippet contains the term" "true" \
    "$(echo "$SEARCH" | jq -r '(.posts[0].snippet | ascii_downcase | contains("rust"))')"

check "user search finds alice" "alice" \
    "$(auth_json "$ALICE" GET "$BASE/api/v1/search/users?q=alice" | jq -r '.[0].username')"
check "post search finds Campus" "carol" \
    "$(auth_json "$ALICE" GET "$BASE/api/v1/search/posts?q=Campus" | jq -r '.[0].author_username')"
check "hashtag search is substring based" "rust" \
    "$(auth_json "$ALICE" GET "$BASE/api/v1/search/hashtags?q=rus" | jq -r '.[0].hashtag')"
check "broad post search finds all posts" "3" \
    "$(auth_json "$ALICE" GET "$BASE/api/v1/search/posts?q=post" | jq -r 'length')"
check "empty search is rejected" 400 \
    "$(http_code -H "authorization: Bearer $ALICE" "$BASE/api/v1/search?q=")"

echo
echo "== result: $pass passed, $fail failed =="
if [ "$fail" -ne 0 ]; then
    echo "--- feed log ---" >&2
    tail -60 "$LOG/feed.log" >&2
    echo "--- search log ---" >&2
    tail -60 "$LOG/search.log" >&2
    echo "--- content log ---" >&2
    tail -40 "$LOG/content.log" >&2
    echo "--- social log ---" >&2
    tail -30 "$LOG/social.log" >&2
    echo "--- gateway log ---" >&2
    tail -30 "$LOG/gateway.log" >&2
    exit 1
fi
