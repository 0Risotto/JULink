#counter(figure.where(kind: image)).update(0)

#let chapter-number = 4
#show figure.where(kind: image): set figure(
  numbering: n => str(chapter-number) + "." + str(n),
)
#show figure.where(
  kind: table,
): set figure.caption(position: top)

= Project design
== Context diagram

#figure(
  caption: [JULink Context diagram],
  image("../../../assets/Context diagram/JULink Context diagram.svg"),
)

#pagebreak()