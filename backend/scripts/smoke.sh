#!/usr/bin/env bash
# End-to-end smoke test for Phase 0 + Phase 1 auth.
#
# Requires: cargo, curl, jq, websocat, initdb, pg_ctl, createdb.
# On Nix:
#   nix shell nixpkgs#cargo nixpkgs#rustc nixpkgs#postgresql nixpkgs#websocat \
#     -c bash scripts/smoke.sh
#
# Uses isolated ports and a throwaway Postgres cluster; it never touches the
# Compose stack or any developer database.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME="${JULINK_SMOKE_DIR:-/tmp/opencode/julink-phase0}"
PGDATA="$RUNTIME/pgdata"
SOCK="$RUNTIME/sock"
LOG="$RUNTIME/logs"
PGPORT="${JULINK_SMOKE_PGPORT:-55432}"
IDENTITY_PORT="${JULINK_SMOKE_IDENTITY_PORT:-19000}"
GATEWAY_PORT="${JULINK_SMOKE_GATEWAY_PORT:-18080}"
SOCIAL_PORT="${JULINK_SMOKE_SOCIAL_PORT:-19001}"
REALTIME_PORT="${JULINK_SMOKE_REALTIME_PORT:-19006}"

for tool in cargo curl jq websocat initdb pg_ctl createdb; do
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
    [ -n "${SOCIAL_PID:-}" ] && kill "$SOCIAL_PID" 2>/dev/null
    [ -n "${REALTIME_PID:-}" ] && kill "$REALTIME_PID" 2>/dev/null
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

cd "$ROOT"
echo "== building =="
cargo build --quiet -p julink-identity -p julink-gateway -p julink-social -p julink-realtime

echo "== starting postgres =="
initdb -D "$PGDATA" -U postgres --auth=trust >/dev/null
pg_ctl -D "$PGDATA" -o "-p $PGPORT -k $SOCK -h 127.0.0.1" -l "$LOG/postgres.log" -w start >/dev/null
createdb -h "$SOCK" -p "$PGPORT" -U postgres julink_identity

echo "== starting identity =="
env PORT="$IDENTITY_PORT" \
    DATABASE_URL="postgres://postgres@127.0.0.1:$PGPORT/julink_identity" \
    RUN_MIGRATIONS=true DEV_AUTH=true DEV_OTP=true \
    JWT_ISSUER=julink JWT_TTL_SECONDS=900 REFRESH_TTL_SECONDS=3600 \
    OTP_SECRET=smoke-test-secret OTP_RESEND_COOLDOWN_SECONDS=0 \
    COOKIE_SECURE=false CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-identity" >"$LOG/identity.log" 2>&1 &
IDENTITY_PID=$!
wait_for "http://127.0.0.1:$IDENTITY_PORT/health/ready" identity "$LOG/identity.log"

echo "== starting social =="
env PORT="$SOCIAL_PORT" CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-social" >"$LOG/social.log" 2>&1 &
SOCIAL_PID=$!
wait_for "http://127.0.0.1:$SOCIAL_PORT/health/live" social "$LOG/social.log"

echo "== starting realtime =="
env PORT="$REALTIME_PORT" CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-realtime" >"$LOG/realtime.log" 2>&1 &
REALTIME_PID=$!
wait_for "http://127.0.0.1:$REALTIME_PORT/health/live" realtime "$LOG/realtime.log"

echo "== starting gateway =="
env PORT="$GATEWAY_PORT" \
    IDENTITY_URL="http://127.0.0.1:$IDENTITY_PORT" \
    SOCIAL_URL="http://127.0.0.1:$SOCIAL_PORT" \
    CONTENT_URL="http://127.0.0.1:19999" \
    FEED_URL="http://127.0.0.1:19998" \
    SEARCH_URL="http://127.0.0.1:19997" \
    MESSAGING_URL="http://127.0.0.1:19996" \
    REALTIME_WS_URL="ws://127.0.0.1:$REALTIME_PORT/ws" \
    CALLS_URL="http://127.0.0.1:19995" \
    COMMUNITY_URL="http://127.0.0.1:19994" \
    NOTIFICATIONS_URL="http://127.0.0.1:19993" \
    CORS_ORIGINS=http://localhost:3000 RUST_LOG=info \
    "$ROOT/target/debug/julink-gateway" >"$LOG/gateway.log" 2>&1 &
GATEWAY_PID=$!
wait_for "http://127.0.0.1:$GATEWAY_PORT/health/live" gateway "$LOG/gateway.log"

