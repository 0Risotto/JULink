# JULink Backend (Rust)

Rust rewrite of the JULink backend: an Axum gateway in front of feature-owned
services, with Postgres, Neo4j and NATS JetStream.

```
Next.js ──▶ gateway :8080 ──▶ identity / social / content / feed / search
                              messaging / realtime (WS) / calls
                              community / notifications
                     │
                     ├── NATS JetStream (events)
                     ├── Postgres (one database per service)
                     └── Neo4j (social graph, owned by `social`)
```

## Status: Phase 5 (messaging + realtime + calls)

Implemented:

- Cargo workspace with `common`, `proto`, `clients` and `testkit` crates.
- Axum gateway: JWT/JWKS validation, identity-header injection, CORS, request
  IDs, body limits, timeouts, `/health/*`, `/metrics`, HTTP reverse proxy and
  WebSocket upgrade proxy.
- Ed25519 access tokens with a `kid`; identity publishes JWKS and the gateway
  validates against it (refreshing the key set when an unknown `kid` appears).
- `identity` with Argon2id passwords, registration + email OTP, login,
  rotating refresh tokens in an `HttpOnly` cookie, logout/logout-all, and
  password reset. OTP delivery uses SMTP when configured, otherwise logs the
  code (development only). Internal user batch/list endpoints for feed/search.
- `social` with the follow/block graph in Neo4j, cursor-paginated follower and
  following lists, friends, mutuals, suggestions, block filtering, an internal
  followee endpoint for feed, and a Postgres transactional outbox relayed to
  NATS.
- `content` with posts, media metadata, hashtags, comments/replies, post and
  comment likes, favorites, impressions, cursor pagination, and internal feed
  endpoints for the feed/search services.
- `feed` aggregating social followees + content posts + identity author cards,
  with a short-lived followee cache, cursor pagination, and a global fallback
  for new accounts or when social is unavailable.
- `search` with a Postgres FTS read model, background sync from identity/content,
  a manual reindex endpoint, user/post/hashtag search, and `ts_headline`
  snippets.
- `messaging` with DMs, groups, membership/admin rules, messages, edits,
  deletes, read state, unread counts, media metadata, post shares, and a
  Postgres outbox relayed to NATS.
- `realtime` with single-use WebSocket tickets, authorized conversation
  subscriptions, typing/read/send frames, and NATS fan-out to conversation and
  user rooms.
- `calls` with direct/group Jitsi sessions, accept/decline/cancel/end, active
  calls and history. Media never passes through Rust.
- Docker Compose for Postgres, Neo4j, NATS and every service, plus a `full`
  profile for the remaining feature shells.

Not implemented yet (Phase 6+): notifications, reports/lost-and-found,
Cloudinary upload signing, JetStream stream provisioning and durable consumers,
gateway rate limiting, generated OpenAPI, contract tests, and the frontend
rewrite.

### Auth endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/register` | public | create user + send registration OTP |
| POST | `/api/v1/auth/verify-otp` | public | verify registration OTP |
| POST | `/api/v1/auth/otp/resend` | public | resend a registration OTP |
| POST | `/api/v1/auth/login` | public | access token + refresh cookie |
| POST | `/api/v1/auth/refresh` | cookie | rotate refresh token |
| POST | `/api/v1/auth/logout` | cookie | revoke family + clear cookie |
| POST | `/api/v1/auth/logout-all` | bearer | revoke every session |
| GET | `/api/v1/auth/me` | bearer | current profile |
| POST | `/api/v1/auth/password/forgot` | public | send reset OTP |
| POST | `/api/v1/auth/password/reset` | public | reset password + revoke sessions |
| POST | `/api/v1/auth/dev-token` | dev only | shortcut access token |

Refresh cookies are `HttpOnly`, `SameSite=Lax`, scoped to `/api/v1/auth`, and
marked `Secure` when `COOKIE_SECURE=true` (default in non-dev). The access token
stays in memory on the client; nothing sensitive is stored in `localStorage`.
Refresh-token replay revokes the whole token family.

