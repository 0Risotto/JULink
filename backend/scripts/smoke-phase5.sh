#!/usr/bin/env bash
# End-to-end messaging + realtime + calls smoke test (Phase 5).
#
# Requires: cargo, curl, jq, initdb, pg_ctl, createdb, psql,
#           nats-server, websocat.
# On Nix:
#   nix shell nixpkgs#cargo nixpkgs#rustc nixpkgs#postgresql \
#     nixpkgs#nats-server nixpkgs#websocat -c bash scripts/smoke-phase5.sh
#
# Uses isolated ports and throwaway Postgres/NATS instances.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME="${JULINK_PHASE5_SMOKE_DIR:-/tmp/opencode/julink-phase5-smoke}"
PGDATA="$RUNTIME/pgdata"
SOCK="$RUNTIME/sock"
LOG="$RUNTIME/logs"
PGPORT="${JULINK_PHASE5_SMOKE_PGPORT:-55436}"
NATS_PORT="${JULINK_PHASE5_SMOKE_NATS_PORT:-14224}"
NATS_MONITOR_PORT="${JULINK_PHASE5_SMOKE_NATS_MONITOR_PORT:-18224}"
IDENTITY_PORT="${JULINK_PHASE5_SMOKE_IDENTITY_PORT:-19040}"
MESSAGING_PORT="${JULINK_PHASE5_SMOKE_MESSAGING_PORT:-19041}"
REALTIME_PORT="${JULINK_PHASE5_SMOKE_REALTIME_PORT:-19042}"
CALLS_PORT="${JULINK_PHASE5_SMOKE_CALLS_PORT:-19043}"
COMMUNITY_PORT="${JULINK_PHASE5_SMOKE_COMMUNITY_PORT:-19044}"
NOTIFICATIONS_PORT="${JULINK_PHASE5_SMOKE_NOTIFICATIONS_PORT:-19045}"
GATEWAY_PORT="${JULINK_PHASE5_SMOKE_GATEWAY_PORT:-18085}"

for tool in cargo curl jq initdb pg_ctl createdb psql nats-server websocat; do
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
    [ -n "${NOTIFICATIONS_PID:-}" ] && kill "$NOTIFICATIONS_PID" 2>/dev/null
    [ -n "${COMMUNITY_PID:-}" ] && kill "$COMMUNITY_PID" 2>/dev/null
    [ -n "${CALLS_PID:-}" ] && kill "$CALLS_PID" 2>/dev/null
    [ -n "${REALTIME_PID:-}" ] && kill "$REALTIME_PID" 2>/dev/null
    [ -n "${MESSAGING_PID:-}" ] && kill "$MESSAGING_PID" 2>/dev/null
    [ -n "${IDENTITY_PID:-}" ] && kill "$IDENTITY_PID" 2>/dev/null
    [ -n "${NATS_PID:-}" ] && kill "$NATS_PID" 2>/dev/null
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
cargo build --quiet -p julink-identity -p julink-messaging -p julink-realtime -p julink-calls -p julink-community -p julink-notifications -p julink-gateway

echo "== starting nats =="
nats-server -p "$NATS_PORT" -m "$NATS_MONITOR_PORT" -js -sd "$RUNTIME/nats" \
    >"$LOG/nats.log" 2>&1 &
NATS_PID=$!
wait_for "http://127.0.0.1:$NATS_MONITOR_PORT/healthz" nats "$LOG/nats.log"

echo "== starting postgres =="
initdb -D "$PGDATA" -U postgres --auth=trust >/dev/null
pg_ctl -D "$PGDATA" -o "-p $PGPORT -k $SOCK -h 127.0.0.1" -l "$LOG/postgres.log" -w start >/dev/null
for db in julink_identity julink_messaging julink_calls julink_community julink_notifications; do
    createdb -h "$SOCK" -p "$PGPORT" -U postgres "$db"
done

echo "== starting identity =="
env PORT="$IDENTITY_PORT" \
    DATABASE_URL="postgres://postgres@127.0.0.1:$PGPORT/julink_identity" \
    RUN_MIGRATIONS=true DEV_AUTH=true DEV_OTP=true \
    JWT_ISSUER=julink JWT_TTL_SECONDS=900 REFRESH_TTL_SECONDS=3600 \
    OTP_SECRET=phase5-smoke-secret OTP_RESEND_COOLDOWN_SECONDS=0 \
    COOKIE_SECURE=false CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-identity" >"$LOG/identity.log" 2>&1 &
