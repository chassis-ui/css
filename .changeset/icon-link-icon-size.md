---
'@chassis-ui/css': patch
---

The icon of `.icon-link` is sized through `--cx-icon-size` (`1em`, `$icon-link-icon-size`) instead of a `width` and `height` of `1em`, so an SVG icon and an icon font glyph take the same room and keep the gap to the text. Until now the `1em` resolved against the font size of the icon: an SVG icon was drawn at `--cx-icon-size` (24 px with the default tokens), and a font glyph at the same size overflowed its `1em` box and touched the link text.

- An SVG icon in an icon link is drawn at `1em` of the link text, as the docs describe: 16 px instead of 24 px in a 16 px link. Add a size class such as `.icon-lg` to the icon, or set `$icon-link-icon-size`, for a larger icon.
- A size class on a font icon in an icon link sizes its box too. Before, the box stayed `1em` of the link text and the glyph overflowed it.