With `DEV_OTP=true`, register/forgot responses include `dev_code` so local
testing does not need an SMTP server. Leave it off in production.

### Social endpoints

| Method | Path | Purpose |
|---|---|---|
| POST/DELETE | `/api/v1/follow/{username}` | follow / unfollow |
| GET | `/api/v1/follow/{username}/followers` | followers (cursor paginated) |
| GET | `/api/v1/follow/{username}/followings` | followings (cursor paginated) |
| GET | `/api/v1/follow/friends` | mutual followers of the current user |
| GET | `/api/v1/follow/{username}/is-following` | does the current user follow them? |
| GET | `/api/v1/follow/{username}/mutual` | is the relationship mutual? |
| GET | `/api/v1/follow/mutual-followings/{other}` | shared followings |
| GET | `/api/v1/follow/mutual-followers/{other}` | shared followers |
| GET | `/api/v1/follow/suggestion` | friends-of-friends suggestions |
| POST/DELETE | `/api/v1/blocks/{username}` | block / unblock |
| GET | `/api/v1/blocks` | current user's block list |
| GET | `/api/v1/blocks/{username}/status` | block state in both directions |

Graph rules:

- Neo4j stores `(:User {id, username})` with unique constraints on both.
- Blocks remove existing follows in both directions and are filtered out of
  every list, suggestion, and status query.
- Social never reads the identity database. Target usernames are resolved via
  identity's internal `/internal/users/by-username/{username}` endpoint.
- Follow/block mutations append to the `outbox` table in the `julink_social`
  database. A background relay publishes `social.<event>.v1` to NATS; the
  outbox remains durable if NATS is down. JetStream stream provisioning and
  durable consumers are Phase 3.
- Without `NEO4J_URI` or `DATABASE_URL`, the service starts in degraded mode:
  `/ping` and health work, graph endpoints return `503`, and outbox events are
  skipped. Compose always configures both.

### Content endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/posts` | create a post with text and/or media |
| GET/PUT/DELETE | `/api/v1/posts/{post_id}` | read/update/delete a post |
| GET | `/api/v1/posts/user/{username}` | a user's posts (cursor paginated) |
| GET | `/api/v1/posts/favorites` | current user's favorites |
| GET | `/api/v1/posts/hashtags/trending` | trending tags (last 7 days) |
| GET | `/api/v1/posts/hashtags/{name}` | posts carrying a hashtag |
| POST | `/api/v1/posts/{post_id}/toggle-like` | like/unlike |
| POST | `/api/v1/posts/{post_id}/toggle-favorite` | favorite/unfavorite |
| POST/DELETE | `/api/v1/posts/{post_id}/favorite` | explicit favorite state |
| POST/GET | `/api/v1/posts/{post_id}/comments` | add/list top-level comments |
| GET | `/api/v1/posts/comments/{comment_id}/replies` | replies to a comment |
| PUT/DELETE | `/api/v1/posts/comments/{comment_id}` | update/delete a comment |
| POST | `/api/v1/posts/comments/{comment_id}/toggle-like` | like/unlike a comment |
| POST/DELETE | `/api/v1/posts/comments/{comment_id}/like` | explicit comment like |
| POST | `/api/v1/posts/{post_id}/impression` | record an impression |

Content rules:

- Media is metadata only (`kind`, `url`, dimensions, duration). Upload signing
  for Cloudinary is a later increment; clients can currently submit an already
  uploaded URL.
- Hashtags are extracted from the body, lowercased and deduplicated. Updating a
  post replaces both its media and its hashtag links.
- Likes, favorites, comments and impressions update denormalized counters in
  the same transaction as the row change.
- Only the author may update or delete a post or comment; responses are `403`
  for other users.
- `deleted_at` exists on posts/comments but the current delete endpoints hard
  delete; soft-delete/moderation can be layered on later.
- The content service trusts gateway-injected `x-user-id` / `x-username`; it
  does not call identity for author data. The feed service enriches author
  cards in Phase 4.