IDENTITY_PID=$!
wait_for "http://127.0.0.1:$IDENTITY_PORT/health/ready" identity "$LOG/identity.log"

echo "== starting messaging =="
env PORT="$MESSAGING_PORT" \
    MESSAGING_DATABASE_URL="postgres://postgres@127.0.0.1:$PGPORT/julink_messaging" \
    RUN_MIGRATIONS=true \
    IDENTITY_URL="http://127.0.0.1:$IDENTITY_PORT" \
    NATS_URL="nats://127.0.0.1:$NATS_PORT" \
    CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-messaging" >"$LOG/messaging.log" 2>&1 &
MESSAGING_PID=$!
wait_for "http://127.0.0.1:$MESSAGING_PORT/health/ready" messaging "$LOG/messaging.log"

echo "== starting realtime =="
env PORT="$REALTIME_PORT" \
    MESSAGING_URL="http://127.0.0.1:$MESSAGING_PORT" \
    NATS_URL="nats://127.0.0.1:$NATS_PORT" \
    TICKET_TTL_SECONDS=30 \
    CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-realtime" >"$LOG/realtime.log" 2>&1 &
REALTIME_PID=$!
wait_for "http://127.0.0.1:$REALTIME_PORT/health/live" realtime "$LOG/realtime.log"

echo "== starting calls =="
env PORT="$CALLS_PORT" \
    CALLS_DATABASE_URL="postgres://postgres@127.0.0.1:$PGPORT/julink_calls" \
    RUN_MIGRATIONS=true \
    IDENTITY_URL="http://127.0.0.1:$IDENTITY_PORT" \
    MESSAGING_URL="http://127.0.0.1:$MESSAGING_PORT" \
    NATS_URL="nats://127.0.0.1:$NATS_PORT" \
    JITSI_BASE_URL=https://meet.jit.si \
    CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-calls" >"$LOG/calls.log" 2>&1 &
CALLS_PID=$!
wait_for "http://127.0.0.1:$CALLS_PORT/health/ready" calls "$LOG/calls.log"

echo "== starting community =="
env PORT="$COMMUNITY_PORT" \
    COMMUNITY_DATABASE_URL="postgres://postgres@127.0.0.1:$PGPORT/julink_community" \
    RUN_MIGRATIONS=true CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-community" >"$LOG/community.log" 2>&1 &
COMMUNITY_PID=$!
wait_for "http://127.0.0.1:$COMMUNITY_PORT/health/ready" community "$LOG/community.log"

echo "== starting notifications =="
env PORT="$NOTIFICATIONS_PORT" \
    NOTIFICATIONS_DATABASE_URL="postgres://postgres@127.0.0.1:$PGPORT/julink_notifications" \
    RUN_MIGRATIONS=true \
    MESSAGING_URL="http://127.0.0.1:$MESSAGING_PORT" \
    NATS_URL="nats://127.0.0.1:$NATS_PORT" \
    CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-notifications" >"$LOG/notifications.log" 2>&1 &
NOTIFICATIONS_PID=$!
wait_for "http://127.0.0.1:$NOTIFICATIONS_PORT/health/ready" notifications "$LOG/notifications.log"

echo "== starting gateway =="
env PORT="$GATEWAY_PORT" \
    IDENTITY_URL="http://127.0.0.1:$IDENTITY_PORT" \
    MESSAGING_URL="http://127.0.0.1:$MESSAGING_PORT" \
    REALTIME_URL="http://127.0.0.1:$REALTIME_PORT" \
    REALTIME_WS_URL="ws://127.0.0.1:$REALTIME_PORT/ws" \
    CALLS_URL="http://127.0.0.1:$CALLS_PORT" \
    COMMUNITY_URL="http://127.0.0.1:$COMMUNITY_PORT" \
    NOTIFICATIONS_URL="http://127.0.0.1:$NOTIFICATIONS_PORT" \
    SOCIAL_URL="http://127.0.0.1:19959" \
    CONTENT_URL="http://127.0.0.1:19958" \
    FEED_URL="http://127.0.0.1:19957" \
    SEARCH_URL="http://127.0.0.1:19956" \
    CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-gateway" >"$LOG/gateway.log" 2>&1 &
GATEWAY_PID=$!
wait_for "http://127.0.0.1:$GATEWAY_PORT/health/live" gateway "$LOG/gateway.log"

BASE="http://127.0.0.1:$GATEWAY_PORT"
PASSWORD="Phase5Pass123"
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

