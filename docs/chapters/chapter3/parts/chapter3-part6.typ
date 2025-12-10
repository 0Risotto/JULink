#counter(figure.where(kind: image)).update(0)

#let chapter-number = 3
#show figure.where(kind: table): set figure(
  numbering: n => [#chapter-number.#"."#n],
)
#show figure.where(kind: table): set figure(
  numbering: n => str(chapter-number) + "." + str(n),
)
#show figure.where(kind: image): set figure(
  numbering: n => str(chapter-number) + "." + str(n),
)

#show figure.where(
  kind: table,
): set figure.caption(position: top)
\
== Requirements Analysis and the Architecture Design
#figure(
  caption: [Architecture Design Groups],
  table(
    columns: 3,
    [Functional group],[Subsystem name],[FRs],
    [G1],[User Account Management],[FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR12, FR13, FR14, FR15, FR16, FR17, FR19, FR21, FR22, FR23, FR24],
    [G2],[Post Management],[FR10, FR11, FR18,  FR34, FR35, FR40, FR43],
    [G3],[Interaction & Engagement],[FR20, FR25, FR26, FR27, FR28, FR29, FR31, FR32, FR33, FR37, FR38, FR39, FR41, FR44, FR45],
    [G4],[Feed & Content Viewing],[FR36, FR46],
    [G5],[Advertising & Reporting],[FR30, FR42, FR47, FR48, FR49],
  ),
)

#figure(
  
caption: [Architecture Design Modules],
table(
  columns: 3,
  
  [Subsystem], [Modules], [FRs covered],

  table.cell(rowspan: 5)[Account management],
  [Registration & Activation],[FR1, FR2],
  [Authentication & Session],[FR3, FR4, FR21],
  [Profile Management],[FR6, FR7, FR13, FR14, FR15, FR16],
  [Settings & Preferences],[FR12, FR17, FR19, FR24],
  [Account Lifecycle],[FR22, FR23],

  table.cell(rowspan: 2)[Post management],
  [Post Ownership], [FR10, FR11, FR40],
  [Saved Content], [FR18, FR43],

  table.cell(rowspan: 4)[Interaction & Engagement],
  [Follow Graph], [FR25, FR26, FR27, FR28, FR29],
  [Likes], [FR37, FR38],
  [Comments], [FR20, FR39, FR45],
  [Messaging & Calls], [FR31, FR32, FR33],

  [Feed & Content Viewing], [Feed Browsing], [FR36, FR46],
)
)
\
#figure(
  caption: [JULink Architectural design],
  image("../../../assets/Architecture design/Architecture design.svg"),
)
#pagebreak()