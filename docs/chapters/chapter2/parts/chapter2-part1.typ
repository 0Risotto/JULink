== Feasibility Study
=== Technical Feasibility
==== Overview
The technical feasibility assessment evaluates the technological components necessary to develop, deploy, and operate the JU Link platform. This encompasses a thorough evaluation of the required software frameworks, infrastructure, and the technical proficiencies essential for successfully building and maintaining the system.


==== System Architecture and Technology Stack
The technical viability of JU Link is grounded in the adoption of a highly scalable architecture adhering to Domain-Driven Design (DDD) principles. By leveraging a polyglot persistence strategy and modern industry-standard tools, the system can reliably handle the diverse data and performance requirements of an academic network.

- *Frontend Framework & State Management:* The platform utilizes Next.js, built on top of React.js, to provide server-side rendering (SSR) and deliver a highly performant user interface. The entire frontend codebase is developed using TypeScript to ensure strict type safety, scalability, and maintainability. Redux is implemented for predictable state management across complex user interfaces, while Zod guarantees robust schema-based data validation before any backend processing.

- *Backend & Communication Protocols:* Standard client-server communications are handled via RESTful APIs. Furthermore, the feasibility of real-time features is secured through the integration of low-latency WebSockets for live instant messaging, alongside the open-source Jitsi platform, which is utilized to power secure, scalable peer-to-peer video conferencing.

- *Polyglot Persistence & Data Storage:* Relational domain entities are managed by PostgreSQL, leveraging the `pg_trgm` extension for efficient fuzzy search capabilities. To feasibly map and traverse the complex university social graph, Neo4j is employed as a NoSQL graph database using the Cypher query language. 

- *Cloud Infrastructure & Media Management:* - *Cloudinary*: Utilized as a dedicated cloud-based media management service. User media and images are uploaded directly to the Cloudinary vault, which returns optimized URLs to the backend. This securely offloads media storage and minimizes server payload bottlenecks.

- *Algorithms and Security:* The system leverages the Jaccard Similarity Coefficient to calculate structural overlaps within the social graph, ensuring the programmatic viability of highly accurate user follow recommendations. To maintain robust data protection, asymmetric RSA encryption is utilized specifically to cryptographically sign JSON Web Tokens (JWT), guaranteeing stateless, tamper-proof authentication and secure session management across the platform.

==== Version Control and Collaboration
Git, hosted via GitHub, is utilized for distributed version control. This infrastructure guarantees technical feasibility in team collaboration by providing robust tracking of codebase changes, branch management, and continuous integration capabilities, mitigating the risk of code conflicts during concurrent development.

==== Technical Readiness and Competency
All required resources, including software tools and cloud infrastructure, are readily available and accessible. Furthermore, the development team possesses the requisite competency to implement this architecture. The foundational knowledge of these technologies was acquired through the university curriculum and heavily reinforced via practical, hands-on projects. This combination of academic background and applied experience provides the team with the necessary technical foundation to successfully build and deploy the JU Link platform.

=== operational feasibility
JULink is operationally feasible, as similar projects have gained approval by university students and some have even extended to a larger scope. Since most university students are not from a technical background, our project will highly focus on achieving user-experience. JU assumes the students have access to the internet most of the time and a smart device hence students will be able to use it.

#pagebreak()
=== Economic Feasibility

#let chapter-number = 2
#show figure.where(kind: table): set figure(
  numbering: n => [#chapter-number.#"."#n],
)
#show figure.where(kind: table): set figure(
  numbering: n => str(chapter-number) + "." + str(n),
)

#show figure.where(
  kind: table,
): set figure.caption(position: top)

*Development Costs:*   
#align(center)[
  #figure(
  table(
  columns: 2,align:left,
[*Expense Category*], [*Amount*],
[Salaries],[20,000 JD],
[Equipment and installations],[8,000 JD],
[Training],[1,500 JD],
[Facilities],[2,000 JD],
[Utilities],[1,000 JD],
[Travel\Miscellaneous],[2,000 JD],
 [*Total*],[*39,500 JD*] )