ticket_for() {
    curl -fsS -X POST "$BASE/api/v1/ws/ticket" \
        -H "authorization: Bearer $1" | jq -r .ticket
}

ws_once() {
    local ticket="$1" frame="$2"
    printf '%s' "$frame" | timeout 8 websocat -1 \
        "ws://127.0.0.1:$GATEWAY_PORT/ws?ticket=$ticket" 2>/dev/null || true
}

conversation_field() {
    local json="$1" id="$2" field="$3"
    echo "$json" | jq -r --arg id "$id" --arg field "$field" \
        '.[] | select(.id == $id) | getpath($field | split("."))'
}

echo "== creating users =="
ALICE=$(create_user alice alice@example.com)
BOB=$(create_user bob bob@example.com)
CAROL=$(create_user carol carol@example.com)
DAVE=$(create_user dave dave@example.com)
check_bool "four users registered" "$([ -n "$ALICE$BOB$CAROL$DAVE" ] && echo 1 || echo 0)"

echo "== messaging =="
DM=$(auth_json "$ALICE" POST "$BASE/api/v1/chat/conversations/dm" '{"target_username":"bob"}')
DM_ID=$(echo "$DM" | jq -r .id)
check_bool "DM created" "$([ -n "$DM_ID" ] && [ "$DM_ID" != "null" ] && echo 1 || echo 0)"
DM_AGAIN=$(auth_json "$ALICE" POST "$BASE/api/v1/chat/conversations/dm" '{"target_username":"bob"}')
check "duplicate DM reuses the conversation" "$DM_ID" "$(echo "$DM_AGAIN" | jq -r .id)"

MESSAGE=$(auth_json "$ALICE" POST "$BASE/api/v1/chat/conversations/$DM_ID/messages" '{"body":"Hello Bob"}')
MESSAGE_ID=$(echo "$MESSAGE" | jq -r .id)
check "message body stored" "Hello Bob" "$(echo "$MESSAGE" | jq -r .body)"

BOB_CONVS=$(auth_json "$BOB" GET "$BASE/api/v1/chat/conversations")
check "bob sees one unread DM message" "1" "$(conversation_field "$BOB_CONVS" "$DM_ID" unread_count)"
check "bob sees the last message" "Hello Bob" "$(conversation_field "$BOB_CONVS" "$DM_ID" last_message.body)"

BOB_MESSAGES=$(auth_json "$BOB" GET "$BASE/api/v1/chat/conversations/$DM_ID/messages")
check "bob can read the message" "1" "$(echo "$BOB_MESSAGES" | jq -r '.items | length')"
check "message pagination has no cursor" "null" "$(echo "$BOB_MESSAGES" | jq -r '.next_cursor')"

check "bob marks the DM read" 204 "$(http_code -X POST \
    "$BASE/api/v1/chat/conversations/$DM_ID/read" \
    -H "authorization: Bearer $BOB" -H 'content-type: application/json' \
    -d "{\"message_id\":\"$MESSAGE_ID\"}")"
check "unread count is cleared" "0" \
    "$(conversation_field "$(auth_json "$BOB" GET "$BASE/api/v1/chat/conversations")" "$DM_ID" unread_count)"

EDITED=$(auth_json "$ALICE" PATCH "$BASE/api/v1/chat/messages/$MESSAGE_ID" '{"body":"Hello Bob edited"}')
check "message edit works" "Hello Bob edited" "$(echo "$EDITED" | jq -r .body)"
check "bob sees the edit" "Hello Bob edited" \
    "$(auth_json "$BOB" GET "$BASE/api/v1/chat/conversations/$DM_ID/messages" | jq -r '.items[0].body')"

BOB_MESSAGE=$(auth_json "$BOB" POST "$BASE/api/v1/chat/conversations/$DM_ID/messages" '{"body":"Hi Alice"}')
BOB_MESSAGE_ID=$(echo "$BOB_MESSAGE" | jq -r .id)
check "alice has one unread reply" "1" \
    "$(conversation_field "$(auth_json "$ALICE" GET "$BASE/api/v1/chat/conversations")" "$DM_ID" unread_count)"
check "alice marks the reply read" 204 "$(http_code -X POST \
    "$BASE/api/v1/chat/conversations/$DM_ID/read" \
    -H "authorization: Bearer $ALICE" -H 'content-type: application/json' \
    -d "{\"message_id\":\"$BOB_MESSAGE_ID\"}")"