### Feed endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/feed` | home feed (followees + self) |
| GET | `/api/v1/trending` | global recent feed |

Feed behavior:

- Reads followee usernames from social's internal endpoint, adds the current
  user, then asks content for those authors' posts.
- Caches followee lists for `FEED_CACHE_TTL_SECONDS` (default 60).
- Enriches posts with identity author cards via a batch internal call; falls
  back to username-only cards if identity is unavailable.
- If social is unavailable, or a brand-new account has no follows and no posts,
  the feed falls back to the global recent feed.
- Cursor pagination is delegated to content and validated at the gateway edge.

### Search endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/search?q=` | users + posts + hashtags |
| GET | `/api/v1/search/users?q=` | user search |
| GET | `/api/v1/search/posts?q=` | post search with snippets |
| GET | `/api/v1/search/hashtags?q=` | hashtag search |
| POST | `/internal/search/reindex` | force a read-model sync |

Search behavior:

- `search` owns `julink_search`; it never queries identity/content databases.
- A background sync pulls users from identity and recent posts from content and
  upserts them into `search_users` / `search_posts` (`tsvector` + GIN).
- `POST /internal/search/reindex` forces a sync; useful after seeding data.
- Queries use `websearch_to_tsquery('simple', ...)`, rank with `ts_rank`, and
  return `ts_headline` snippets for posts.
- Hashtag search is substring-based over the indexed post hashtags.
- Deleted posts may remain in the read model until the next reindex; full
  delete propagation is part of the eventing work.

### Messaging endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/chat/conversations` | conversations + unread counts |
| POST | `/api/v1/chat/conversations/dm` | create/reuse a DM |
| POST | `/api/v1/chat/conversations/group` | create a group |
| GET | `/api/v1/chat/conversations/{id}` | conversation detail |
| PATCH | `/api/v1/chat/conversations/{id}/group` | update title/avatar (admin) |
| POST | `/api/v1/chat/conversations/{id}/members` | add members (admin) |
| DELETE | `/api/v1/chat/conversations/{id}/members/{username}` | remove a member (admin) |
| PATCH | `/api/v1/chat/conversations/{id}/members/{username}/admin` | grant/revoke admin |
| POST | `/api/v1/chat/conversations/{id}/leave` | leave a conversation |
| GET/POST | `/api/v1/chat/conversations/{id}/messages` | list/send messages |
| PATCH/DELETE | `/api/v1/chat/messages/{id}` | edit/delete (sender only) |
| POST | `/api/v1/chat/conversations/{id}/read` | update read state |

Messaging rules:

- Message kinds: `text`, `image`, `video`, `file`, `audio`, `post_share`.
- DMs are unique per user pair (`dm_key`); creating one twice returns the same
  conversation.
- Only admins may update a group or manage members; only senders may edit or
  delete their messages.
- Read state is stored per member (`last_read_at` / `last_read_message_id`) and
  drives unread counts.
- Every mutation appends to the messaging outbox; the relay publishes
  `chat.<event>.v1` to NATS.

### Realtime protocol

- `POST /api/v1/ws/ticket` (bearer) returns a single-use ticket with a 30-second
  TTL. Connect to `/ws?ticket=...`.
- Client frames are JSON tagged by `type`:
  - `{"type":"ping"}`
  - `{"type":"subscribe","conversation_id":"..."}`
  - `{"type":"unsubscribe","conversation_id":"..."}`
  - `{"type":"typing","conversation_id":"...","typing":true}`
  - `{"type":"read","conversation_id":"...","message_id":"..."}`
  - `{"type":"send_message","conversation_id":"...","kind":"text","body":"...","client_id":"..."}`
- Subscription is authorized through messaging’s internal membership endpoint.
- Server frames include `pong`, `subscribed`, `unsubscribed`, `typing`,
  `read_ack`, `sent`, `error`, and every `chat.*` event from NATS
  (`message.created`, `message.updated`, `message.deleted`, `read.updated`).
