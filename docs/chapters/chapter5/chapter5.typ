#let chapter-number = 5

#show figure.where(kind: image): set figure(
  numbering: n => str(chapter-number) + "." + str(n),
)
#show figure.where(kind: table): set figure(
  numbering: n => str(chapter-number) + "." + str(n),
)
#show figure.where(kind: raw): set figure(
  numbering: n => str(chapter-number) + "." + str(n),
)
#show figure.where(kind: raw): set figure(supplement: [Listing])
#show figure.where(kind: raw): set figure.caption(position: bottom)
#show figure: set block(breakable: true)

#show raw.where(block: true): set text(size: 8.5pt)
#show raw.where(block: true): set par(justify: false)


== Project Implementation

This chapter presents and explains the key sections of the JULink source code that
illustrate the system's core functionality. JULink is implemented as a *Spring Boot*
backend organised into loosely-coupled, domain-driven bounded contexts (auth, profile,
follow, block, post, lostandfound, search, chat, video, notification, report) with a
React front-end. Relational data is persisted in *PostgreSQL* through Spring Data JPA,
while the social graph (follow and block relationships) is stored in a *Neo4j* graph
database. Real-time features (chat, typing indicators, read receipts, call signalling,
and live notifications) are delivered over *STOMP WebSocket*, authentication is stateless
using *JWT*, and media is hosted on *Cloudinary*. The listings below quote the actual
implementation of the most representative features.

=== Account Creation, Email Verification, and Stateless Sessions

Registration is the entry point to the platform and ties three subsystems together. The
`createUser` method validates the request (enforcing the `@ju.edu.jo` university-email
rule and rejecting duplicate usernames or emails), persists the user as *unverified*,
creates the matching node in the Neo4j social graph, and immediately dispatches a
one-time password (OTP) to the university email.

#figure(
  caption: [Registration: persistence, graph-node creation, and OTP dispatch (`AuthServiceImplementation`)],
  kind: raw,
)[
```java
private static final String JU_EMAIL_REGEX = "^[A-Za-z0-9._%+-]+@ju\\.edu\\.jo$";
private static final int OTP_EXPIRY_MINUTES = 3;

@Override
public void createUser(AuthDTOs.CreateUserRequestDTO dto) {
    validateCreateUserRequest(dto);            // JU email + uniqueness checks

    AuthEntities.User user = authMapper.toEntity(dto);
    user.setEmailVerified(false);              // account inactive until verified
    userRepository.save(user);                 // PostgreSQL
    followRepository.createUser(user.getUsername());   // Neo4j graph node
    sendOTP(user.getEmail());                  // dispatch verification code
}
```
]

The account stays inactive until the user submits the code. The verification window is
enforced at three minutes; on success the code is consumed and the user's email is flagged
as verified, which is the gate that login checks.

#figure(
  caption: [OTP dispatch and verification (`AuthServiceImplementation`)],
  kind: raw,
)[
```java
@Override
public void sendOTP(String email) {
    String cleanedEmail = cleanEmail(email);
    String otpCode = generateOTP();           // 6-digit code

    deleteExistingOTP(cleanedEmail);           // only the newest code is valid
    saveOTP(cleanedEmail, otpCode);            // stored with a 3-minute expiry
    sendOtpEmail(cleanedEmail, otpCode,
            "JUlink Account Verification OTP",
            "Verify your email address",
            "Use the verification code below to complete your JUlink account verification.");
}

@Override
public void verifyOTP(String otp, String email) {
    String cleanedEmail = cleanEmail(email);
    validateAndDeleteOTP(cleanedEmail, otp);   // checks match + expiry, then deletes
    AuthEntities.User user = findUserByEmail(cleanedEmail);
    user.setEmailVerified(true);               // activates the account
    userRepository.save(user);
}
```
]

Once verified, the user logs in and the server issues a stateless JSON Web Token. Because
the token is self-contained and signed, the server keeps no session state; every
subsequent request is authenticated by validating the JWT, which is why logout is handled
on the client by discarding the token.

#figure(
  caption: [Stateless JWT issuance (`TokenService`)],
  kind: raw,
)[
```java
public String generateToken(Authentication authentication) {
    Instant now = Instant.now();
    String scope = authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.joining(" "));
    JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("self")
            .issuedAt(now)
            .expiresAt(now.plus(1, ChronoUnit.HOURS))
            .subject(authentication.getName())
            .claim("scope", scope)
            .build();
    return this.encoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
}
```
]

=== The Social Graph and Built-in Privacy (Neo4j)

