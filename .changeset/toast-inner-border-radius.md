---
'@chassis-ui/css': minor
---

Toast declares its inner radius the way card, accordion and popover do (issue 43): the new Sass variable `$toast-inner-border-radius` (`calc(var(--cx-border-radius) - var(--cx-border-width))`) sets `--cx-inner-border-radius` on `.toast`, through the new hook `--cx-toast-inner-border-radius`, and the header and footer read it. Until now the calculation was written into the header and footer, so a project could not change it. The corners compute as before.
