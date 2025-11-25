#include "feasibilityStudy.typ"
== The Schedule and The Estimated Time

The Project Schedule is presented in Table 2.6

#let chapter-number = 2
#show figure.where(kind: table): set figure(
  numbering: n => [#chapter-number.#"."#n],
)
#show figure.where(kind: table): set figure(
  numbering: n => str(chapter-number) + "." + str(n),
)
#show figure.where(kind: image): set figure(
  numbering: n => str(chapter-number) + "." + str(n),
)
#show table.cell.where(x: 0): set text(fill: black, weight: "regular")

#show figure: set block(breakable: true)

#show figure.where(
  kind: table,
): set figure.caption(position: top)

#figure(
  caption: [Development schedule],
  table(
    columns: (2fr, 1fr, 4fr, 1.5fr, 3fr, 3fr, 2fr),

    [#text(fill: white, weight: "bold")[ Phase]],
    [TaskID],
    [Description],
    [Duration Time],
    [Dependency],
    [Responsible Staff],
    [Resources],

    // Planning
    [Planning],
    [T1],
    [Develop a Work Breakdown Structure (WBS) and assign roles and responsibilities],
    [3 days],
    [NA],
    [ِAnas AlRao'sh & Anas Al-Jallad & Ahmad AlManasrah  ],
    [NA],

    // Analysis
    table.cell(rowspan: 3)[ Analysis],
    [T2],
    [Conduct stakeholder interviews, distribute questionnaires],
    [2 weeks],
    [T1 #sym.arrow T2 (M1)],
    [ِAnas AlRao'sh & Ahmad AlManasrah],
    [NA],

    [T3],
    [Write a Software Requirements Specification (SRS), record non-functional requirements],
    [1 week],
    [T2 #sym.arrow T3],
    [ِAnas AlRao'sh & Ahmad AlManasrah],
    [NA],

    [T4],
    [Reviewing and verifying requirements with stakeholders to ensure correctness and completeness],
    [1 week],
    [T3 #sym.arrow T4 (M2)],
    [ِAnas AlRao'sh & Ahmad AlManasrah],
    [NA],

    // Design
    table.cell(rowspan: 6)[Design],
    [T5],
    [Define system architecture, subsystems, modules and components and the relationship among them],
    [1 week],
    [T4 #sym.arrow (T5 || T6) (M3) ],
    [ِAnas AlRao'sh & Ahmad AlManasrah],
    [NA],

    [T6],
    [Define classes, attributes, operations, and relationships based on requirements],
    [1 week],
    [T4 #sym.arrow (T5 || T6) (M3)],
    [ِAnas AlRao'sh & Ahmad AlManasrah],
    [NA],

    [T7],
    [Identify actors, use cases, and relationships within the system boundary],
    [2 days],
    [(T5 || T6) #sym.arrow (T7 || T8)],
    [ِAnas AlRao'sh & Ahmad AlManasrah],
    [NA],

    [T8], [Illustrate object interactions and message flow for major use cases],
    [2 days],
    [(T5 || T6) #sym.arrow (T7 || T8)],
    [ِAnas AlRao'sh & Ahmad AlManasrah],
    [NA],

    [T9],
    [Create visual layouts, interaction flows, and component styles for the system’s screens],
    [1 week],
    [(T7 || T8) #sym.arrow T9],
    [Anas Al-Jallad],
    [NA],

    [T10],
    [Review design for accuracy and alignment, then secure stakeholder approval],
    [4 days],
    [T9 #sym.arrow T10 (M4)],
    [ِAnas AlRao'sh & Ahmad AlManasrah],
    [NA],

    // Implementation
    table.cell(rowspan: 6)[Implem
      entation],
    [T11],
    [Set up necessary tools, libraries, and frameworks for coding],
    [2 days],
    [T10 #sym.arrow T11],
    [ Anas Al-Jallad & Ahmad AlManasrah & Anas AlRao'sh],
    [NA],

    [T12],
    [Implement the user interface and client-side logic according to design specifications],
    [4 months],
    [T11 #sym.arrow  (T12 || T13 || (T14 #sym.arrow T15))],
    [Anas Al-Jallad],
    [NA],

    [T13], [Implement server-side logic, APIs, integrations, and data protection measures],
    [4 months],
    [T11 #sym.arrow  (T12 || T13 || (T14 #sym.arrow T15))],
    [ Anas Al-Jallad & Ahmad AlManasrah & Anas AlRao'sh],
    [NA],

    [T14],
    [Create database schema, configure connections, and implement CRUD operations],
    [4 days],
    [T11 #sym.arrow T14],
    [Ahmad AlManasrah & Anas AlRao'sh],
    [NA],

    [T15],
    [Inspect and review code for quality, standards compliance, and early defect detection],
    [4 months],
    [T11 #sym.arrow  (T12 || T13 || (T14 #sym.arrow T15))],
    [Anas Al-Jallad & Ahmad AlManasrah & Anas AlRao'sh],
    [NA],

    [T16],
    [Combine front-end, back-end, and database components, resolving communication issues],
    [1 week],
    [(T12 || T13 || T15) #sym.arrow T16 (M6)],
    [Anas Al-Jallad & Ahmad AlManasrah & Anas AlRao'sh],
    [NA],

    // Testing
    table.cell(rowspan: 2)[Testing],
    [T17],
    [Combine and test modules to verify functionality against design specifications],
    [1 week],
    [T16 #sym.arrow T17],
    [Anas Al-Jallad & Ahmad AlManasrah & Anas AlRao'sh],
    [NA],

    [T18],
    [Verify module integration and system performance under load],
    [1 week],
    [T17 #sym.arrow T18 (M6)],
    [Ahmad AlManasrah],
    [NA],

    // Deployment
    table.cell(rowspan: 4)[Deploym
      ent],
    [T19],
    [Finalize build, configs, and rollback strategy],
    [1 week],
    [T18 #sym.arrow T19],
    [Anas Al-Jallad & Ahmad AlManasrah & Anas AlRao'sh],
    [NA],

    [T20],
    [Set up hosting, runtime, environment variables, SSL, and domain], [1 week],
    [T19 #sym.arrow T20],
    [Anas Al-Jallad & Ahmad AlManasrah & Anas AlRao'sh],
    [NA],

    [T21],
    [Publish back-end services and front-end assets to the target environment],
    [1 week],
    [T20 #sym.arrow T21],
    [Anas Al-Jallad & Ahmad AlManasrah & Anas AlRao'sh],
    [NA],

    [T22],
    [Smoke test in production-like environment, resolve blockers, obtain approval, and switch traffic],
    [1 week],
    [T21 → T22 (M7)],
    [Anas Al-Jallad & Ahmad AlManasrah & Anas AlRao'sh],
    [NA],
  ),
)
#pagebreak()
*Activity Network*
#figure(
  caption: [Activity network],
  image("../../assets/Activity Network/Activity network.svg"),
)

The critical paths are:

T1–T2–T3–T4–T5–T8–T9–T10–T11–T12–T16–T17–T18–T19–T20–T21–T22

T1–T2–T3–T4–T5–T8–T9–T10–T11–T13–T16–T17–T18–T19–T20–T21–T22

T1–T2–T3–T4–T5–T8–T9–T10–T11–T14–T15–T16–T17–T18–T19–T20–T21–T22

T1–T2–T3–T4–T6–T7–T9–T10–T11–T12–T16–T17–T18–T19–T20–T21–T22

T1–T2–T3–T4–T6–T7–T9–T10–T11–T13–T16–T17–T18–T19–T20–T21–T22

T1–T2–T3–T4–T6–T7–T9–T10–T11–T14–T15–T16–T17–T18–T19–T20–T21–T22
#pagebreak()