Follow relationships are modelled as a property graph in Neo4j, where every relationship
query is *block-aware*: a `FOLLOWS` edge is only created or traversed when no `BLOCKED`
edge exists in either direction. This pushes the privacy rule (FR22) down into the data
layer so it cannot be bypassed by a forgotten check in the service.

#figure(
  caption: [Block-aware follow relationship (`FollowRepository`, Cypher)],
  kind: raw,
)[
```cypher
MATCH (follower:User {username: $follower})
MATCH (followee:User {username: $followee})
WHERE NOT (follower)-[:BLOCKED]->(followee)
  AND NOT (followee)-[:BLOCKED]->(follower)
MERGE (follower)-[:FOLLOWS]->(followee)
```
]

The graph shape makes "mutual followers" a natural single traversal: the pattern matches
any user that both endpoints follow, while the `WHERE` clause filters out every account
involved in a block. The same pattern underpins friend suggestions and connection lists.

#figure(
  caption: [Mutual followers as a graph traversal (`FollowRepository`, Cypher)],
  kind: raw,
)[
```cypher
MATCH (u1:User {username: $username1})<-[:FOLLOWS]-(follower:User)-[:FOLLOWS]->(u2:User {username: $username2})
WHERE NOT (u1)-[:BLOCKED]->(u2)
  AND NOT (u2)-[:BLOCKED]->(u1)
  AND NOT (u1)-[:BLOCKED]->(follower)
  AND NOT (follower)-[:BLOCKED]->(u1)
  AND NOT (u2)-[:BLOCKED]->(follower)
  AND NOT (follower)-[:BLOCKED]->(u2)
RETURN follower.username AS username
ORDER BY follower.username
SKIP $skip
LIMIT $limit
```
]

=== Blocking that Severs Relationships in Both Directions

Blocking is a transactional operation spanning both databases. It rejects self-blocks,
persists the block record in PostgreSQL (idempotently, tolerating a concurrent duplicate),
removes the `FOLLOWS` edges in *both* directions, and finally records the `BLOCKED` edge in
the graph so all future graph queries exclude the pair.

#figure(
  caption: [Block that cuts existing follows both ways (`BlockService`)],
  kind: raw,
)[
```java
@Transactional
public void block(String blockerUsername, String blockedUsername) {
    User blocker = getUser(blockerUsername);
    User blocked = getUser(blockedUsername);
    if (blocker.getId().equals(blocked.getId())) {
        throw new IllegalArgumentException("Cannot block yourself");
    }

    if (!blockRepository.existsByBlocker_IdAndBlocked_Id(blocker.getId(), blocked.getId())) {
        UserBlock userBlock = new UserBlock();
        userBlock.setBlocker(blocker);
        userBlock.setBlocked(blocked);
        try {
            blockRepository.saveAndFlush(userBlock);
        } catch (DataIntegrityViolationException ignored) {
            // Another request created the same block.
        }
    }

    followRepository.unfollow(blocker.getUsername(), blocked.getUsername());
    followRepository.unfollow(blocked.getUsername(), blocker.getUsername());
    blockGraphRepository.block(blocker.getUsername(), blocked.getUsername());
}
```
]

=== Forgiving, Privacy-Aware Search

Global search is implemented as a PostgreSQL native query. It tolerates partial input and
spelling mistakes by combining case-insensitive substring matching for filtering with the
`pg_trgm` `similarity()` function for ranking, so the closest matches surface first. The
same query enforces search privacy: it excludes the searcher and any account involved in a
block (in either direction) via a `NOT EXISTS` sub-query.

#figure(
  caption: [Fuzzy, block-aware user search (`SearchUserRepository`, native SQL)],
  kind: raw,
)[
```sql
SELECT *
FROM users u
WHERE (:currentUserId IS NULL OR u.id <> :currentUserId)
  AND (
       :currentUserId IS NULL
       OR NOT EXISTS (
           SELECT 1 FROM user_blocks b
           WHERE (b.blocker_id = :currentUserId AND b.blocked_id = u.id)
              OR (b.blocked_id = :currentUserId AND b.blocker_id = u.id)
       )
  )
  AND (
       LOWER(u.username)   LIKE LOWER(CONCAT('%', :q, '%'))
    OR LOWER(u.first_name) LIKE LOWER(CONCAT('%', :q, '%'))
    OR LOWER(u.last_name)  LIKE LOWER(CONCAT('%', :q, '%'))
    OR LOWER(u.email)      LIKE LOWER(CONCAT('%', :q, '%'))
    OR LOWER(u.college)    LIKE LOWER(CONCAT('%', :q, '%'))
  )
ORDER BY GREATEST(
    similarity(u.username,   :q),
    similarity(u.first_name, :q),
    similarity(u.last_name,  :q),
    similarity(u.email,      :q),
    similarity(u.college,    :q)
) DESC
```
]

