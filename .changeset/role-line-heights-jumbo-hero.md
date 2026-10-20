---
'@chassis-ui/css': minor
---

Chassis CSS is built with `@chassis-ui/tokens` 0.10.1, which gives the text roles `jumbo` and `hero` a line height token of their own.

- `:root` declares `--cx-line-height-jumbo` and `--cx-line-height-hero` (`1.25em`), from the new Sass variables `$line-height-jumbo` and `$line-height-hero` and the `"jumbo"` and `"hero"` keys of `$context-line-heights`. `.font-jumbo` and `.font-hero` read them, with the line height they had. Their sizes stay in their classes.
- A project with its own token source builds it with `@chassis-ui/tokens` 0.10.1. `scss/tokens/` reads `$cx-typography-line-height-context-jumbo` and `-hero`, which 0.10.0 does not have.
- Tokens 0.10.1 changes fonts of the `chassis` brand: `.blockquote` and `.font-blockquote` are Regular Italic (`400`) instead of Light Italic (`300`), the code family ends with `ui-monospace, monospace`, and the icon family is quoted, `"Chassis-Icons"`.