, caption: [Devlopment Costs]
)]

*The Needed Hardware and Software*

Table 2.2 presents the needed Hardware and Software to develop the project and their estimated
cost.

#figure(
  caption: [The needed HW and SW],
  table(
    columns: 6,

    [], [Description], [Quantity], [Unit Price (JD)], [Total Price(JD)], [Note],

    [HD1], [Laptop: Lenovo NEW ThinkPad Edge E14 Gen 6 (2024)], [3], [579], [2316], [NA],

    [HD2], [Fiber 800 Mbps], [1], [26], [26], [NA],

    [HD3], [Printer: HP LaserJet Pro 3003DW Laser Monochrome Printer], [1], [189], [189], [NA],

    [SW1], [IntelliJ IDEA Ultimate], [1], [425], [425], [NA],

    [SW2], [Typst], [3], [93], [279], [NA],

    [SW3], [Figma Professional, dev seat ], [1], [17], [17], [NA],

    [Total], table.cell(colspan: 3)[], [3252], [NA],
  ),
)

*Total cost $ = 3252 + 13,880 = 17132$ *

*Benefits*
// Intangible benefits
#figure(
  caption: [Intangible benefits],
  table(
    [Intangible benefits],
    [Higher satisfaction amongst students],
    [Strengthening community sense in students],
    [Improved academic performance],
    [Enhanced peer collaboration],
  ),
)
//tangible benefits
#figure(
  caption: [Tangible benefits],
  table(
    columns: 2,
    [tangible benefits], [Revenue (JD/year)],
    [Ads], [4,254],
  ),
)

*Payback analysis:*


#show table.cell.where(x: 0): set text(fill: white, weight: "bold")

#figure(
  caption: [Cost/benefit analysis],


  table(
    columns: 8,
    // header row & first column get the blue fill
    fill: (col, row) => if row == 0 or col == 0 { rgb("#2F5496") },

    [Category],
    [Year 0],
    [Year 1],
    [Year 2],
    [Year 3],
    [Year 4],
    [Year 5],
    [Year 6],

    [Value of benefits], [0], [4,254], [4,254], [4,254], [4,254], [4,254], [4,254],

    [Development costs],
    [#text(fill: red)[-17,132]],
    [0], [0], [0], [0], [0], [0],

    [Annual expenses],
    [0],
    [#text(fill: red)[-524]], [#text(fill: red)[-524]], [#text(fill: red)[-524]],
    [#text(fill: red)[-524]], [#text(fill: red)[-524]], [#text(fill: red)[-524]],

    [Net/Benefit costs],
    [#text(fill: red)[-17,132]],
    [3730], [3730], [3730], [3730], [3730], [3730],

    [Discount factor (6%)],
    [1.0000], [0.9434], [0.8900], [0.8396], [0.7921], [0.7473], [0.7050],

    [Net present value (NPV)],
    [#text(fill: red)[-17,132]],
    [3,519], [3,120], [3,132], [2,955], [2,787], [2,630],

    [Cumulative NPV],
    [#text(fill: red)[-17,132]],
    [#text(fill: red)[-13,613]],
    [#text(fill: red)[-10,493]],
    [#text(fill: red)[-7,361]],
    [#text(fill: red)[-4,406]],
    [#text(fill: red)[-1,619]],
    [#text[1,011]],

    [Payback period],
    [6 years+],
    table.cell(colspan: 3)[*$(1,619) / (1,619 + 1,011) = 0.616$*],
    table.cell(colspan: 3)[*6 years + 225 days*  ( $0.616 times 365$)],
  ),
)

  $ "Lifetime ROI" = (22,380 − 17,132) / (17,132) = 0.306 $
  $ "Annual ROI" = 0.306 / 6 = 0.051 $

=== Legal Feasibility
JULink is legally feasible, as we will not be selling or leaking any student's data, and it will not include any copyrighted material in its creation. It will also comply with Jordan's Cybercrime Law by ensuring language moderation to prevent misuse and offensive behavior.

#pagebreak()
