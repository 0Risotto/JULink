//------------------------------  Configurations -----------------------------------
#set page(
  paper: "a4",
  margin: (top: 2cm, bottom: 2cm, left: 3cm, right:2cm),
  numbering: "1"
)
#set text(font: "Times New Roman", size: 12pt)
#set par(
  justify: true,
  leading: 1.625em,
)

#set align(left)

#show "JULink": name => box[
  #name #box(image(
    "JULink logo.svg",
    height: 1em,
    width: 1em,
    fit: "contain",
    scaling: "smooth",
  ))
]
//------------------------------  C1 Header -----------------------------------
#grid(
  columns: (1fr, 1fr),
  column-gutter: 1cm,
  align: (center, center)
)[
  // Left: KASIT logo
  #image("KASIT.svg", fit: "contain", height: 4cm)
][
  #grid(
    columns: (auto, auto),
    
    align: (left, center)
  )[
    #image("JU.svg", fit: "contain", height: 4cm)
  ][
    #align(horizon + left)[
      #par(leading: 1em)[
        #text(size: 16pt, weight: "bold")[The University \ of Jordan]
      ]
    ]
  ]
]

//------------------------------  C1 Body -----------------------------------

#v(4em)
#align(center)[
  #text(size: 22pt,)[Graduation Project]
]
#v(2em)
#align(center)[
  #text(size: 16pt,)[Supervised by: Prof. Amjad Hudaib and Dr. Israa AlZghoul]
]
  
#place(bottom + center)[
  #move(dy: -1cm)[
  #set text(size: 14pt, weight: "bold")
  King Abdullah II School of Information Technology · The University of Jordan
]
]
#pagebreak()
//------------------------------  C2  -----------------------------------
#align(center)[ #image(
    "JULink.svg",
    fit: "contain",
    width: 10cm,
    height: 4cm,
  )
  
  #text(size: 5em)[
    #v(0.5em)
    #text(size: 24pt)[Fall Semester 2025/2026]
  ]
  
  #show table.cell: it => {
    if it.x == 0 or it.y == 0 {
      set text(white)
      strong(it)
    } else {
      it
    }
  }
  
  #set table(
    fill: (x, y) =>
      if x == 0 or y == 0 { rgb("#036A3B") },
  )
  
  #v(2em)
  #scale(x: 16cm, y: 5cm)[
    #table(
      inset: 8pt,
      columns: (0.8cm, 3cm, 7cm),
      rows: 4,
      stroke: 1pt + rgb("#036A3B"),
      align: center,
      [],[Student ID], [Student Name],
      [1],[2222312],[Anas Yousef AlRao'sh],
      [2],[0225343],[Anas Aiman AL-Jallad],
      [3],[0227255],[Ahmad Khaled AlManasrah],
    )
  ] 
]
#pagebreak()
//------------------------------  TOC -----------------------------------

#pagebreak()
//------------------------------  TOT -----------------------------------

#pagebreak()
//------------------------------  TOF -----------------------------------

#pagebreak()
//------------------------------  Summary -----------------------------------
#align(center)[
  #image(
    "JULink.svg",
    fit: "contain",
    width: 5cm,
    height: 3cm,
  )
  #v(1em)
  #text("Summary", weight: "bold", size: 20pt)
  
  #text("JULink is a social media platform designed by students, for students, at the University of Jordan. It provides features such as posting, interacting, and following other users. The primary aim of JULink is to bridge the communication gap between the university and its students. It is delivered as a web application, accessible on any network and through any web browser. Beyond communication, JULink also serves as a digital space for students to share experiences, stay informed about campus activities, and engage with their peers. In doing so, it encourages a stronger sense of community and makes student life at the University of Jordan more connected and collaborative.")
]
#pagebreak()
//------------------------------  Chapter 1 -----------------------------------
//------------------------------  Header -----------------------------------
#let blue = rgb("#2F5496")
#place(top + center)[
  #move(dy: -1cm)[
    #set text(size: 14pt)
    #grid(
      columns: (1fr, 1fr),
      align: (left,right)
    )[
      Chapter One
    ][
      JULink
    ]
  ]
]

