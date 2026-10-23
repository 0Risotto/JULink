#!/usr/bin/env bash
# End-to-end social graph smoke test (Phase 2).
#
# Requires: cargo, curl, jq, initdb, pg_ctl, createdb, psql,
#           neo4j, neo4j-admin, cypher-shell, java, nats-server.
# On Nix:
#   nix shell nixpkgs#cargo nixpkgs#rustc nixpkgs#postgresql nixpkgs#neo4j \
#     nixpkgs#jdk nixpkgs#nats-server -c bash scripts/smoke-social.sh
#
# Uses isolated ports and throwaway Postgres/Neo4j/NATS instances.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME="${JULINK_SOCIAL_SMOKE_DIR:-/tmp/opencode/julink-social-smoke}"
PGDATA="$RUNTIME/pgdata"
SOCK="$RUNTIME/sock"
LOG="$RUNTIME/logs"
NEO4J_DIST="$RUNTIME/neo4j"
PGPORT="${JULINK_SOCIAL_SMOKE_PGPORT:-55433}"
IDENTITY_PORT="${JULINK_SOCIAL_SMOKE_IDENTITY_PORT:-19010}"
GATEWAY_PORT="${JULINK_SOCIAL_SMOKE_GATEWAY_PORT:-18081}"
SOCIAL_PORT="${JULINK_SOCIAL_SMOKE_SOCIAL_PORT:-19011}"
NEO4J_BOLT_PORT="${JULINK_SOCIAL_SMOKE_NEO4J_BOLT_PORT:-17690}"
NEO4J_HTTP_PORT="${JULINK_SOCIAL_SMOKE_NEO4J_HTTP_PORT:-17480}"
NATS_PORT="${JULINK_SOCIAL_SMOKE_NATS_PORT:-14222}"
NATS_MONITOR_PORT="${JULINK_SOCIAL_SMOKE_NATS_MONITOR_PORT:-18222}"

for tool in cargo curl jq initdb pg_ctl createdb psql neo4j-admin cypher-shell java nats-server; do
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
    [ -n "${SOCIAL_PID:-}" ] && kill "$SOCIAL_PID" 2>/dev/null
    [ -n "${IDENTITY_PID:-}" ] && kill "$IDENTITY_PID" 2>/dev/null
    [ -n "${NATS_PID:-}" ] && kill "$NATS_PID" 2>/dev/null
    [ -n "${NEO4J_PID:-}" ] && kill "$NEO4J_PID" 2>/dev/null
    if [ -n "${NEO4J_DIST:-}" ] && [ -d "$NEO4J_DIST" ]; then
        (cd "$NEO4J_DIST" && bin/neo4j stop >/dev/null 2>&1)
    fi
    pg_ctl -D "$PGDATA" stop -m fast >/dev/null 2>&1
}
trap cleanup EXIT

