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

@Stakeholders_list shows the Stakeholders of the project
#figure(
  caption: [Stakeholders list],
 table(
  columns: 3,
  [ST ID],[Stake holder],[Note],
  [ST1],[Active Users],[Active users are users who usually post /
interact with posts],
  [ST2],[Passive Users],[Passive users are users who rarely interact
with software they mainly view content],
  [ST3],[Tech specialist],[Admins who have access to the DB and
deletion on it ],
  [ST4],[Ad providers],[External system that shows ads on our web
application and pays us per views and clicks],
) 
) <Stakeholders_list>