//------------------------------  Body -----------------------------------

#box(
  width: 100%,
  fill: blue,
  radius: 2pt,
  inset: 0.5em
)[
  #align(center)[
    #text(weight: "bold", fill: white, size: 14pt)[
      = #text(fill: blue)[1.0 ]Introduction
    ]
  ]
]

== 1.1 Overview

JULink is a social media application made by students, for students, designed to address the everyday struggles faced by students at the University of Jordan. 
The University of Jordan has long struggled with limited communication between the institution and its students JULink aims to bridge that gap.
Developed with the student experience in mind, JULink serves as a practical, community-driven solution to the challenges of university life.

== 1.2 Main Objectives
- Promote community engagement: JULink serves as a medium between the institution and its students. This medium takes the form of a web application that enables communication among all parties.

- Student centered: At JULink, we aim to provide a bias free web application where students have a safe space to share their opinions and engage with the perspectives of others.

- Empowering students: JULink ensures that every student has an equal voice within the university community. Regardless of their role, all users are given the same opportunity to be heard and make an impact.

== 1.3 Main Motivations
- Communication gap: Students at the University of Jordan often face difficulties due to limited and inefficient communication channels with the institution and amongst themselves.

- Lack of safe spaces for expression: Students often hesitate to share their opinions due to fear of judgment, bias, or lack of trust in existing platforms.

- Unequal student representation: Certain groups of students based on background or certain groups tend to have louder voices, while others remain unheard.

#pagebreak()
== 1.4 Constraints
- The project must be completed by May 25, 2026.

- Data privacy and security, ensuring the privacy of student data and compliance with university and national data protection policies is a critical constraint that must be addressed throughout development.

- permission must be obtained from the University of Jordan to access or integrate with university data. The process may be delayed depending on how long approval takes.

== 1.5 Similar Projects
Facebook (_https://www.facebook.com/ _): Facebook groups targeting university students provide similar features but lack the organization and coherence of a purpose-built application.

Unibuddy(_https://www.unibuddy.com/ _): Unibuddy serves as a communication platform similar to JULink, as both projects allow users to share blogs and exchange messages with one another.

Reddit(_https://www.reddit.com/ _): The layout and design of JULink were partially inspired by Reddit. As both a mobile and web application, Reddit allows users to create their own communities *subreddits* and facilitates communication within them.

== 1.6 Project Organization
The rest of this documentation is organized as follow

*Chapter Two: Project Management*

This chapter proves the JULink feasibility through technical, operational, economic, and legal analysis. The estimated benefit, cost, and payback duration are also presented. Besides, the detailed schedule for the completion of the work, activity network, and PERT diagram are presented to show the division of work to the team members and management within the available duration.

*Chapter Three: Project Specifications*
This chapter sets up the stakeholders involved and describes the method used for data gathering, such as questionnaires and interviews. It also sets up the functional, domain, and non-functional requirements for JULink. Finally, it describes the requirements analysis and design architecture by grouping requirements into separate subsystems.

*Chapter Four: Project Design*

This chapter provides the system design details, including the context and class diagrams. It also presents use case and sequence diagrams for each functional requirement, demonstrating how users interact with the system and how the system responds.

*Chapter Five: Project Implementation*

This chapter presents the programming languages and technologies used in the development of the project, along with explanations of key sections of the code that illustrate the system’s core functionality.

*Chapter Six: Project Testing*

This chapter presents the testing methodology, explains how it was carried out, and describes the types of tests performed along with selected test cases.

*Chapter Seven: User Manual*

In this chapter, we provide a complete user manual for the web application, enabling even first time users of JULink to quickly understand and master its features.