wait_for() {
    local url="$1" name="$2" log="$3"
    for _ in $(seq 1 120); do
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
cargo build --quiet -p julink-identity -p julink-social -p julink-gateway

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

echo "== starting nats =="
nats-server -p "$NATS_PORT" -m "$NATS_MONITOR_PORT" -js -sd "$RUNTIME/nats" \
    >"$LOG/nats.log" 2>&1 &
NATS_PID=$!
wait_for "http://127.0.0.1:$NATS_MONITOR_PORT/healthz" nats "$LOG/nats.log"

echo "== starting postgres =="
initdb -D "$PGDATA" -U postgres --auth=trust >/dev/null
pg_ctl -D "$PGDATA" -o "-p $PGPORT -k $SOCK -h 127.0.0.1" -l "$LOG/postgres.log" -w start >/dev/null
createdb -h "$SOCK" -p "$PGPORT" -U postgres julink_identity
createdb -h "$SOCK" -p "$PGPORT" -U postgres julink_social

echo "== starting identity =="
env PORT="$IDENTITY_PORT" \
    DATABASE_URL="postgres://postgres@127.0.0.1:$PGPORT/julink_identity" \
    RUN_MIGRATIONS=true DEV_AUTH=true DEV_OTP=true \
    JWT_ISSUER=julink JWT_TTL_SECONDS=900 REFRESH_TTL_SECONDS=3600 \
    OTP_SECRET=social-smoke-secret OTP_RESEND_COOLDOWN_SECONDS=0 \
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
    NATS_URL="nats://127.0.0.1:$NATS_PORT" \
    CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-social" >"$LOG/social.log" 2>&1 &
SOCIAL_PID=$!
wait_for "http://127.0.0.1:$SOCIAL_PORT/health/ready" social "$LOG/social.log"

echo "== starting gateway =="
env PORT="$GATEWAY_PORT" \
    IDENTITY_URL="http://127.0.0.1:$IDENTITY_PORT" \
    SOCIAL_URL="http://127.0.0.1:$SOCIAL_PORT" \
    CONTENT_URL="http://127.0.0.1:19989" \
    FEED_URL="http://127.0.0.1:19988" \
    SEARCH_URL="http://127.0.0.1:19987" \
    MESSAGING_URL="http://127.0.0.1:19986" \
    REALTIME_WS_URL="ws://127.0.0.1:19985/ws" \
    CALLS_URL="http://127.0.0.1:19984" \
    COMMUNITY_URL="http://127.0.0.1:19983" \
    NOTIFICATIONS_URL="http://127.0.0.1:19982" \
    CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-gateway" >"$LOG/gateway.log" 2>&1 &
GATEWAY_PID=$!
wait_for "http://127.0.0.1:$GATEWAY_PORT/health/live" gateway "$LOG/gateway.log"

BASE="http://127.0.0.1:$GATEWAY_PORT"
PASSWORD="GraphPass123"
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
    local username="$1"
    local email="$2"
    local file="$RUNTIME/register-$username.json"
    local code otp token

    code=$(curl -s -o "$file" -w '%{http_code}' -X POST "$BASE/api/v1/auth/register" \
        -H 'content-type: application/json' \
        -d "{\"username\":\"$username\",\"email\":\"$email\",\"password\":\"$PASSWORD\",\"display_name\":\"$username\"}")
    if [ "$code" != "202" ]; then
        echo "register $username failed: $code" >&2
        cat "$file" >&2
        return 1
    fi

    otp=$(jq -r '.dev_code // empty' "$file")
    if [ ${#otp} -ne 6 ]; then
        echo "no dev OTP for $username" >&2
        cat "$file" >&2
        return 1
    fi

    code=$(http_code -X POST "$BASE/api/v1/auth/verify-otp" \
        -H 'content-type: application/json' \
        -d "{\"email\":\"$email\",\"code\":\"$otp\",\"purpose\":\"register\"}")
    if [ "$code" != "200" ]; then
        echo "verify $username failed: $code" >&2
        return 1
    fi

    token=$(curl -fsS -X POST "$BASE/api/v1/auth/login" \
        -H 'content-type: application/json' \
        -d "{\"identifier\":\"$email\",\"password\":\"$PASSWORD\"}" | jq -r .access_token)
    if [ -z "$token" ] || [ "$token" = "null" ]; then
        echo "login $username failed" >&2
        return 1
    fi

    echo "$token"
}

follow_call() {
    local token="$1" method="$2" target="$3"
    http_code -X "$method" "$BASE/api/v1/follow/$target" -H "authorization: Bearer $token"
}
block_call() {
    local token="$1" method="$2" target="$3"
    http_code -X "$method" "$BASE/api/v1/blocks/$target" -H "authorization: Bearer $token"
}
names() {
    jq -r '[.items[].username] | sort | join(",")'
}

echo "== creating users =="
ALICE=$(create_user alice alice@example.com)
BOB=$(create_user bob bob@example.com)
CAROL=$(create_user carol carol@example.com)
DAVE=$(create_user dave dave@example.com)
EVE=$(create_user eve eve@example.com)
check_bool "five users registered and logged in" "$([ -n "$ALICE$BOB$CAROL$DAVE$EVE" ] && echo 1 || echo 0)"

echo "== follow graph =="
check "alice follows bob" 204 "$(follow_call "$ALICE" POST bob)"
check "alice follows carol" 204 "$(follow_call "$ALICE" POST carol)"
check "alice follows dave" 204 "$(follow_call "$ALICE" POST dave)"
check "bob follows carol" 204 "$(follow_call "$BOB" POST carol)"
check "bob follows dave" 204 "$(follow_call "$BOB" POST dave)"
check "bob follows eve" 204 "$(follow_call "$BOB" POST eve)"
check "carol follows bob" 204 "$(follow_call "$CAROL" POST bob)"
check "carol follows alice" 204 "$(follow_call "$CAROL" POST alice)"
check "self-follow is rejected" 400 "$(follow_call "$ALICE" POST alice)"
check "unknown target is 404" 404 "$(follow_call "$ALICE" POST nobody)"

echo "== lists and pagination =="
check "alice's followings" "bob,carol,dave" \
    "$(curl -fsS -H "authorization: Bearer $ALICE" "$BASE/api/v1/follow/alice/followings" | names)"
check "bob's followers" "alice,carol" \
    "$(curl -fsS -H "authorization: Bearer $BOB" "$BASE/api/v1/follow/bob/followers" | names)"
check "bob's friends" "carol" \
    "$(curl -fsS -H "authorization: Bearer $BOB" "$BASE/api/v1/follow/friends" | names)"

PAGE1=$(curl -fsS -H "authorization: Bearer $ALICE" "$BASE/api/v1/follow/alice/followings?limit=2")
check "pagination returns the first page" "bob,carol" "$(echo "$PAGE1" | names)"
CURSOR=$(echo "$PAGE1" | jq -r '.next_cursor // empty')
check "pagination returns a cursor" "carol" "$CURSOR"
check "pagination continues from the cursor" "dave" \
    "$(curl -fsS -H "authorization: Bearer $ALICE" "$BASE/api/v1/follow/alice/followings?limit=2&cursor=$CURSOR" | names)"

echo "== status and mutuals =="
check "alice is following bob" "true" \
    "$(curl -fsS -H "authorization: Bearer $ALICE" "$BASE/api/v1/follow/bob/is-following" | jq -r .following)"
check "bob and carol are mutual" "true" \
    "$(curl -fsS -H "authorization: Bearer $BOB" "$BASE/api/v1/follow/carol/mutual" | jq -r .mutual)"
check "alice and bob mutual followings" "carol,dave" \
    "$(curl -fsS -H "authorization: Bearer $ALICE" "$BASE/api/v1/follow/mutual-followings/bob" | names)"
check "alice and bob mutual followers" "carol" \
    "$(curl -fsS -H "authorization: Bearer $ALICE" "$BASE/api/v1/follow/mutual-followers/bob" | names)"
check "alice's suggestions contain eve" "eve" \
    "$(curl -fsS -H "authorization: Bearer $ALICE" "$BASE/api/v1/follow/suggestion" | jq -r '[.[].username] | sort | join(",")')"

echo "== blocks and filtering =="
check "alice blocks bob" 204 "$(block_call "$ALICE" POST bob)"
BLOCK_STATUS=$(curl -fsS -H "authorization: Bearer $ALICE" "$BASE/api/v1/blocks/bob/status")
check "alice has blocked bob" "true" "$(echo "$BLOCK_STATUS" | jq -r .blocked)"
check "alice's followings exclude bob" "carol,dave" \
    "$(curl -fsS -H "authorization: Bearer $ALICE" "$BASE/api/v1/follow/alice/followings" | names)"
check "bob's followers exclude alice" "carol" \
    "$(curl -fsS -H "authorization: Bearer $BOB" "$BASE/api/v1/follow/bob/followers" | names)"
check "alice is no longer following bob" "false" \
    "$(curl -fsS -H "authorization: Bearer $ALICE" "$BASE/api/v1/follow/bob/is-following" | jq -r .following)"
check "blocked paths are removed from suggestions" "" \
    "$(curl -fsS -H "authorization: Bearer $ALICE" "$BASE/api/v1/follow/suggestion" | jq -r '[.[].username] | sort | join(",")')"
check "alice's block list contains bob" "bob" \
    "$(curl -fsS -H "authorization: Bearer $ALICE" "$BASE/api/v1/blocks" | names)"
check "alice unblocks bob" 204 "$(block_call "$ALICE" DELETE bob)"
check "bob is no longer blocked" "false" \
    "$(curl -fsS -H "authorization: Bearer $ALICE" "$BASE/api/v1/blocks/bob/status" | jq -r .blocked)"

echo "== outbox =="
OUTBOX_PUBLISHED=0
OUTBOX_PENDING=999
for _ in $(seq 1 40); do
    OUTBOX_PUBLISHED=$(psql -h "$SOCK" -p "$PGPORT" -U postgres -d julink_social -tAc \
        "SELECT count(*) FROM outbox WHERE published_at IS NOT NULL" | tr -d '[:space:]')
    OUTBOX_PENDING=$(psql -h "$SOCK" -p "$PGPORT" -U postgres -d julink_social -tAc \
        "SELECT count(*) FROM outbox WHERE published_at IS NULL" | tr -d '[:space:]')
    if [ "${OUTBOX_PUBLISHED:-0}" -gt 0 ] && [ "${OUTBOX_PENDING:-0}" = "0" ]; then
        break
    fi
    sleep 0.5
done
check_bool "outbox events were published to NATS" "$([ "${OUTBOX_PUBLISHED:-0}" -gt 0 ] && echo 1 || echo 0)"
check_bool "outbox has no permanently stuck events" "$([ "${OUTBOX_PENDING:-0}" = "0" ] && echo 1 || echo 0)"

echo
echo "== result: $pass passed, $fail failed =="
if [ "$fail" -ne 0 ]; then
    echo "--- social log ---" >&2
    tail -60 "$LOG/social.log" >&2
    echo "--- gateway log ---" >&2
    tail -30 "$LOG/gateway.log" >&2
    echo "--- identity log ---" >&2
    tail -30 "$LOG/identity.log" >&2
    echo "--- neo4j log ---" >&2
    tail -40 "$LOG/neo4j.log" >&2
    exit 1
fi