check "empty text message is rejected" 400 "$(http_code -X POST \
    "$BASE/api/v1/chat/conversations/$DM_ID/messages" \
    -H "authorization: Bearer $ALICE" -H 'content-type: application/json' \
    -d '{"kind":"text","body":""}')"

echo "== groups =="
GROUP=$(auth_json "$ALICE" POST "$BASE/api/v1/chat/conversations/group" \
    '{"title":"Study Group","member_usernames":["bob","carol"]}')
GROUP_ID=$(echo "$GROUP" | jq -r .id)
check "group created with three members" "3" "$(echo "$GROUP" | jq -r '.members | length')"
check "non-admin cannot update the group" 403 "$(http_code -X PATCH \
    "$BASE/api/v1/chat/conversations/$GROUP_ID/group" \
    -H "authorization: Bearer $BOB" -H 'content-type: application/json' \
    -d '{"title":"Hijacked"}')"
UPDATED_GROUP=$(auth_json "$ALICE" PATCH "$BASE/api/v1/chat/conversations/$GROUP_ID/group" \
    '{"title":"Study Group 2"}')
check "admin updates the group title" "Study Group 2" "$(echo "$UPDATED_GROUP" | jq -r .title)"

WITH_DAVE=$(auth_json "$ALICE" POST "$BASE/api/v1/chat/conversations/$GROUP_ID/members" \
    '{"usernames":["dave"]}')
check "admin adds a member" "4" "$(echo "$WITH_DAVE" | jq -r '.members | length')"
ADMIN_DAVE=$(auth_json "$ALICE" PATCH \
    "$BASE/api/v1/chat/conversations/$GROUP_ID/members/dave/admin" '{"admin":true}')
check "dave becomes an admin" "admin" \
    "$(echo "$ADMIN_DAVE" | jq -r '.members[] | select(.username == "dave") | .role')"

DAVE_MESSAGE=$(auth_json "$DAVE" POST "$BASE/api/v1/chat/conversations/$GROUP_ID/messages" \
    '{"body":"Dave here"}')
check "new admin can send to the group" "Dave here" "$(echo "$DAVE_MESSAGE" | jq -r .body)"
check "carol leaves the group" 204 "$(http_code -X POST \
    "$BASE/api/v1/chat/conversations/$GROUP_ID/leave" -H "authorization: Bearer $CAROL")"
check "former member cannot read the group" 403 "$(http_code \
    -H "authorization: Bearer $CAROL" "$BASE/api/v1/chat/conversations/$GROUP_ID/messages")"
check "bob sees dave's group message" "Dave here" \
    "$(auth_json "$BOB" GET "$BASE/api/v1/chat/conversations/$GROUP_ID/messages" | jq -r '.items[0].body')"

echo "== realtime =="
ALICE_TICKET=$(ticket_for "$ALICE")
check_bool "ticket issued" "$([ -n "$ALICE_TICKET" ] && [ "$ALICE_TICKET" != "null" ] && echo 1 || echo 0)"

PONG=$(ws_once "$ALICE_TICKET" '{"type":"ping"}')
check "websocket ping/pong" "true" "$(echo "$PONG" | grep -q '"pong"' && echo true || echo false)"

ALICE_TICKET=$(ticket_for "$ALICE")
SUBSCRIBED=$(ws_once "$ALICE_TICKET" "{\"type\":\"subscribe\",\"conversation_id\":\"$DM_ID\"}")
check "member subscribes to the DM" "true" "$(echo "$SUBSCRIBED" | grep -q '"subscribed"' && echo true || echo false)"

CAROL_TICKET=$(ticket_for "$CAROL")
FORBIDDEN=$(ws_once "$CAROL_TICKET" "{\"type\":\"subscribe\",\"conversation_id\":\"$DM_ID\"}")
check "non-member subscription is rejected" "true" \
    "$(echo "$FORBIDDEN" | grep -q '"forbidden"' && echo true || echo false)"

ALICE_TICKET=$(ticket_for "$ALICE")
WS_SEND=$(ws_once "$ALICE_TICKET" \
    "{\"type\":\"send_message\",\"conversation_id\":\"$DM_ID\",\"kind\":\"text\",\"body\":\"WS hello\",\"client_id\":\"c1\"}")
check "websocket message send is accepted" "true" \
    "$(echo "$WS_SEND" | grep -Eq '"sent"|"message.created"' && echo true || echo false)"
check "websocket message persisted" "WS hello" \
    "$(auth_json "$BOB" GET "$BASE/api/v1/chat/conversations/$DM_ID/messages" | jq -r '.items[0].body')"

