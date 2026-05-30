#counter(figure.where(kind: table)).update(0)

#let chapter-number = 3

#show figure.where(kind: table): set figure(
  numbering: n => [#chapter-number.#"."#n],
)
#show figure.where(kind: table): set figure(
  numbering: n => str(chapter-number) + "." + str(n),
)

= Project specifications

== Stakeholders

The primary stakeholders interacting with the JULink platform have been consolidated to reflect the final implementation and authorization boundaries. These stakeholders are outlined in @stakeholders_list.

#figure(
  caption: [Stakeholders list],
  table(
    columns: (auto, auto, 1fr),
    
    [*ST ID*], [*Stakeholder*], [*Description*],

    [ST1], [User], 
    [A registered member of the university (student, faculty, or staff) who utilizes the platform to create content, engage with peers, manage their profile, and communicate via real-time chat.],
    
    [ST2], [Tech Specialist / Admin], 
    [System administrators who have elevated access to the database and backend systems. They are responsible for platform maintenance, handling escalated reports, and enforcing content moderation.],
    
    [ST3], [Ad Provider], 
    [External systems or integrated partners that supply advertising content dynamically displayed on user feeds.]
  )
) <stakeholders_list>
