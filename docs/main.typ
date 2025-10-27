#set page(
  paper: "a4",
  header: align(left)[Graduation Project 1],
  margin: 2cm,
  numbering:"1",
 )

#set text(size: 12pt,font: "Times New Roman Cyr")
#set table(fill: (coloum, row) => if  row == 0  { rgb(126, 166, 224)} else if coloum == 0  { rgb(189,193,201) },)

#v(4cm)
#align(center)[

 

  #text(size: 16pt)[JULink]

  Systems Analysis and Design \
  Supervised by: Prof. Amjad Hudaib,\ Dr. Israa\ 
  #let date = datetime(
  year: 2025,
  month: 10,
  day: 15  
  )                      
 First Semester #date.display()
  #table(columns: 2,gutter: 2pt, 
    [*Student Name*],[*ID*],
    [Anas AL-Jallad],[0225343],
    [Ahmad ALMansrah],[0227255],
    [Anas AlRaoush],[2222312],

  )

]
#pagebreak()
#text(size: 16pt,[*Version Control*])
#table(
  columns :2, align: left,
  [*Version*], [*Description*],
  [Version 1.0],[Initial version of the Graduation Project ]

)
#text(size: 16pt,[*Excutive Summary*])


#pagebreak()


#set heading(numbering: "1.", )
#outline()


#pagebreak()
#outline(
  title: [Tables],
  target: figure.where(kind: table),
)
#pagebreak()
#outline(
  title: [Figures],
  target: figure.where(kind: image),
)
#pagebreak()

#set par(justify: true,spacing: 2em)



