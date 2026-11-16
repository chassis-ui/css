---
'@chassis-ui/css': minor
---

**Breaking:** A font family class points the size, line height and weight utilities at the scale of its family, on its own element and on every element inside it. `.font-prose`, `.font-display` and `.font-code` set `--cx-font-size-*`, `--cx-line-height-*` and `--cx-font-weight-*` to the steps of their family, and `.font-ui` sets them back to the `ui` scale, so `<article class="font-prose"><p class="font-lg">` takes the large step of `prose`. A step or a weight that `code` lacks keeps the one it inherits: the `ui` step at the top of the page, the `prose` step inside `.font-prose`. Markup that puts the family and the size on one element, such as `class="font-prose font-lg"`, looks as before.

The compound classes `.font-prose.font-*`, `.font-display.font-*` and `.font-code.font-*` are gone, and so are their keys of `$utilities`: `font-prose-size`, `font-prose-weight`, `font-display-weight`, `font-code-size` and `font-code-weight`. A project that changes one of them with `map-merge` changes the `font-family` utility instead.

The `display` family has a size and line-height scale, in `$display-font-sizes` and `$display-line-heights`, and its composites `$font-display-<size>-<weight>`. The `ui`, `prose` and `display` scales gain a `6xl` step (`.font-6xl`), and the `code` scale `xl` and `xs`. They need `@chassis-ui/website-tokens` 0.5.

**Breaking:** The size and line-height scales of `prose` and `display` are opt-in, with `$enable-prose-scale` and `$enable-display-scale` (`false` by default). Off, `.font-prose` and `.font-display` set their family and weights, size classes inside them keep the inherited `ui` scale, and `--cx-font-size-prose-*` and `--cx-line-height-prose-*` are not generated. A project with a prose scale of its own, or one that uses `--cx-font-size-prose-*` or the `$font-prose-*` maps, sets `$enable-prose-scale: true`.

Components keep the `ui` scale inside a family class: the avatar, the link button, the OTP and password-strength inputs, the floating labels, the combobox, the menu, the card header, the notification and the table header read the `--cx-*-ui-*` custom properties instead of the generic ones.

**Breaking:** `.font-text` and `--cx-font-family-text`, deprecated in 0.10, are removed. Use `.font-ui` and `--cx-font-family-ui`.

**Breaking:** `.h1` to `.h6`, deprecated in 0.10, are removed. Use `.font-h1` to `.font-h6`.
