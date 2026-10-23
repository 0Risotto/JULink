#!/usr/bin/env bash
# End-to-end content smoke test (Phase 3).
#
# Requires: cargo, curl, jq, initdb, pg_ctl, createdb.
# On Nix:
#   nix shell nixpkgs#cargo nixpkgs#rustc nixpkgs#postgresql \
#     -c bash scripts/smoke-content.sh
#
# Uses isolated ports and a throwaway Postgres cluster.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME="${JULINK_CONTENT_SMOKE_DIR:-/tmp/opencode/julink-content-smoke}"
PGDATA="$RUNTIME/pgdata"
SOCK="$RUNTIME/sock"
LOG="$RUNTIME/logs"
PGPORT="${JULINK_CONTENT_SMOKE_PGPORT:-55434}"
IDENTITY_PORT="${JULINK_CONTENT_SMOKE_IDENTITY_PORT:-19020}"
GATEWAY_PORT="${JULINK_CONTENT_SMOKE_GATEWAY_PORT:-18083}"
CONTENT_PORT="${JULINK_CONTENT_SMOKE_CONTENT_PORT:-19021}"

for tool in cargo curl jq initdb pg_ctl createdb; do
    command -v "$tool" >/dev/null 2>&1 || {
        echo "missing required tool: $tool" >&2
        exit 1
    }
done

rm -rf "$RUNTIME"
mkdir -p "$SOCK" "$LOG"

cleanup() {
    set +e
    [ -n "${GATEWAY_PID:-}" ] && kill "$GATEWAY_PID" 2>/dev/null
    [ -n "${CONTENT_PID:-}" ] && kill "$CONTENT_PID" 2>/dev/null
    [ -n "${IDENTITY_PID:-}" ] && kill "$IDENTITY_PID" 2>/dev/null
    pg_ctl -D "$PGDATA" stop -m fast >/dev/null 2>&1
}
trap cleanup EXIT

wait_for() {
    local url="$1" name="$2" log="$3"
    for _ in $(seq 1 80); do
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
cargo build --quiet -p julink-identity -p julink-content -p julink-gateway

echo "== starting postgres =="
initdb -D "$PGDATA" -U postgres --auth=trust >/dev/null
pg_ctl -D "$PGDATA" -o "-p $PGPORT -k $SOCK -h 127.0.0.1" -l "$LOG/postgres.log" -w start >/dev/null
createdb -h "$SOCK" -p "$PGPORT" -U postgres julink_identity
createdb -h "$SOCK" -p "$PGPORT" -U postgres julink_content

echo "== starting identity =="
env PORT="$IDENTITY_PORT" \
    DATABASE_URL="postgres://postgres@127.0.0.1:$PGPORT/julink_identity" \
    RUN_MIGRATIONS=true DEV_AUTH=true DEV_OTP=true \
    JWT_ISSUER=julink JWT_TTL_SECONDS=900 REFRESH_TTL_SECONDS=3600 \
    OTP_SECRET=content-smoke-secret OTP_RESEND_COOLDOWN_SECONDS=0 \
    COOKIE_SECURE=false CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-identity" >"$LOG/identity.log" 2>&1 &
IDENTITY_PID=$!
wait_for "http://127.0.0.1:$IDENTITY_PORT/health/ready" identity "$LOG/identity.log"

echo "== starting content =="
env PORT="$CONTENT_PORT" \
    CONTENT_DATABASE_URL="postgres://postgres@127.0.0.1:$PGPORT/julink_content" \
    RUN_MIGRATIONS=true CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-content" >"$LOG/content.log" 2>&1 &
CONTENT_PID=$!
wait_for "http://127.0.0.1:$CONTENT_PORT/health/ready" content "$LOG/content.log"

echo "== starting gateway =="
env PORT="$GATEWAY_PORT" \
    IDENTITY_URL="http://127.0.0.1:$IDENTITY_PORT" \
    CONTENT_URL="http://127.0.0.1:$CONTENT_PORT" \
    SOCIAL_URL="http://127.0.0.1:19979" \
    FEED_URL="http://127.0.0.1:19978" \
    SEARCH_URL="http://127.0.0.1:19977" \
    MESSAGING_URL="http://127.0.0.1:19976" \
    REALTIME_WS_URL="ws://127.0.0.1:19975/ws" \
    CALLS_URL="http://127.0.0.1:19974" \
    COMMUNITY_URL="http://127.0.0.1:19973" \
    NOTIFICATIONS_URL="http://127.0.0.1:19972" \
    CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-gateway" >"$LOG/gateway.log" 2>&1 &
GATEWAY_PID=$!
wait_for "http://127.0.0.1:$GATEWAY_PORT/health/live" gateway "$LOG/gateway.log"

BASE="http://127.0.0.1:$GATEWAY_PORT"
PASSWORD="ContentPass123"
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
    local token="$1" body="$2"
    auth_json "$token" POST "$BASE/api/v1/posts" "{\"body\":$body}"
}

echo "== creating users =="
ALICE=$(create_user alice alice@example.com)
BOB=$(create_user bob bob@example.com)
check_bool "two users registered and logged in" "$([ -n "$ALICE$BOB" ] && echo 1 || echo 0)"

