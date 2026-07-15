# Carousel Content Contract v1

Write a closed JSON object with exactly `version`, `topic`, and `slides`.
`version` is `"1"`; `topic` exactly equals the supplied normalized topic; and
`slides` has exactly seven closed objects, each with exactly `number`, `role`,
`title`, `body`, and `items`.

The ordered number/role pairs are: `1/hook`, `2/concept`, `3/breakdown`,
`4/example`, `5/comparison`, `6/application`, and `7/takeaway`. Titles are
1–70 Unicode code points, bodies 1–220, and `items` has 0–3 strings of 1–80.
Write layout-ready plain-text copy only: no HTML, CSS, Markdown, visual
directions, citations, or any files besides the authorized artifact.
