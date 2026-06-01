#counter(figure.where(kind: image)).update(0)

#let appendix-letter = "A"
#show figure.where(kind: table): set figure(
  numbering: n => [#appendix-letter.#"."#n],
)

#show figure.where(kind: image): set figure(
  numbering: n => appendix-letter + "." + str(n),
)

= Appendix A – Questionnaire Results
#figure(
  caption: [Questionnaire results: Desired features for a JU social media app.],
  image("../assets/Appendices/Appendix_A/Appendix_A.png")
)
#figure( 
caption: [Questionnaire results: Perceived scattering of JU information across platforms.],
  image("../assets/Appendices/Appendix_A/Appendix_A2.png")
)
#pagebreak()
