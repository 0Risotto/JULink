#import "@preview/diatypst:0.9.3": *

#show: slides.with(
  title: "JULink",
  subtitle: "Social Media Platform for JU Students",
  date: datetime.today().display("[day]/[month]/[year]"),
  authors: ("Anas AL-Jallad", "Ahmad AlManasrah", "Anas AlRao'sh"),
  title-color: rgb("#1F4E79"),
  ratio: 16/9,
  layout: "medium",
  toc: true,
  count: "dot",
  footer: true,
  theme: "full"
)

= Introduction to JULink

== About JULink
JULink is a modern, student-centric social media application designed specifically for the community of *The University of Jordan*.

- *Medium of Engagement*: Serves as a practical bridge between the institution and its students.
- *Safe Space*: A bias-free, trusted environment where students can freely express opinions and share ideas.
- *Voice Equality*: Focuses on student empowerment, ensuring that every student has an equal voice.

== Key Motivations
- *The Gap*: University communication channels are often fragmented, slow, or unidirectional.
- *Incoherent Platforms*: Generic platforms like Facebook groups lack organization and academic-specific features.
- *Loud vs. Silent Voices*: Specific demographics often dominate discussions, leaving others unheard.

= The Problem & Solution

== The Problem
Students at the University of Jordan suffer from:

1. *Inefficient Channels*: Difficulty accessing localized information, missing urgent events, or getting lost in massive public groups.
2. *Trust & Privacy Issues*: Hesitancy in sharing thoughts on platforms where profiles are unverified or highly public.
3. *Disorganized Lost & Found*: Valuable items are lost daily with no structured, verified way of reporting or claiming them.
4. *Lack of Connectivity*: Finding peers with shared academic interests or mutual friends across colleges is difficult.

== How We Solve It
We built a unified platform engineered around academic needs:

- *Verified Domain Registration*: Only students with active `student.ju.edu.jo` emails can register, verified via a secure *6-digit OTP*.
- *Structured Subsystems*: Unified feeds, integrated real-time chats, voice/video calling, localized push notifications, and a dedicated *Lost & Found Claim Portal*.
- *Block-Aware Privacy*: Dynamic privacy policies embedded directly into the network.

= Tech Stack & Architecture

== Modern Tech Stack
#table(
  columns: (1.5fr, 3.1fr),
  fill: (col, row) => if row == 0 { rgb("#1F4E79") } else if calc.even(row) { rgb("#F2F4F7") } else { white },
  stroke: rgb("#1F4E79"),
  align: horizon + left,
  [*Layer*], [*Technologies Used*],
  [Frontend], [Next.js, React, TypeScript, Redux (State), Zod (Validation), Tailwind CSS, Shadcn UI],
  [Backend], [Spring Boot, Spring Security, Hibernate/JPA, Java Mail Sender],
  [Databases], [PostgreSQL (Relational/Fuzzy Search), Neo4j (Graph Database/Social Network)],
  [APIs], [REST APIs, JSON Web Tokens (JWT), WebSockets (STOMP), WebRTC (Calling)]
)

== Layered Architecture
JULink employs a layered architecture adhering to Domain-Driven Design (DDD) principles:

- *Controllers / Resolvers*: Expose secure HTTP endpoints, WebSocket handlers, and token authorities.
- *Services*: Contain business logic, trigger notifications, handle OTP validity, and evaluate feed scores.
- *Repositories*: Abstract database queries.
  - *PostgreSQL*: Managed through Spring Data JPA for transactional safety.
  - *Neo4j*: Accessed dynamically via the `Neo4jClient` for low-latency Cypher traversals.

= Main Subsystems & Algorithms

== Core Subsystems
1. *Identity & Access*: Multi-factor onboarding, OTP verification, and RSA asymmetric token signing.
2. *Social Graph*: Block-aware follower lists, mutual follow calculations, and suggestions.
3. *Posts & Engagement*: Unified feed, comments, replies, likes, bookmarks, and hashtag search.
4. *Messaging & Chat*: Real-time peer-to-peer and group chats with read-state receipts and presence indicator.
5. *Lost & Found*: Item registration, secure claiming workflow, and localized notifications.
6. *Real-Time Calls*: Signaling-driven video/voice calling via WebRTC.

== Key Algorithms
- *Jaccard Similarity Coefficient*: Calculates structural overlap within the social graph to recommend highly accurate potential friend links.
- *PostgreSQL Trigram Similarity*: Powered by `pg_trgm` and `%` operator to provide fast, fuzzy, and spelling-tolerant user, post, and hashtag searching.
- *Feed Scoring*: Ranks posts dynamically:
  $ "Score" = "Same College (40.0)" + "Recency Score (20.0)" - "Seen Penalty (15.0)" $
  - Recency is determined using exponential decay:
  $ f(t) = e^(-t / 72.0) $ where $t$ is the age of the post in hours.

= Dataflow & Database Schema

== System Dataflow
#align(center)[
  #grid(
    columns: (1fr, 1fr, 1fr),
    gutter: 1cm,
    [
      *1. HTTP APIs (REST)*
      - JWT-Auth requests
      - Profile changes
      - Post publications
      - Lost & Found claims
    ],
    [
      *2. WebSockets (STOMP)*
      - Real-time messages
      - Presence updates
      - Instant alerts
    ],
    [
      *3. WebRTC Signaling*
      - Call handshakes
      - Peer connection
      - Media negotiation
    ]
  )
]

- *State Management*: Front-end utilizes Redux for unified local state, reacting to live server-pushed socket frames.

== Database Schema: PostgreSQL
- *User & OTP*: `users` (credentials, profile images, theme preferences, college) and `OTP` (temporary security hashes).
- *Social Posts*: `posts`, `post_attachments`, `hashtags`, `post_hashtags`, `post_likes`, `post_favorites`, `post_comments`, `post_impressions`.
- *Lost & Found*: `lost_and_found_items` (id, item description, images, type, claim status) and `claims` (linking claimant and owner).

== Database Schema: Neo4j Social Graph
- *Nodes*: `(u:User {username})`
- *Relationships*:
  - `[:FOLLOWS]`: Bi-directional follows represent *Friends*.
  - `[:BLOCKED]`: Dynamically hides profiles, blocks messages, and suppresses suggestions.
- *Why Graph persistence?* Social graph traversal is exponentially faster in Neo4j than join-heavy SQL queries, enforcing privacy globally at database traversal level:
```cypher
MATCH (u1:User {username: $u1})-[:FOLLOWS]->(c:User)<-[:FOLLOWS]-(u2:User {username: $u2})
WHERE NOT (u1)-[:BLOCKED]->(u2) AND NOT (u1)-[:BLOCKED]->(c) ...
RETURN c.username
```

= Future Work

== Adding Redis to JULink
To elevate JULink to industrial scale, we plan to integrate *Redis* as a high-performance in-memory caching and brokerage layer.

- *Invalidation & Token Blacklisting*: Store logged-out JWT tokens with a TTL (Time-To-Live) matching token expiry.
- *WebSocket Message Broker*: Distribute active WebSocket messages and user presence status across multiple Spring Boot instances.
- *Fuzzy-Query Caching*: Cache high-traffic queries like global hashtags, trending posts, and profiles.
- *Rate Limiting*: Protect OTP endpoints and auth routes against abuse using a token bucket algorithm.

== Conclusion
JULink transforms University of Jordan student interactions by replacing outdated, noisy communication with a clean, high-performance, and safe academic portal.

#v(1em)
#align(center)[
  *Thank you!* \
  Any Questions?
]
