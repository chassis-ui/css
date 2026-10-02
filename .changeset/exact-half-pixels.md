---
'@chassis-ui/css': patch
---

Build the CSS with `@chassis-ui/tokens` 0.6.0. Half-pixel values keep their full precision: `0.03125rem` instead of `0.0313rem` in `--cx-border-width-sm`, `--cx-border-width-lg`, `--cx-box-shadow-sm` and the shadows and letter spacing built on them.
