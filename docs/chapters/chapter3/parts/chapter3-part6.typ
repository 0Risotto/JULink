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
#show figure: set block(breakable: true)

#show figure.where(
  kind: table,
): set figure.caption(position: top)



== Requirements Analysis and the Architecture Design

The JULink platform architecture is structured into distinct functional subsystems. The Architecture Design Groups table categorizes the functional requirements by their primary subsystem, while the Architecture Design Modules table breaks down each subsystem into its specific internal modules.

#figure(
  caption: [Architecture Design Groups],
  table(
    columns: 3,

    [Functional group], [Subsystem name], [FRs],

    [G1], [Auth],
    [FR1, FR2, FR3, FR4, FR5, FR8, FR9],

    [G2], [Profile],
    [FR6, FR7, FR10, FR11, FR12, FR13, FR96, FR98, FR99],

    [G3], [Following],
    [FR14, FR15, FR17, FR18, FR19, FR20, FR21, FR22],

    [G4], [Block],
    [FR29, FR30, FR31, FR32],

    [G5], [Post],
    [FR33, FR34, FR35, FR36, FR37, FR38, FR39, FR40, FR41, FR42, FR43, FR44, FR45, FR46, FR48],

    [G6], [Lostandfound],
    [FR23, FR24, FR25, FR26, FR27, FR28],

    [G7], [Search],
    [FR52, FR53, FR54, FR55, FR56, FR57],

    [G8], [Chat],
    [FR16, FR58, FR59, FR60, FR61, FR62, FR63, FR64, FR65, FR66, FR67, FR68, FR69, FR70, FR71, FR72, FR73, FR74, FR75, FR76],

    [G9], [Video],
    [FR77, FR78, FR79, FR80, FR81, FR82, FR83, FR84, FR85],

    [G10], [Notifications],
    [FR86, FR87, FR88, FR89, FR90, FR91, FR97],

    [G11], [Report],
    [FR47, FR92, FR93, FR94, FR95],

    [G12], [Ads],[FR49, FR50, FR51]
  )
) <bounded_contexts>


#figure(
  caption: [Architecture Design Modules],
  table(
    columns: 3,

    [Subsystem], [Modules], [FRs covered],

    // ---------------- G1 ----------------
    table.cell(rowspan: 2)[Identity & Access],
    [Registration & Verification], [FR1, FR2, FR3],
    [Authentication & Session], [FR4, FR8],
    

    // ---------------- G2 ----------------
    table.cell(rowspan: 3)[Profile & Onboarding],
    [Onboarding], [FR6, FR7],
    [Profile Viewing], [FR10, FR12],
    [Settings & Theme Sync], [FR98, FR99],

    // ---------------- G3 ----------------
    table.cell(rowspan: 3)[Social Graph / Following],
    [Follow Management], [FR17, FR21],
    [Connection Lists], [FR14, FR18],
    [Mutual Connections], [FR15, FR19],
  

    // ---------------- G4 ----------------
    table.cell(rowspan: 1)[Blocking & Privacy],
    [Block Management], [FR29, FR30],

    // ---------------- G5 ----------------
    table.cell(rowspan: 3)[Posts & Engagement],
    [Post Authoring], [FR33, FR34, FR35],
    [Sharing], [FR39, FR40],
    [Comments & Replies], [FR41, FR42, FR44, FR45],

    // ---------------- G6 ----------------
    table.cell(rowspan: 2)[Lost & Found],
    [Listing Management], [FR23, FR27],
    [Claims & Owner Contact], [FR25, FR26],


    // ---------------- G7 ----------------
    table.cell(rowspan: 2)[Search & Discovery],
    [Multi-Entity Search], [FR52, FR53],
    [Search Privacy & Hashtags], [FR56, FR57],

    // ---------------- G8 ----------------
    table.cell(rowspan: 6)[Messaging / Chat],
    [Conversation Setup], [FR16, FR58, FR59, FR60],
    [Messaging & Media], [FR61, FR62, FR63, FR64],
    [Message Lifecycle], [FR68, FR69],
    [Delivery & Presence], [FR65, FR66, FR67],
    [Group Administration], [FR70, FR71, FR72, FR73, FR74],
    [Post Sharing & Call Entry], [FR75, FR76],

    // ---------------- G9 ----------------
    table.cell(rowspan: 3)[Real-Time Calls],
    [Incoming Call Handling], [FR78, FR79, FR80],
    [Outgoing Call Control], [FR81, FR82, FR83],
    [In-Call UI / PiP], [FR84, FR85],

    // ---------------- G10 ----------------
    table.cell(rowspan: 2)[Notifications],
    [Read-State Management], [FR89, FR91],
    [Manual Deletion & Badge], [FR90, FR97],

    // ---------------- G11 ----------------
    table.cell(rowspan: 2)[Reporting & Moderation],
    [Entity Reporting], [FR47, FR92],
    [Reason Capture & Authorization], [FR93, FR94],
  )
) <domain_modules>
\
#figure(
  caption: [JULink Architectural design],
  image("../../../assets/Architecture design/Architecture design.svg"),
)
#pagebreak()
