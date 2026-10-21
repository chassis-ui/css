---
'@chassis-ui/css': patch
---

**Breaking:** The border width and style classes set the variables the border classes read, so they combine in the Tailwind entry too (issue 38). Tailwind sorts its utilities by its own property order, which has no `border` or `border-block-end`, so `.border` and the side classes came after `.border-2xl` and `.border-style-dashed` and reset them: `border-bottom border-2xl` and `border border-2xl` drew 1px, and `border border-style-dashed` a solid border.

- `.border-{size}` sets only `--cx-border-width`, no `border-width`. A width class beside `.border`, a side class or `.divide-*` sets their width in both builds, and a component with the class on it uses it too. A width class alone, or on a border that does not read the variable, draws nothing and changes nothing.
- `.border-style-{value}` sets only `--cx-border-style`, no `border-style`. `border-top border-style-dashed` dashes the top border alone; before, the other three sides were dashed too, at their initial `medium` width. A style class no longer changes a border that does not read the variable: the parts of a component drawn with a fixed `solid` style, such as the border under a card header, and the borders of a project's own CSS.
- A component sets `--cx-border-style` on itself (`$border-style`), as it sets `--cx-border-width`, through the `border()` mixin. A style class on an ancestor does not reach it, and neither does `--cx-border-style` set on `:root` or on an ancestor at runtime: change `$border-style`, or set the variable on the component.
- `.text-underline`, `.text-line-through` and `.text-decoration-none` set `text-decoration-line` instead of the `text-decoration` shorthand, so they no longer reset the color and thickness classes. In the Tailwind entry `text-underline text-decoration-primary` drew the underline in the text color.
