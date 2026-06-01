#set page(paper: "a4", margin: (top: 2cm, bottom: 2cm, left: 3cm, right: 2cm))
#set text(font: "Times New Roman Cyr", size: 12pt)
#set par(justify: true, spacing: 1.25em, leading: 1.25em)

#show link: set text(fill: blue, weight: 700)
#show link: underline
#show link: emph



#counter(page).update(0)

//-------------------- Cover page --------------------


#grid(
  columns: (1fr, 1fr),
  column-gutter: 1cm,
  align: (center, center)
)[
  #image("assets/logo/KASIT-removebg-preview.svg", fit: "contain", height: 4cm)][
  #grid(columns: (auto, auto), align: (left, center))[
    #image("assets/logo/JU.svg", fit: "contain", height: 4cm)
  ][
    #align(horizon + left)[
      #par(leading: 1em)[
        #text(size: 16pt, weight: "bold")[The University \ of Jordan]
      ]
    ]
  ]
]

#v(4em)
#align(center)[
  #text(size: 22pt)[Graduation Project]
  #v(2em)
  #text(size: 16pt)[Supervised by: Prof. Amjad Hudaib and Dr. Esra AlZaghoul]
]
#place(bottom + center)[
  #move(dy: -1cm)[
    #set text(size: 14pt, weight: "bold")
    King Abdullah II School of Information Technology · The University of Jordan]]

#pagebreak()

#set page(numbering: "i")
// ------------- Table styling -------------
#set table(
  fill: (coloum, row) => if row == 0 { rgb("#2F5496") },
  stroke: rgb("#2F5496"),
  align: center + horizon,
)
#show table: set par(leading: 0.5em)
#show table: set par(justify: false)
#show table: set align(center)





#v(4cm)
#align(center)[ #image(
    "assets/logo/JULink logo.svg",
    fit: "contain",
    height: 4cm,
  )

  #text(size: 5em)[
    #v(0.5em)
    #text(size: 24pt)[Fall Semester 2025/2026]
  ]
#scale(x: 8cm, y: 3cm)[
  #table(
    fill: (coloum, row) => if row == 0 { rgb("#0657B5") } else if coloum == 0 { rgb(white) },
    columns: 2,
    stroke: black,

    [*Student Name*], [*Student ID*],
    [Anas AL-Jallad], [0225343],
    [Ahmad AlManasrah], [0227255],
    [Anas AlRao'sh], [2222312],
  )
]
]
#set heading(numbering: "1.")
#show heading: set block(spacing: 1em)
#pagebreak()
#outline()
#pagebreak()

#outline(title: [Tables], target: figure.where(kind: table))
#pagebreak()
#outline(
  title: [Figures],
  target: figure.where(kind: image),
)
#pagebreak()
#show heading: set block(height: 1.22em)
#include "chapters/abstract/abstract.typ"

#set page(numbering: "1")
#counter(page).update(1)

#show heading.where(level: 1): set heading(numbering: (..) => h(-0.3em))
#show heading.where(level: 1): set align(center)

#include "chapters/chapter1/chapter1.typ"
#pagebreak()
#show table.cell.where(y: 0): set text(
  fill: white,
  weight: "bold",
)
#include "chapters/chapter2/chapter2.typ"
#include "chapters/chapter3/chapter3.typ"
#include "chapters/chapter4/chapter4.typ"
#include "chapters/chapter5/chapter5.typ"
#include "chapters/chapter6/chapter6.typ"
#include "chapters/chapter7/chapter7.typ"
#include "References/References.typ"
#include "Appendices/Appendices.typ"