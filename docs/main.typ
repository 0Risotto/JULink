#set page(paper: "a4",margin: (top: 2cm, bottom: 2cm, left: 3cm, right:2cm))
#set text(font: "Times New Roman Cyr", size: 12pt)
#set par( justify: true,spacing: 1.25em,leading : 1.25em, )

#show link: set text(fill: blue, weight: 700)
#show link: underline
#show link : emph 


#counter(page).update(0)


#grid(
        columns: (1fr, 1fr), 
        column-gutter: 1cm, 
        align: (center, center))[
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
        #text(size: 22pt,)[Graduation Project]
        #v(2em)
        #text(size: 16pt,)[Supervised by: Prof. Amjad Hudaib and Dr. Israa AlZghoul]
]  
#place(bottom + center)[
        #move(dy: -1cm)[
                #set text(size: 14pt, weight: "bold")
                King Abdullah II School of Information Technology · The University of Jordan]]

#pagebreak()

#set page(numbering: "i")
#set table(fill: (coloum, row) => if  row == 0  { rgb("#026b3b")} else if coloum == 0  { rgb(189,193,201) },)

#v(4cm)
#align(center)[ #image(
    "assets/logo/JULink logo.svg",
    fit: "contain",
    width: 10cm,
    height: 4cm,
  )
  
  #text(size: 5em)[
    #v(0.5em)
    #text(size: 24pt)[Fall Semester 2025/2026]
  ]
  
    #table(
        fill: (coloum, row) => if  row == 0  { rgb("#026b3b")} else if coloum == 0  { rgb(white) },
        columns:2,
        align: center,             
      [Student Name],[Student ID],
      [Anas AlRao'sh], [2222312],
      [Anas AL-Jallad],[0225343],
      [Ahmad AlManasrah],[0227255],
    )
  ] 
#set heading(numbering: "1.")
#show heading: set block(spacing : 1em)

#pagebreak()
#outline()
#pagebreak()

#outline( title: [Tables],
        target: figure.where(kind: table),
)
#pagebreak()
#outline(
        title: [Figures],
        target: figure.where(kind: image),
)
#pagebreak()
#show heading: set block(height: 1.22em)
#include "chapters/abstract/abstract.typ"

#set page(numbering:"1")
#counter(page).update(1)
#include "chapters/chapter1/chapter1.typ"