- `calls.*` events are broadcast to `user:{id}` rooms for call invitations and
  state changes.
- The hub and ticket store are in-memory, so this is a single-instance design
  until presence/rooms move to Redis/NATS queue groups.

### Call endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/calls/direct` | call a user |
| POST | `/api/v1/calls/group` | call a conversation |
| POST | `/api/v1/calls/{id}/accept` | accept an invite |
| POST | `/api/v1/calls/{id}/decline` | decline an invite |
| POST | `/api/v1/calls/{id}/cancel` | cancel a ringing call (caller) |
| POST | `/api/v1/calls/{id}/end` | end an active call |
| GET | `/api/v1/calls/active` | ringing/active calls for the user |
| GET | `/api/v1/calls/history` | paginated call history |

Call rules:

- Jitsi owns the media plane; the response includes a `jitsi_url`
  (`JITSI_BASE_URL` + room name). No audio/video passes through Rust.
- Direct calls resolve the target via identity; group calls resolve members via
  messaging and reject non-members.
- Call state transitions publish `calls.session.created.v1` /
  `calls.session.updated.v1` with `participant_ids` for the realtime hub.
- Without NATS, call state still persists, but realtime notifications are not
  emitted.

## Layout

```
backend/
  Cargo.toml              # workspace
  crates/
    common/               # config, errors, auth extractor, health, metrics, server bootstrap
    proto/                # DTOs + versioned event contracts
    clients/              # typed service-to-service HTTP clients
    testkit/              # test scaffolding
  services/
    gateway/              # :8080  routing, auth, WS proxy
    identity/             # :9000  auth, tokens, users (Postgres)
    social/               # :9001  follow/block graph (Neo4j + outbox)
    content/              # :9002  posts/comments/reactions/media
    feed/                 # :9003  home feed read model
    search/               # :9004  Postgres FTS
    messaging/            # :9005  conversations/messages
    realtime/             # :9006  WebSocket hub
    calls/                # :9007  Jitsi session lifecycle
    community/            # :9008  lost & found + reports
    notifications/        # :9009  notifications
  deploy/
    compose.yml
    initdb/01-databases.sql
    nats.conf
    prometheus/prometheus.yml
  scripts/smoke.sh        # end-to-end Phase 0 + 1 smoke test
  scripts/smoke-social.sh # Phase 2 graph + outbox + NATS smoke test
  scripts/smoke-content.sh # Phase 3 posts/comments/reactions smoke test
  scripts/smoke-phase4.sh # Phase 4 feed + search smoke test
  scripts/smoke-phase5.sh # Phase 5 messaging + realtime + calls smoke test
```

## Prerequisites

- Rust 1.85+ (the workspace uses edition 2024). On Nix:
  `nix shell nixpkgs#cargo nixpkgs#rustc`
- Docker + Compose v2 for the infrastructure (not required to compile).

## Quick start with Compose

```bash
docker compose -f deploy/compose.yml up --build
```

This starts Postgres, Neo4j, NATS, identity and the gateway.

```bash
# 1. Issue a development access token (DEV_AUTH=true in compose)
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/dev-token \
  -H 'content-type: application/json' \
  -d '{"username":"demo"}' | jq -r .access_token)

# 2. Call a protected route through the gateway
curl -s http://localhost:8080/api/v1/auth/me \
  -H "authorization: Bearer $TOKEN"
```

Start every feature service too:

```bash
docker compose -f deploy/compose.yml --profile full up --build
```

## Local development without Docker

Start the infrastructure only:

```bash
docker compose -f deploy/compose.yml up -d postgres neo4j nats
```

Then run services directly (identity first, because the gateway fetches its
public key at startup):

```bash
cp .env.example .env
cargo run -p julink-identity
# in a second terminal
cargo run -p julink-gateway
```

Useful checks:

```bash
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
```

End-to-end smoke test (temporary Postgres, starts identity/social/realtime/gateway,
covers registration → OTP → login → refresh rotation → logout → password reset,
routing, 401/403/404/502 and the WebSocket proxy):