BASE="http://127.0.0.1:$GATEWAY_PORT"
JAR_LOGIN="$RUNTIME/cookies-login.txt"
JAR_REFRESH="$RUNTIME/cookies-refresh.txt"
JAR_RELOGIN="$RUNTIME/cookies-relogin.txt"
EMAIL="smoke@example.com"
OLD_PASSWORD="OriginalPass123"
NEW_PASSWORD="NewPass456!"
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
http_code() {
    curl -s -o /dev/null -w '%{http_code}' "$@"
}

echo "== gateway and auth checks =="
check "gateway health is public" 200 "$(http_code "$BASE/health/live")"
check "gateway metrics is public" 200 "$(http_code "$BASE/metrics")"
check "protected route rejects anonymous" 401 "$(http_code "$BASE/api/v1/auth/me")"
check "protected route rejects bad token" 401 "$(http_code -H 'authorization: Bearer nope' "$BASE/api/v1/auth/me")"

echo "== registration and OTP =="
REGISTER_CODE=$(curl -s -o "$RUNTIME/register.json" -w '%{http_code}' -X POST "$BASE/api/v1/auth/register" \
    -H 'content-type: application/json' \
    -d "{\"username\":\"smokeuser\",\"email\":\"$EMAIL\",\"password\":\"$OLD_PASSWORD\",\"display_name\":\"Smoke Test\"}")
check "registration sends an OTP" 202 "$REGISTER_CODE"
OTP=$(jq -r '.dev_code // empty' "$RUNTIME/register.json")
check_bool "dev OTP is returned" "$([ ${#OTP} -eq 6 ] && echo 1 || echo 0)"

check "duplicate registration is rejected" 409 "$(http_code -X POST "$BASE/api/v1/auth/register" \
    -H 'content-type: application/json' \
    -d "{\"username\":\"smokeuser\",\"email\":\"$EMAIL\",\"password\":\"$OLD_PASSWORD\",\"display_name\":\"Smoke Test\"}")"

check "OTP can be resent" 202 "$(curl -s -o "$RUNTIME/resend.json" -w '%{http_code}' -X POST "$BASE/api/v1/auth/otp/resend" \
    -H 'content-type: application/json' \
    -d "{\"email\":\"$EMAIL\",\"purpose\":\"register\"}")"
OTP=$(jq -r '.dev_code // empty' "$RUNTIME/resend.json")
check_bool "resent OTP is returned" "$([ ${#OTP} -eq 6 ] && echo 1 || echo 0)"

