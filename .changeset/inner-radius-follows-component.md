---
'@chassis-ui/css': patch
---

The inner corners of card, accordion and popover follow the component's own border radius and width. `$card-inner-border-radius`, `$accordion-inner-border-radius` and `$popover-inner-border-radius` default to `calc(var(--cx-border-radius) - var(--cx-border-width))`, which the component resolves on itself, instead of the difference of the `-md` tokens. Until now `--cx-card-border-radius: 2rem` on a card rounded its outside and left the header and footer at the default inner radius (5px with the default tokens). With the default radius and width nothing changes.

`.rounded-*` and `.border-{size}` on a component change only its outside: they set `border-radius` and `border-width`, not the variables.
