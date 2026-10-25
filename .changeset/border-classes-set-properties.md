---
'@chassis-ui/css': minor
---

**Breaking:** The border width and style classes set `border-width` and `border-style` again, as in 0.11.0, instead of the `--cx-border-width` and `--cx-border-style` variables of 0.11.1. The variables are inherited, so a width or style class reached every border inside its element: in `<div class="border border-xl"><p class="border-bottom">…</p></div>` the inner border was `xl` too. A class now changes only the element it is on.

- `border border-2xl`, `border-bottom border-2xl` and `border border-style-dashed` keep working in the Tailwind entry: a width or style class wins over `.border` and the side classes in whichever order Tailwind sorts them (issue 38).
- On a component, a width or style class changes the outline only, as in 0.11.0. To change the dividers and inner corners too, set the component's variable, such as `--cx-card-border-width`.
- A style class with a side class draws all four sides again: `border-top border-style-dashed` dashes the other three sides too, at the initial `medium` width.
- The components no longer set `--cx-border-style` on themselves, so `--cx-border-style` set on `:root` or on an ancestor reaches them again.
- `.border-style-inherit` sets `border-style: inherit` again.
- A width or style class on the parent of `.divide-*` no longer changes the dividers. Set `--cx-border-width` or `--cx-border-style` on the parent.
