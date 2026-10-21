---
'@chassis-ui/css': patch
---

The inner corners of card, accordion and popover follow the component's own border radius and width. `$card-inner-border-radius`, `$accordion-inner-border-radius` and `$popover-inner-border-radius` default to `calc(var(--cx-border-radius) - var(--cx-border-width))`, which the component resolves on itself, instead of the difference of the `-md` tokens. Until now `--cx-card-border-radius: 2rem` or `.border-2xl` on a card rounded its outside and left the header and footer at the default inner radius (5px with the default tokens). With the default radius and width nothing changes.

`.rounded-*` on a component still rounds only its outside: it sets `border-radius`, not `--cx-border-radius`.
