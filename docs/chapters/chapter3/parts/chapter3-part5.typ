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

== Domain requirements

The domain requirements are presented in @DR_list

#figure(
  caption: [Domain requirements],
  table(
    columns: 3,

    [DR ID], [Description], [Note],

    [DR 1],
    [
      All users should belong to the
      University of Jordan either as
      students, faculty, or staff
    ],
    [
      The system requires all users to have
      an email that ends with \@ju.edu.jo
    ],

    [DR 2],
    [
      All content must comply with the
      University of Jordan code of ethics
      and conduct
    ],
    [
      An AI solution will be implemented to
      make sure all posts comply with the
      University of Jordan code of conduct
    ],

    [DR 3],
    [
      JU Link official language is the
      English language
    ],
    [
      All operation in the app will be in the
      English language as the primary language,
      with possibility for Arabic language as a
      second language
    ],
  )
)<DR_list>