```bash
nix shell nixpkgs#cargo nixpkgs#rustc nixpkgs#postgresql nixpkgs#websocat \
  -c bash scripts/smoke.sh
```

Social graph smoke test (temporary Postgres + Neo4j + NATS; follows, blocks,
mutuals, suggestions, pagination and outbox publishing):

```bash
nix shell nixpkgs#cargo nixpkgs#rustc nixpkgs#postgresql nixpkgs#neo4j \
  nixpkgs#jdk nixpkgs#nats-server -c bash scripts/smoke-social.sh
```

Content smoke test (temporary Postgres; posts, media metadata, hashtags,
comments, replies, likes, favorites, impressions, authorization):

```bash
nix shell nixpkgs#cargo nixpkgs#rustc nixpkgs#postgresql \
  -c bash scripts/smoke-content.sh
```

Feed + search smoke test (temporary Postgres + Neo4j; follow graph, feed
aggregation/enrichment/fallback/pagination, FTS users/posts/hashtags, snippets):

```bash
nix shell nixpkgs#cargo nixpkgs#rustc nixpkgs#postgresql nixpkgs#neo4j \
  nixpkgs#jdk -c bash scripts/smoke-phase4.sh
```

Messaging + realtime + calls smoke test (temporary Postgres + NATS; DMs,
groups, unread counts, WebSocket tickets/frames, call lifecycle):

```bash
nix shell nixpkgs#cargo nixpkgs#rustc nixpkgs#postgresql \
  nixpkgs#nats-server nixpkgs#websocat -c bash scripts/smoke-phase5.sh
```

## Gateway routing

| Prefix | Service |
|---|---|
| `/api/v1/auth`, `/api/v1/users`, `/api/v1/profile` | identity |
| `/api/v1/follow`, `/api/v1/blocks` | social |
| `/api/v1/posts`, `/api/v1/comments`, `/api/v1/media` | content |
| `/api/v1/feed`, `/api/v1/trending` | feed |
| `/api/v1/search` | search |
| `/api/v1/chat` | messaging |
| `/ws` | realtime |
| `/api/v1/calls` | calls |
| `/api/v1/lost-found`, `/api/v1/reports` | community |
| `/api/v1/notifications` | notifications |

The gateway validates the access token, strips client-supplied `x-user-id` /
`x-username`, and injects the authenticated identity before forwarding.

## Configuration

All services read `BaseConfig` from the environment (see `.env.example`):

- `PORT`, `JULINK_ENV`, `LOG_FORMAT`, `RUST_LOG`, `CORS_ORIGINS`
- `DATABASE_URL`, `NATS_URL`
- `DEV_AUTH`, `RUN_MIGRATIONS`
- identity: `JWT_ISSUER`, `JWT_TTL_SECONDS`, optional `JWT_PRIVATE_KEY_PEM`
- gateway: `IDENTITY_URL`, `SOCIAL_URL`, `CONTENT_URL`, `FEED_URL`,
  `SEARCH_URL`, `MESSAGING_URL`, `REALTIME_WS_URL`, `CALLS_URL`,
  `COMMUNITY_URL`, `NOTIFICATIONS_URL`

If `JWT_PRIVATE_KEY_PEM` is unset, identity generates an ephemeral Ed25519 key
on startup and exposes the public PEM at `/internal/jwt/public-key` (internal
route; do not publish it through the gateway). The gateway retries the fetch
for up to 60 seconds.

In local development, restarting identity generates a new key, so restart the
gateway too (or set `JWT_PRIVATE_KEY_PEM` / `JWT_PUBLIC_KEY_PEM` for stable
keys across restarts).

## Security notes

- `DEV_AUTH` must never be enabled in production.
- Access tokens are short-lived; Phase 1 adds rotating refresh tokens in
  `HttpOnly` cookies with reuse detection.
- The old Spring `application.properties` contained committed credentials.
  Rotate the database, Gmail and Cloudinary secrets before reusing them.
