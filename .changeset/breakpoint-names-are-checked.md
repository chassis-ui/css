---
'@chassis-ui/css': patch
---

A breakpoint mixin or function stops the compile on a name that is not a key of `$breakpoints`: ``breakpoint `lgg` not found in `xs, sm, md, lg, xl, 2xl` ``. Until now the lookup gave no width, and `media-breakpoint-up()`, `media-breakpoint-down()` and the other query mixins wrote their content with no query around it, for every width.

The compile also stops when a name and the key of `$breakpoints` differ in Sass type. An unquoted `2xl` is a number and a quoted `"2xl"` a string, two keys of a map: a `$breakpoints` with `"2xl"` lost the gutter, the page margin, the column count and the container width of that breakpoint. Write the name without quotes, in the map and in the mixins. `is-breakpoint($name, $breakpoints)` is the check the framework uses, for a stylesheet of your own.

A build that stops after the update has a name to correct:

- a misspelled name in a mixin (`media-breakpoint-up(xxl)`),
- a quoted `"2xl"` in `$breakpoints` or in a call,
- a `$breakpoints` without `sm`, which the dialog, the modal, the alert, the menu and the card name in their own rules, or without `lg` when `$font-size-root-lg` is set.

`.container` no longer takes the max-widths of breakpoints that a project removed from `$breakpoints`. They were written with no query, so every container had the max-width of the largest one at every width; `$container-max-widths` warns about such a key and ignores it, as the grid maps do.

The compiled CSS of `dist/` is the same. The source maps of `dist/css/` follow the moved lines.
