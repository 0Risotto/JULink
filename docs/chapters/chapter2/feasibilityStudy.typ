= Project management
== Feasibility study
=== Technical feasibility
JU Link will be developed using Java Spring Boot framework for back-end development, React framework for front-end development, and PostgreSQL as our database.
We chose these technologies as our  niversity offers two courses teaching Java, as well as three database courses, and our team members have experience in them.


=== operational feasibility
JU Link is operationally feasible, as similar projects have gained approval by university students and some have even extended to a larger scope. Since most university students are not from a technical ackground, our project will highly focus on achieving user experience. JU assumes most students have access to the internet most of the time and a smart device hence students will be able to use it. 


=== Economic Feasibility
*Development cost*

#show figure.where(
  kind: table
): set figure.caption(position: top)

#figure(     
  caption: [Development cost],
  numbering: "2.1",
  table(
    fill: (coloum, row) => if  row == 0  { rgb("#2F5496")} else if coloum == 0  { rgb(white) },
    stroke: (x,y) =>(rgb("#2F5496")),
    columns: 2,
    align: center,
    [Expense],[Expense Price(JD)],
    [Salaries],[13,880],
    [Equipment and installation],[2,531],
    [Licenses],[498],
  )
)
#pagebreak()
*The Needed Hardware and Software*

Table 2.2 presents the needed Hardware and Software to develop the project and their estimated
cost.

#figure(
  caption: [The needed HW and SW],
  numbering: "2.1",
table(
  columns: 6,
  
  [],
  [Description],
  [Quantity],
  [Unit Price (JD)],
  [Total Price(JD)],
  [Note],

  [HD1],
  [Laptop: Lenovo NEW ThinkPad Edge E14 Gen 6 (2024)],
  [4],
  [579],
  [2316],
  [NA],

  [HD2],
  [Fiber 800 Mbps],
  [1],
  [26],
  [26],
  [NA], 


  [HD3],
  [Printer: HP LaserJet Pro 3003DW Laser Monochrome Printer],
  [1],
  [189],
  [189],
  [NA],


  [SW1],
  [IntelliJ IDEA Ultimate],
  [1],
  [425],
  [425],
  [NA],


  [SW2],
  [Microsoft Office 2024 plus],
  [4],
  [14],
  [56],
  [NA],


  [SW3],
  [Figma Professional, dev seat ],
  [1],
  [17],
  [17],
  [NA],


  [Total],
  [-],
  [-],
  [-],
  [3,029],
  [NA],
  )
)

*Total cost = 3,029 + 13,880 = 16,909*

\

*Benefits*
// Intangible benefits
#figure(
  numbering: "2.1",
  caption: [Intangible benefits],
table(
  [Intangible benefits],[Higher satisfaction amongst students],[Strengthening community sense in students],[Improved academic performance],[Enhanced peer collaboration]
)
)
//tangible benefits
\
#figure(
  caption: [Tangible benefits],
  numbering: "2.1",
table(
  columns: 2,
  [tangible benefits],[Revenue (JD/year)],
  [Ads],[4,254],
)
)
#pagebreak()

*Payback analysis:*


#show table.cell.where(x: 0): set text(fill: white, weight: "bold")
#figure(
caption: [Cost/benefit analysis],
numbering: "2.1",
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
  [#text(fill: red)[-16,909]],
  [0], [0], [0], [0], [0], [0], 

  
  [Annual expenses],
  [0],
  [#text(fill: red)[-524]], [#text(fill: red)[-524]], [#text(fill: red)[-524]],
  [#text(fill: red)[-524]], [#text(fill: red)[-524]], [#text(fill: red)[-524]], 
  
  [Net/Benefit costs],
  [#text(fill: red)[-16,909]],
  [3730], [3730], [3730], [3730], [3730], [3730], 

  [Discount factor (6%)],
  [1.0000], [0.9434], [0.8900], [0.8396], [0.7921], [0.7473], [0.7050],
  
  [Net present value (NPV)],
  [#text(fill: red)[-16,909]],
  [3,519], [3,120], [3,132], [2,955], [2,787], [2,630], 

  [Cumulative NPV],
  [#text(fill: red)[-16,909]],
  [#text(fill: red)[-13,390]],
  [#text(fill: red)[-10,270]],
  [#text(fill: red)[-7,138]],
  [#text(fill: red)[-4,183]],
  [#text(fill: red)[-1,396]],
  [#text(fill: red)[1,234]],
    
  [Payback period],
  [6 years+],
  table.cell(colspan:  3)[*$ (1,396) / (1,396 + 1,234) = 0.53$*],
  table.cell(colspan:  3)[*6 years + 193 days*  ( $0.53 times 365$)], 
) 
)
\
#align(center)[
  $ "Lifetime ROI" = (25,524 − 20,053) / (20,053) = 0.272 $
  
  $ "Annual ROI" = 0.272 / 7 = 0.03 $
]

=== Legal Feasibility

JULink is legally feasible, as we will not be selling or leaking any students' data, and it will not include any copyrighted material in its creation. It will also comply with Jordan's Cybercrime Law by ensuring language moderation to prevent misuse and offensive behavior.

#pagebreak()