=== Real-Time Messaging over WebSocket

Chat is delivered over STOMP WebSocket. The controller exposes message-application
destinations (`/app/chat.send`, `/app/chat.typing`, `/app/chat.read`) and delegates to the
service, which broadcasts to per-conversation topics that clients subscribe to.

#figure(
  caption: [WebSocket message endpoints (`ChatWebSocketController`)],
  kind: raw,
)[
```java
@MessageMapping("/chat.send")
public void sendMessage(@Payload WsMessagePayload payload) {
    chatService.handleWsMessage(payload);
}

@MessageMapping("/chat.typing")          // broadcasts to /topic/conversations/{id}/typing
public void typing(@Payload WsTypingPayload payload) {
    chatService.handleTyping(payload);
}

@MessageMapping("/chat.read")            // broadcasts to /topic/conversations/{id}/read
public void markRead(@Payload WsReadPayload payload) {
    chatService.markRead(payload.getConversationId(),
            payload.getLastReadMessageId(), payload.getUsername());
}
```
]

To prevent spam and harassment, conversations and calls are restricted to *mutual
follows*. This rule is centralised in a `FriendshipValidator`, which itself defers to the
block service first, so a block also blocks messaging. Conversation creation reuses an
existing direct-message thread if one exists, and only creates a new one otherwise.

#figure(
  caption: [Mutual-friend enforcement and DM reuse (`FriendshipValidator`, `ChatService`)],
  kind: raw,
)[
```java
public boolean areFriends(String username1, String username2) {
    if (blockService.isBlockedEitherWay(username1, username2)) {
        return false;                          // a block overrides friendship
    }
    return followRepository.isMutual(username1, username2);
}

public void assertFriends(String username1, String username2) {
    if (!areFriends(username1, username2)) {
        throw new SecurityException(
            "Users '%s' and '%s' must be mutual follows to interact in chat."
                .formatted(username1, username2));
    }
}

// ChatService — create or return an existing 1-on-1 conversation
public ConversationResponse getOrCreateDM(String requesterUsername, CreateDMRequest req) {
    User requester = loadUser(requesterUsername);
    User target    = loadUserByUsername(req.getTargetUsername());
    friendshipValidator.assertFriends(requesterUsername, req.getTargetUsername());

    return conversationRepo.findDMBetween(requester.getId(), target.getId())
            .map(conv -> buildConversationResponse(conv, requester))
            .orElseGet(() -> {
                Conversation dm = new Conversation();
                dm.setGroup(false);
                addMember(dm, requester, false);
                addMember(dm, target, false);
                conversationRepo.save(dm);
                return buildConversationResponse(dm, requester);
            });
}
```
]

=== Real-Time Calls and Unanswered-Call Handling

Calls are created in a `RINGING` state and signalled to participants over WebSocket. A
scheduled task runs every 15 seconds and automatically expires calls that ring past their
deadline: it flips them to `MISSED`, marks invitees accordingly, re-broadcasts the
termination, and dispatches a missed-call notification — covering the timeout (FR82) and
missed-call alert (FR83) requirements without any user action.

#figure(
  caption: [Scheduled expiry of unanswered calls (`VideoService`)],
  kind: raw,
)[
```java
@Scheduled(fixedRate = 15000)
public void expireRingingCalls() {
    expireRingingCalls(LocalDateTime.now());
}

public void expireRingingCalls(LocalDateTime now) {
    List<CallSession> expired =
            videoRepository.findByStatusAndExpiresAtBefore(CallStatus.RINGING, now);
    for (CallSession session : expired) {
        session.setStatus(CallStatus.MISSED);
        session.setEndedAt(now);
        markInvitees(session, ParticipantStatus.MISSED);
        CallSession saved = videoRepository.save(session);
        sendEventToParticipants(saved, "CALL_MISSED");
        notifyMissedCall(saved);
    }
}
```
]

=== Centralised Notification Dispatch

All cross-context alerts flow through one `notifyUser` method. It enforces three
safeguards in one place — it never notifies a user about their own action, it suppresses
notifications between blocked users, and it requires a target — then persists the
notification and pushes it live to the recipient's personal WebSocket topic. A bulk
variant fans a single event out to many recipients, which is what Lost & Found uses for
its college-wide alerts.