WRONG_OTP=$(printf '%06d' $(( (10#$OTP + 1) % 1000000 )))
check "wrong OTP is rejected" 400 "$(http_code -X POST "$BASE/api/v1/auth/verify-otp" \
    -H 'content-type: application/json' \
    -d "{\"email\":\"$EMAIL\",\"code\":\"$WRONG_OTP\",\"purpose\":\"register\"}")"

check "unverified login is rejected" 403 "$(http_code -X POST "$BASE/api/v1/auth/login" \
    -H 'content-type: application/json' \
    -d "{\"identifier\":\"$EMAIL\",\"password\":\"$OLD_PASSWORD\"}")"

check "OTP verification succeeds" 200 "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/v1/auth/verify-otp" \
    -H 'content-type: application/json' \
    -d "{\"email\":\"$EMAIL\",\"code\":\"$OTP\",\"purpose\":\"register\"}")"

echo "== login, refresh, logout =="
LOGIN_RESPONSE=$(curl -fsS -c "$JAR_LOGIN" -X POST "$BASE/api/v1/auth/login" \
    -H 'content-type: application/json' \
    -d "{\"identifier\":\"$EMAIL\",\"password\":\"$OLD_PASSWORD\"}")
ACCESS=$(echo "$LOGIN_RESPONSE" | jq -r .access_token)
check_bool "login returns an access token" "$([ -n "$ACCESS" ] && [ "$ACCESS" != "null" ] && echo 1 || echo 0)"
check_bool "login sets the HttpOnly refresh cookie" "$(grep -q julink_refresh "$JAR_LOGIN" && echo 1 || echo 0)"

ME=$(curl -fsS -H "authorization: Bearer $ACCESS" "$BASE/api/v1/auth/me")
check "me returns the profile" "smokeuser" "$(echo "$ME" | jq -r .username)"
check "me reports a verified email" "true" "$(echo "$ME" | jq -r .email_verified)"

REFRESH_RESPONSE=$(curl -fsS -b "$JAR_LOGIN" -c "$JAR_REFRESH" -X POST "$BASE/api/v1/auth/refresh")
ACCESS2=$(echo "$REFRESH_RESPONSE" | jq -r .access_token)
check_bool "refresh returns a new access token" "$([ -n "$ACCESS2" ] && [ "$ACCESS2" != "null" ] && [ "$ACCESS2" != "$ACCESS" ] && echo 1 || echo 0)"
check "rotated access token works" "smokeuser" "$(curl -fsS -H "authorization: Bearer $ACCESS2" "$BASE/api/v1/auth/me" | jq -r .username)"
check "replayed refresh token is rejected" 401 "$(http_code -b "$JAR_LOGIN" -X POST "$BASE/api/v1/auth/refresh")"

ACCESS3=$(curl -fsS -c "$JAR_RELOGIN" -X POST "$BASE/api/v1/auth/login" \
    -H 'content-type: application/json' \
    -d "{\"identifier\":\"$EMAIL\",\"password\":\"$OLD_PASSWORD\"}" | jq -r .access_token)
check_bool "second login works" "$([ -n "$ACCESS3" ] && [ "$ACCESS3" != "null" ] && echo 1 || echo 0)"
check "logout succeeds" 204 "$(http_code -b "$JAR_RELOGIN" -c "$JAR_RELOGIN" -X POST "$BASE/api/v1/auth/logout")"
check "refresh after logout is rejected" 401 "$(http_code -b "$JAR_RELOGIN" -X POST "$BASE/api/v1/auth/refresh")"

echo "== password reset =="
check "forgot password sends an OTP" 202 "$(curl -s -o "$RUNTIME/forgot.json" -w '%{http_code}' -X POST "$BASE/api/v1/auth/password/forgot" \
    -H 'content-type: application/json' -d "{\"email\":\"$EMAIL\"}")"
RESET_OTP=$(jq -r '.dev_code // empty' "$RUNTIME/forgot.json")
check_bool "reset OTP is returned" "$([ ${#RESET_OTP} -eq 6 ] && echo 1 || echo 0)"

check "password reset succeeds" 200 "$(http_code -X POST "$BASE/api/v1/auth/password/reset" \
    -H 'content-type: application/json' \
    -d "{\"email\":\"$EMAIL\",\"code\":\"$RESET_OTP\",\"new_password\":\"$NEW_PASSWORD\"}")"
check "old password is rejected" 401 "$(http_code -X POST "$BASE/api/v1/auth/login" \
    -H 'content-type: application/json' \
    -d "{\"identifier\":\"$EMAIL\",\"password\":\"$OLD_PASSWORD\"}")"
NEW_LOGIN=$(curl -fsS -c "$RUNTIME/cookies-new.txt" -X POST "$BASE/api/v1/auth/login" \
    -H 'content-type: application/json' \
    -d "{\"identifier\":\"$EMAIL\",\"password\":\"$NEW_PASSWORD\"}")
NEW_ACCESS=$(echo "$NEW_LOGIN" | jq -r .access_token)
check_bool "new password is accepted" "$([ -n "$NEW_ACCESS" ] && [ "$NEW_ACCESS" != "null" ] && echo 1 || echo 0)"

echo "== routing =="
SOCIAL=$(curl -fsS -H "authorization: Bearer $NEW_ACCESS" "$BASE/api/v1/follow/ping")
check "gateway routes to social" "social" "$(echo "$SOCIAL" | jq -r .service)"
check "unknown prefix is 404" 404 "$(http_code -H "authorization: Bearer $NEW_ACCESS" "$BASE/api/v1/does-not-exist")"
check "dead upstream is 502" 502 "$(http_code -H "authorization: Bearer $NEW_ACCESS" "$BASE/api/v1/posts/ping")"

echo "== websocket check =="
WS_REPLY=$(printf 'ping-through-gateway' | timeout 5 websocat -1 "ws://127.0.0.1:$GATEWAY_PORT/ws" 2>>"$LOG/websocat.log" || true)
check "gateway proxies websocket to realtime" "ping-through-gateway" "$WS_REPLY"

echo
echo "== result: $pass passed, $fail failed =="
if [ "$fail" -ne 0 ]; then
    echo "--- gateway log ---" >&2
    tail -40 "$LOG/gateway.log" >&2
    echo "--- identity log ---" >&2
    tail -40 "$LOG/identity.log" >&2
    exit 1
fi