echo "== posts and media =="
POST_A=$(curl -fsS -X POST "$BASE/api/v1/posts" \
    -H "authorization: Bearer $ALICE" -H 'content-type: application/json' \
    -d '{"body":"Hello #Rust #JULink","media":[{"kind":"image","url":"https://example.com/a.png","width":800,"height":600}]}')
A_ID=$(echo "$POST_A" | jq -r .id)
check "post author" "alice" "$(echo "$POST_A" | jq -r .author_username)"
check "post body" "Hello #Rust #JULink" "$(echo "$POST_A" | jq -r .body)"
check "post hashtags" "julink,rust" "$(echo "$POST_A" | jq -r '.hashtags | sort | join(",")')"
check "post media" "1" "$(echo "$POST_A" | jq -r '.media | length')"
check "new post has no likes" "0" "$(echo "$POST_A" | jq -r .like_count)"

POST_B=$(create_post "$ALICE" '"Second #Rust"')
B_ID=$(echo "$POST_B" | jq -r .id)
POST_C=$(create_post "$ALICE" '"Third #Campus"')
C_ID=$(echo "$POST_C" | jq -r .id)
POST_D=$(curl -fsS -X POST "$BASE/api/v1/posts" \
    -H "authorization: Bearer $ALICE" -H 'content-type: application/json' \
    -d '{"body":"","media":[{"kind":"file","url":"https://example.com/doc.pdf"}]}')
D_ID=$(echo "$POST_D" | jq -r .id)
check_bool "media-only post is allowed" "$([ -n "$D_ID" ] && [ "$D_ID" != "null" ] && echo 1 || echo 0)"
check "empty post is rejected" 400 "$(http_code -X POST "$BASE/api/v1/posts" \
    -H "authorization: Bearer $ALICE" -H 'content-type: application/json' -d '{"body":"","media":[]}')"
check "invalid media kind is rejected" 400 "$(http_code -X POST "$BASE/api/v1/posts" \
    -H "authorization: Bearer $ALICE" -H 'content-type: application/json' \
    -d '{"body":"x","media":[{"kind":"audio","url":"https://example.com/a.mp3"}]}')"

echo "== reactions and favorites =="
LIKE=$(auth_json "$BOB" POST "$BASE/api/v1/posts/$A_ID/toggle-like")
check "like toggles on" "true" "$(echo "$LIKE" | jq -r .liked)"
check "like count is one" "1" "$(echo "$LIKE" | jq -r .like_count)"
UNLIKE=$(auth_json "$BOB" POST "$BASE/api/v1/posts/$A_ID/toggle-like")
check "like toggles off" "false" "$(echo "$UNLIKE" | jq -r .liked)"
auth_json "$BOB" POST "$BASE/api/v1/posts/$A_ID/toggle-like" >/dev/null

FAV=$(auth_json "$BOB" POST "$BASE/api/v1/posts/$A_ID/toggle-favorite")
check "favorite toggles on" "true" "$(echo "$FAV" | jq -r .favorited)"
check "favorites list contains the post" "$A_ID" \
    "$(auth_json "$BOB" GET "$BASE/api/v1/posts/favorites" | jq -r '.items[0].id')"
UNFAV=$(auth_json "$BOB" POST "$BASE/api/v1/posts/$A_ID/toggle-favorite")
check "favorite toggles off" "false" "$(echo "$UNFAV" | jq -r .favorited)"
check "favorites list is empty" "0" \
    "$(auth_json "$BOB" GET "$BASE/api/v1/posts/favorites" | jq -r '.items | length')"

check "impression is recorded" 204 "$(http_code -X POST "$BASE/api/v1/posts/$A_ID/impression" \
    -H "authorization: Bearer $BOB")"
check "impression count is one" "1" \
    "$(auth_json "$BOB" GET "$BASE/api/v1/posts/$A_ID" | jq -r .impression_count)"

echo "== comments and replies =="
COMMENT=$(curl -fsS -X POST "$BASE/api/v1/posts/$A_ID/comments" \
    -H "authorization: Bearer $BOB" -H 'content-type: application/json' \
    -d '{"body":"Nice #post"}')
COMMENT_ID=$(echo "$COMMENT" | jq -r .id)
check "comment author" "bob" "$(echo "$COMMENT" | jq -r .author_username)"
REPLY=$(curl -fsS -X POST "$BASE/api/v1/posts/$A_ID/comments" \
    -H "authorization: Bearer $ALICE" -H 'content-type: application/json' \
    -d "{\"body\":\"Thanks!\",\"parent_id\":\"$COMMENT_ID\"}")
REPLY_ID=$(echo "$REPLY" | jq -r .id)
check_bool "reply is created" "$([ -n "$REPLY_ID" ] && [ "$REPLY_ID" != "null" ] && echo 1 || echo 0)"
check "post comment count includes the reply" "2" \
    "$(auth_json "$ALICE" GET "$BASE/api/v1/posts/$A_ID" | jq -r .comment_count)"