BOB_TICKET=$(ticket_for "$BOB")
WS_READ=$(ws_once "$BOB_TICKET" \
    "{\"type\":\"read\",\"conversation_id\":\"$DM_ID\",\"message_id\":\"$BOB_MESSAGE_ID\"}")
check "websocket read is acknowledged" "true" \
    "$(echo "$WS_READ" | grep -Eq '"read_ack"|"read.updated"' && echo true || echo false)"

echo "== calls =="
CALL=$(auth_json "$ALICE" POST "$BASE/api/v1/calls/direct" \
    '{"target_username":"bob","call_type":"video"}')
CALL_ID=$(echo "$CALL" | jq -r .id)
check "direct call starts ringing" "ringing" "$(echo "$CALL" | jq -r .status)"
check "jitsi url generated" "true" "$(echo "$CALL" | jq -r '.jitsi_url | contains("meet.jit.si")')"
check "direct call has two participants" "2" "$(echo "$CALL" | jq -r '.participants | length')"
check "bob sees the ringing call" "true" \
    "$(auth_json "$BOB" GET "$BASE/api/v1/calls/active" | jq -r --arg id "$CALL_ID" 'any(.[]; .id == $id)')"
check "non-participant cannot accept" 403 "$(http_code -X POST \
    "$BASE/api/v1/calls/$CALL_ID/accept" -H "authorization: Bearer $CAROL")"
check "bob accepts the call" "active" \
    "$(auth_json "$BOB" POST "$BASE/api/v1/calls/$CALL_ID/accept" | jq -r .status)"
check "bob ends the call" "ended" \
    "$(auth_json "$BOB" POST "$BASE/api/v1/calls/$CALL_ID/end" | jq -r .status)"

GROUP_CALL=$(auth_json "$ALICE" POST "$BASE/api/v1/calls/group" \
    "{\"conversation_id\":\"$GROUP_ID\",\"call_type\":\"audio\"}")
GROUP_CALL_ID=$(echo "$GROUP_CALL" | jq -r .id)
check "group call starts ringing" "ringing" "$(echo "$GROUP_CALL" | jq -r .status)"
check "group call is scoped to the conversation" "group" "$(echo "$GROUP_CALL" | jq -r .scope)"
check_bool "group call has the remaining members" \
    "$([ "$(echo "$GROUP_CALL" | jq -r '.participants | length')" -ge 3 ] && echo 1 || echo 0)"
check "bob accepts the group call" "active" \
    "$(auth_json "$BOB" POST "$BASE/api/v1/calls/$GROUP_CALL_ID/accept" | jq -r .status)"
check "alice sees the active group call" "true" \
    "$(auth_json "$ALICE" GET "$BASE/api/v1/calls/active" | jq -r --arg id "$GROUP_CALL_ID" 'any(.[]; .id == $id)')"
check "alice ends the group call" "ended" \
    "$(auth_json "$ALICE" POST "$BASE/api/v1/calls/$GROUP_CALL_ID/end" | jq -r .status)"

DECLINE_CALL=$(auth_json "$ALICE" POST "$BASE/api/v1/calls/direct" \
    '{"target_username":"carol","call_type":"audio"}')
DECLINE_CALL_ID=$(echo "$DECLINE_CALL" | jq -r .id)
check "carol declines the call" "declined" \
    "$(auth_json "$CAROL" POST "$BASE/api/v1/calls/$DECLINE_CALL_ID/decline" | jq -r .status)"

CANCEL_CALL=$(auth_json "$ALICE" POST "$BASE/api/v1/calls/direct" \
    '{"target_username":"bob","call_type":"video"}')
CANCEL_CALL_ID=$(echo "$CANCEL_CALL" | jq -r .id)
check "caller cancels a ringing call" "cancelled" \
    "$(auth_json "$ALICE" POST "$BASE/api/v1/calls/$CANCEL_CALL_ID/cancel" | jq -r .status)"

HISTORY=$(auth_json "$BOB" GET "$BASE/api/v1/calls/history")
check_bool "bob's call history has multiple entries" \
    "$([ "$(echo "$HISTORY" | jq -r '.items | length')" -ge 2 ] && echo 1 || echo 0)"

echo "== profile =="
ME_PROFILE=$(auth_json "$ALICE" GET "$BASE/api/v1/profile/me")
check "profile me" "alice" "$(echo "$ME_PROFILE" | jq -r .username)"
UPDATED_PROFILE=$(auth_json "$ALICE" PATCH "$BASE/api/v1/profile/me" \
    '{"bio":"Hello","college":"Faculty of Science","theme_preference":"dark"}')