#figure(
  caption: [Single dispatch point with self/block guards (`NotificationService`)],
  kind: raw,
)[
```java
public NotificationResponse notifyUser(User recipient, User actor, NotificationType type,
        String message, String targetType, String targetId, String metadataJson) {
    if (recipient == null || targetType == null || targetId == null) return null;
    if (actor != null && Objects.equals(recipient.getId(), actor.getId())) return null;   // no self-notify
    if (actor != null && blockService.isBlockedEitherWay(recipient.getId(), actor.getId()))
        return null;                                                                       // respect blocks

    Notification notification = new Notification();
    notification.setRecipient(recipient);
    notification.setActor(actor);
    notification.setType(type);
    notification.setMessage(message == null || message.isBlank() ? type.name() : message.trim());
    notification.setTargetType(targetType);
    notification.setTargetId(targetId);
    notification.setMetadataJson(metadataJson);

    NotificationResponse response = notificationMapper.toResponse(
            notificationRepository.save(notification));
    messagingTemplate.convertAndSend("/topic/notifications/" + recipient.getUsername(), response);
    return response;
}
```
]

The notification hub behaves as an *ephemeral inbox*: the feed query returns only unread
items ordered by recency, so marking an alert read removes it from the feed without a
separate delete.

#figure(
  caption: [Unread-only notification feed (`NotificationService`)],
  kind: raw,
)[
```java
@Transactional(readOnly = true)
public Page<NotificationResponse> getUnreadNotifications(String email, Pageable pageable) {
    AuthEntities.User user = getUserByEmail(email);
    return notificationRepository
            .findByRecipient_IdAndReadFalseOrderByCreatedAtDesc(user.getId(), pageable)
            .map(notificationMapper::toResponse);
}
```
]

=== Localised Lost & Found Alerts

When a lost or found item is posted, the system proactively alerts every student in the
same college. This reuses the bulk notification dispatch and is deliberately wrapped so a
notification failure can never break listing creation.

#figure(
  caption: [College-wide fan-out on new listings (`LostAndFoundService`)],
  kind: raw,
)[
```java
private void notifySameCollegeUsers(LostAndFound lostAndFound, User owner) {
    if (notificationService == null || lostAndFound == null || owner == null) return;
    try {
        notificationService.notifyUsers(
                authRepository.findByCollege(lostAndFound.getCollege().name()),
                owner,
                NotificationType.LOST_AND_FOUND_POSTED,
                "New " + lostAndFound.getType().name().toLowerCase()
                        + " item posted in " + lostAndFound.getCollege().name(),
                "LOST_AND_FOUND",
                lostAndFound.getId().toString(),
                null);
    } catch (RuntimeException ignored) {
        // Notifications must not break lost and found creation.
    }
}
```
]

=== The Shared Media Pipeline

Profile pictures, banners, post galleries, and chat attachments all flow through a single
`MediaUploadService`. It validates the upload, normalises and resizes images to bound their
dimensions and re-encodes them to JPEG, and uploads the result to Cloudinary, returning a
hosted URL that is stored on the owning entity.

#figure(
  caption: [Media validation, normalisation, and upload to Cloudinary (`MediaUploadService`)],
  kind: raw,
)[
```java
public MediaUploadResult upload(MediaUploadRequest request) throws IOException, InterruptedException {
    validate(request);
    String contentType   = normalizeContentType(request.contentType());
    byte[]  uploadBytes  = request.bytes();
    String  filename     = normalizeFilename(request.filename(), contentType);

    if (isImage(contentType)) {
        uploadBytes = resizeImagePreservingRatio(request.bytes(), 1280); // bound size
        contentType = "image/jpeg";                                      // re-encode
    }

    HttpRequest httpRequest = HttpRequest.newBuilder()
            .uri(URI.create("https://api.cloudinary.com/v1_1/" + cloudName
                    + "/" + resourceType(contentType) + "/upload"))
            .header("Content-Type", "multipart/form-data; boundary=" + boundary)
            .POST(HttpRequest.BodyPublishers.ofByteArray(
                    multipartBody(boundary, uploadBytes, filename, contentType)))
            .build();
    // ... send request, parse JSON, and return the secure_url as the hosted media URL
}
```
]

=== Summary

The listings above trace JULink's core functionality end to end: a verified,
university-only identity (Listings 5.1–5.3); a privacy-first social graph in which the
block rule is enforced at the query level (Listings 5.4–5.6); forgiving yet privacy-aware
discovery (Listing 5.7); real-time, mutual-friend-gated communication and calling
(Listings 5.8–5.10); a single, guarded notification channel that all contexts reuse
(Listings 5.11–5.13); and a shared media pipeline (Listing 5.14). Together they show how
the domain-driven structure keeps each concern isolated while cross-cutting rules —
authentication, blocking, and notification — are centralised so they apply consistently
across the whole platform.
