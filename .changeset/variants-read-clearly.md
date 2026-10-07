---
'@chassis-ui/css': minor
---

The subtle text of a context variant has the alpha of its context. `%solid-context`, `%smooth-context` and `%outline-context` computed `--cx-fg-subtle` with `--cx-opacity-fg-subtle` in every context, so a `.badge.smooth` or a `.context.outline` in a colored context had fainter subtle text than the `fg-subtle` token of that context, whose alpha `@chassis-ui/tokens` 0.7.0 raised.

The `context()` mixin now sets `--cx-context-opacity-fg-subtle`, which the variants read: `--cx-opacity-fg-a11y` in the contexts of the new `$a11y-contexts` (`primary`, `secondary`, `neutral`, `danger`, `success`, `warning` and `info`), and `--cx-opacity-fg-subtle` in the others, which render as before.
