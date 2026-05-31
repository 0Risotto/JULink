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
      students, faculty, or staff.
    ],
    [
      The system requires all users to register
      with an email that ends with \@ju.edu.jo;
      this is validated at registration and the
      address must be confirmed via an email OTP.
    ],

    [DR 2],
    [
      All content must comply with the
      University of Jordan code of ethics
      and conduct.
    ],
    [
      Uploaded images are screened automatically by
      Cloudinary's image moderation: an image flagged
      as inappropriate is rejected and never attached,
      so the post is published with its text only.
      Users can also report posts, profiles, messages,
      and ads, which are escalated to administrators
      for review.
    ],
  )
)<DR_list>
