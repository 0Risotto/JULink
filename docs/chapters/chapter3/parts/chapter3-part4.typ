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
    columns:(1fr, 2fr,1fr,5fr),

    [NFR ID], [Description], [Priority], [Note],

    [NFR 1], [Usability], [5],
    [We achieved usability by making the user reach any feature with
      three clicks or less and by providing clear navigation and consistent
      layouts],

    [NFR 2], [Security: we aim to achieve security on multiple levels (software level, user)], [5],
    [
      We achieved security in the software level by using BCrypt to ensure
      password hashing and by issuing JWT tokens for authenticated users.
      Email verification via OTP ensures account ownership, while Spring
      Security protects endpoints and GraphQL resolvers.
    ],

    [NFR 3], [Maintainability], [4],
    [
      We achieved maintainability by using a layered architecture
      (controllers, GraphQL resolvers, services, repositories) with clear
      naming conventions and separation of concerns. The GraphQL schema is
      centrally defined and versioned, while DTOs and mappers isolate the
      API contract from internal models, allowing flexible evolution
      without breaking existing clients.
    ],

    [NFR 4], [Performance], [4],
    [
      Performance is achieved through Spring Boot and optimized
      repositories (JPA/Hibernate) for database operations, plus GraphQL’s
      ability to fetch exactly the requested fields, reducing
      over-fetching.
    ],
  )
)<NFR_list>