check "profile update" "Hello" "$(echo "$UPDATED_PROFILE" | jq -r .bio)"
check "public profile" "Hello" \
    "$(auth_json "$BOB" GET "$BASE/api/v1/profile/alice" | jq -r .bio)"
check "own username" "alice" \
    "$(auth_json "$ALICE" GET "$BASE/api/v1/profile/ownusername" | jq -r .username)"

echo "== community =="
LF=$(auth_json "$ALICE" POST "$BASE/api/v1/lost-and-founds" \
    '{"description":"Lost keys","college":"SCIENCE","image_url":"https://example.com/keys.png","phone_number":"123","type":"LOST"}')
LF_ID=$(echo "$LF" | jq -r .id)
check "lost and found created" "Lost keys" "$(echo "$LF" | jq -r .description)"
check "lost and found listed" "1" \
    "$(auth_json "$ALICE" GET "$BASE/api/v1/lost-and-founds?limit=20" | jq -r '.items | length')"
check "lost and found resolved" "true" \
    "$(auth_json "$ALICE" PATCH "$BASE/api/v1/lost-and-founds/$LF_ID/resolve" | jq -r .is_resolved)"
check "claim accepted" "success" \
    "$(auth_json "$BOB" POST "$BASE/api/v1/lost-and-founds/$LF_ID/claim" '{"message":"mine"}' | jq -r .status)"
check "report accepted" "success" \
    "$(auth_json "$BOB" POST "$BASE/api/v1/reports" '{"target_type":"POST","target_id":"abc","message":"spam"}' | jq -r .status)"

echo "== notifications =="
NOTIFS=""
for _ in $(seq 1 20); do
    NOTIFS=$(auth_json "$BOB" GET "$BASE/api/v1/notifications?limit=20")
    if [ "$(echo "$NOTIFS" | jq -r '.items | length')" -gt 0 ]; then
        break
    fi
    sleep 0.5
done
check_bool "message notification created" \
    "$(echo "$NOTIFS" | jq -r 'any(.items[]; .kind == "NEW_MESSAGE")')"
check_bool "call notification also created" \
    "$(echo "$NOTIFS" | jq -r 'any(.items[]; .kind == "CALL_INVITED")')"
check_bool "unread count is positive" \
    "$([ "$(auth_json "$BOB" GET "$BASE/api/v1/notifications/unread-count" | jq -r .unreadCount)" -gt 0 ] && echo 1 || echo 0)"
check "mark all read" "success" \
    "$(auth_json "$BOB" PATCH "$BASE/api/v1/notifications/read-all" | jq -r .status)"
check "unread count cleared" "0" \
    "$(auth_json "$BOB" GET "$BASE/api/v1/notifications/unread-count" | jq -r .unreadCount)"

echo "== outbox =="
OUTBOX_PUBLISHED=0
OUTBOX_PENDING=999
for _ in $(seq 1 40); do
    OUTBOX_PUBLISHED=$(psql -h "$SOCK" -p "$PGPORT" -U postgres -d julink_messaging -tAc \
        "SELECT count(*) FROM outbox WHERE published_at IS NOT NULL" | tr -d '[:space:]')
    OUTBOX_PENDING=$(psql -h "$SOCK" -p "$PGPORT" -U postgres -d julink_messaging -tAc \
        "SELECT count(*) FROM outbox WHERE published_at IS NULL" | tr -d '[:space:]')
    if [ "${OUTBOX_PUBLISHED:-0}" -gt 0 ] && [ "${OUTBOX_PENDING:-0}" = "0" ]; then
        break
    fi
    sleep 0.5
done
check_bool "messaging events were published to NATS" "$([ "${OUTBOX_PUBLISHED:-0}" -gt 0 ] && echo 1 || echo 0)"
check_bool "messaging outbox is drained" "$([ "${OUTBOX_PENDING:-0}" = "0" ] && echo 1 || echo 0)"

echo
echo "== result: $pass passed, $fail failed =="
if [ "$fail" -ne 0 ]; then
    echo "--- messaging log ---" >&2
    tail -60 "$LOG/messaging.log" >&2
    echo "--- realtime log ---" >&2
    tail -60 "$LOG/realtime.log" >&2
    echo "--- calls log ---" >&2
    tail -50 "$LOG/calls.log" >&2
    echo "--- gateway log ---" >&2
    tail -30 "$LOG/gateway.log" >&2
    exit 1
fi
