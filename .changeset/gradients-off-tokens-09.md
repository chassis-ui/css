---
'@chassis-ui/css': minor
---

**Breaking:** background gradients are off by default, and Chassis CSS is built with `@chassis-ui/tokens` 0.9, which changes the fonts of the `chassis` brand.

- `$enable-background-gradients` is `false` by default. Avatars, badges, buttons, chips, the file input button, check inputs and switches, the range thumb, the active link of `.nav-segments`, pagination links, progress bars, stepper items, toast headers and tooltips no longer add `var(--cx-bg-gradient)` to their `background-image`. Set `$enable-background-gradients: true` to keep it. `.bg-gradient` and `--cx-bg-gradient` do not change.
- Headings take their family from the new token `typography.fontFamily.html-heading`. `:root` declares `--cx-font-family-html-heading`, and `$heading-font-family` is `var(--font-family-html-heading)`. In the `chassis` brand that is Montserrat, so headings change from Inter to Montserrat.
- The card fonts come from the tokens. `$card-md-title-font` and the other eight title, subtitle and body fonts of the three card sizes move to `scss/tokens/_card.scss`, with the `$cx-font-card-*` maps of tokens 0.9 as their defaults, and stay configurable as before. The fallbacks of the card custom properties name `--cx-font-size-lg`, `--cx-font-weight-strong` and `--cx-line-height-lg` (and the other sizes) instead of the `-text-` properties they point to, so cards look the same.
- Tokens 0.9 changes other fonts of the `chassis` brand. The display family is Montserrat instead of Archivo Narrow. `.font-jumbo`, `.font-hero` and `.font-heading` use the display family, `.font-lead` is Light (`300`), and `.font-title`, `.font-title-lg` and `.font-title-sm` take the strong weight of the display family. `.font-jumbo` and `.font-hero` tighten their letters (`-0.15625rem` and `-0.09375rem`), and every letter spacing is in `rem`.
- A project with its own token source builds it with `@chassis-ui/tokens` 0.9. `scss/tokens/` reads `$cx-typography-font-family-html-heading` and the `$cx-font-card-*` maps, which 0.8 does not have.
