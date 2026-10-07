---
'@chassis-ui/css': minor
---

**Breaking:** the page margins and the column counts of the grid come from `@chassis-ui/tokens`, and the compiled CSS has the values of tokens 0.7.0: wider page margins, new gutters, and lighter text colors in the dark theme.

- `$margin-xsmall` to `$margin-2xlarge` and `$columns-xsmall` to `$columns-2xlarge` of `scss/tokens/_grid.scss` read `$cx-grid-margin-*` and `$cx-grid-columns-*`, where they held `.75rem` and `12`. A project that compiles the Sass needs `@chassis-ui/tokens` 0.7.0 or later, and a token source of its own (`_chassis-tokens.scss`) needs the twelve variables: without them the compile stops at an undefined variable
- The padding of `.container` (`--cx-container-padding`) is 1rem, and 1.5rem from `md`, where it was 0.75rem at every breakpoint. Set `$container-paddings`, or the `$margin-*` variables, to keep the old padding
- The gap of `.grid` and `.grid-fill` (`--cx-grid-gutter`) is 1rem, and 1.5rem from `md`, where it was 0.5rem, 1rem, 1.5rem, 2rem, 2.5rem and 3rem from `xs` to `2xl`. Set `$grid-gutters`, or the `$gutter-*` variables, to keep the old gaps. The gutter of the deprecated flexbox grid stays 1.5rem
- The column counts stay 12 at every breakpoint
- `--cx-opacity-fg-subtle` is 0.6 where it was 0.5, and `--cx-opacity-icon-subtle` 0.5 where it was 0.4, with every `fg-subtle` and `icon-subtle` color, the `spinner-opacity-subtle` and `text-decoration-opacity-subtle` utilities and the idle icon of the switch. The `fg-subtle` of the `primary`, `secondary`, `neutral`, `danger`, `success`, `warning` and `info` contexts has an alpha of 0.7
- In the dark theme, `fg-main`, `fg-highlight`, `link-main`, `link-hover` and `link-active` of the same seven contexts are lighter shades of their palette, and so are the colors made from them (`fg-subtle`, `fg-slight`, `border-subtle`, `icon-subtle`, the valid and invalid icons of the forms)
