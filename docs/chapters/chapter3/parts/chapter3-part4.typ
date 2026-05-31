#let chapter-number = 3
#show figure.where(kind: table): set figure(
  numbering: n => [#chapter-number.#"."#n],
)
#show figure.where(kind: table): set figure(
  numbering: n => str(chapter-number) + "." + str(n),
)

#show figure.where(
  kind: table,
): set figure.caption(position: top)

== Non-Functional requirements
The non-functional requirements are shown in @NFR_list

#figure(
  caption: [Non-Functional requirements],
  table(
    columns: (1fr, 2fr, 1fr, 5fr),

    [NFR ID], [Description], [Priority], [Note],

    [NFR 1], [Usability], [5],
    [
      We achieved usability by ensuring the user can reach any feature in
      three clicks or less, with clear navigation and consistent layouts.
      The interface is responsive, presenting a persistent side menu on
      desktop and a bottom navigation bar on mobile, and supports Light,
      Dark, and System themes.
    ],

    [NFR 2], [Security (at the software and account levels)], [5],
    [
      Passwords are hashed with BCrypt and never stored in plain text.
      Authenticated requests use stateless JWT tokens, and account
      ownership is proven through email OTP verification with a 3-minute
      expiry. Spring Security protects the REST endpoints, registration is
      restricted to valid \@ju.edu.jo university emails, and privacy rules
      (bidirectional blocking and mutual-friend gating for chat and calls)
      are enforced server-side.
    ],

    [NFR 3], [Maintainability], [4],
    [
      The backend follows a Domain-Driven Design structure of
      loosely-coupled bounded contexts (auth, profile, follow, block, post,
      lost and found, search, chat, video, notification, report), each
      layered into controllers, services, and repositories with consistent
      naming and clear separation of concerns. DTOs and mappers isolate the
      REST API contract from the internal entities, allowing the data model
      to evolve without breaking existing clients.
    ],

    [NFR 4], [Performance], [4],
    [
      Performance is achieved through Spring Boot with JPA/Hibernate over
      PostgreSQL, server-side pagination on all feeds and lists, and a Neo4j
      graph database for efficient relationship, mutual-connection, and
      suggestion traversals. Full-text search uses PostgreSQL trigram
      (`pg_trgm`) similarity for fast fuzzy matching, media is offloaded to
      Cloudinary's CDN, and recorded impressions prevent already-seen posts
      from being re-served in the feed.
    ],

    [NFR 5], [Reliability], [3],
    [
      Non-critical side effects are isolated so they cannot break core
      flows; for example, a notification failure never prevents a lost and
      found listing from being created. Stale, unanswered calls are cleaned
      up automatically by a scheduled task, and blocking operations are
      idempotent and transactional.
    ],

    [NFR 6], [Compatibility], [4],
    [
      The web client adapts its layout and navigation to the user's device
      (desktop or mobile), and the selected theme is persisted on the user
      account so it is synchronized consistently across every device the
      user logs into.
    ],
  )
)<NFR_list>