check "top-level comment has one reply" "1" \
    "$(auth_json "$ALICE" GET "$BASE/api/v1/posts/$A_ID/comments" | jq -r '.items[0].reply_count')"
check "replies endpoint returns the reply" "$REPLY_ID" \
    "$(auth_json "$ALICE" GET "$BASE/api/v1/posts/comments/$COMMENT_ID/replies" | jq -r '.items[0].id')"

COMMENT_LIKE=$(auth_json "$ALICE" POST "$BASE/api/v1/posts/comments/$COMMENT_ID/toggle-like")
check "comment like count is one" "1" "$(echo "$COMMENT_LIKE" | jq -r .like_count)"
auth_json "$ALICE" DELETE "$BASE/api/v1/posts/comments/$COMMENT_ID/like" >/dev/null
auth_json "$ALICE" POST "$BASE/api/v1/posts/comments/$COMMENT_ID/toggle-like" >/dev/null

UPDATED_COMMENT=$(auth_json "$BOB" PUT "$BASE/api/v1/posts/comments/$COMMENT_ID" '{"body":"Nice post"}')
check "comment update" "Nice post" "$(echo "$UPDATED_COMMENT" | jq -r .body)"
check "non-author cannot delete a reply" 403 \
    "$(http_code -X DELETE "$BASE/api/v1/posts/comments/$REPLY_ID" -H "authorization: Bearer $BOB")"
check "author can delete a reply" 204 \
    "$(http_code -X DELETE "$BASE/api/v1/posts/comments/$REPLY_ID" -H "authorization: Bearer $ALICE")"
check "comment count after reply deletion" "1" \
    "$(auth_json "$ALICE" GET "$BASE/api/v1/posts/$A_ID" | jq -r .comment_count)"
check "author can delete a comment" 204 \
    "$(http_code -X DELETE "$BASE/api/v1/posts/comments/$COMMENT_ID" -H "authorization: Bearer $BOB")"
check "comment count after comment deletion" "0" \
    "$(auth_json "$ALICE" GET "$BASE/api/v1/posts/$A_ID" | jq -r .comment_count)"

echo "== updates and hashtags =="
UPDATED=$(auth_json "$ALICE" PUT "$BASE/api/v1/posts/$A_ID" '{"body":"Updated #Campus","media":[]}')
check "post body updated" "Updated #Campus" "$(echo "$UPDATED" | jq -r .body)"
check "hashtags updated" "campus" "$(echo "$UPDATED" | jq -r '.hashtags | sort | join(",")')"
check "media removed" "0" "$(echo "$UPDATED" | jq -r '.media | length')"
check "old hashtag no longer matches" "1" \
    "$(auth_json "$ALICE" GET "$BASE/api/v1/posts/hashtags/rust" | jq -r '.items | length')"
check "campus hashtag matches two posts" "2" \
    "$(auth_json "$ALICE" GET "$BASE/api/v1/posts/hashtags/campus" | jq -r '.items | length')"
check "trending hashtags puts campus first" "campus" \
    "$(auth_json "$ALICE" GET "$BASE/api/v1/posts/hashtags/trending" | jq -r '.[0].name')"

echo "== pagination and authorization =="
PAGE1=$(auth_json "$ALICE" GET "$BASE/api/v1/posts/user/alice?limit=2")
check "user posts first page" "2" "$(echo "$PAGE1" | jq -r '.items | length')"
CURSOR=$(echo "$PAGE1" | jq -r '.next_cursor // empty')
check_bool "user posts returns a cursor" "$([ -n "$CURSOR" ] && echo 1 || echo 0)"
PAGE2=$(auth_json "$ALICE" GET "$BASE/api/v1/posts/user/alice?limit=2&cursor=$CURSOR")
check "user posts second page" "2" "$(echo "$PAGE2" | jq -r '.items | length')"
check "invalid cursor is rejected" 400 \
    "$(http_code -H "authorization: Bearer $ALICE" "$BASE/api/v1/posts/user/alice?cursor=not-a-uuid")"
check "non-author cannot update a post" 403 \
    "$(http_code -X PUT "$BASE/api/v1/posts/$A_ID" -H "authorization: Bearer $BOB" \
        -H 'content-type: application/json' -d '{"body":"hacked","media":[]}')"
check "non-author cannot delete a post" 403 \
    "$(http_code -X DELETE "$BASE/api/v1/posts/$A_ID" -H "authorization: Bearer $BOB")"
check "author can delete a post" 204 \
    "$(http_code -X DELETE "$BASE/api/v1/posts/$A_ID" -H "authorization: Bearer $ALICE")"
check "deleted post is gone" 404 \
    "$(http_code -H "authorization: Bearer $ALICE" "$BASE/api/v1/posts/$A_ID")"

echo
echo "== result: $pass passed, $fail failed =="
if [ "$fail" -ne 0 ]; then
    echo "--- content log ---" >&2
    tail -60 "$LOG/content.log" >&2
    echo "--- gateway log ---" >&2
    tail -30 "$LOG/gateway.log" >&2
    echo "--- identity log ---" >&2
    tail -30 "$LOG/identity.log" >&2
    exit 1
fi
