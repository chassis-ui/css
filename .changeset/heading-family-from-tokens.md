---
'@chassis-ui/css': minor
---

**Breaking:** the HTML font family is removed. Chassis CSS is built with `@chassis-ui/tokens` 0.8, which replaces `typography.fontFamily.html` with one family per group of HTML elements.

- Removed the Sass variable `$font-family-html`, the `"html"` key of `$font-families`, the custom property `--cx-font-family-html` and the utility `.font-html` (`font-html` in the Tailwind entry). Use `.font-text`, `.font-display` or `.font-code`, or `var(--cx-font-family-text)` and the other families, for the family the brand gives the element.
- `$heading-font-family` is the `font-family` of `$cx-font-html-h1`, the family the brand gives its headings: `var(--font-family-text)` in the `chassis` brand, `var(--font-family-display)` in `sinefil`. `.blockquote` and `.attribution` take theirs from `$cx-font-html-blockquote` and `$cx-font-html-cite` in the same way. Every heading, quote and attribution keeps the family it had.
- A project with its own token source builds it with `@chassis-ui/tokens` 0.8. The maps of 0.7 name `--font-family-html`, which `:root` no longer declares.

The colors of the default tokens change with tokens 0.8, and the compiled CSS with them: new base colors for `primary`, `neutral`, `danger`, `success`, `warning` and `info`, one step darker `fg-highlight` in the light theme, stronger link colors in the dark theme, and `dim-slight` of the `default` context for the hover of a table row. The contrast pick of `.fg-a11y` and `.bg-a11y` follows the new colors: white on `danger` in the light theme, and black on `info` in both themes.
