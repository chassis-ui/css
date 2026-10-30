---
'@chassis-ui/css': minor
---

**Breaking:** Chassis CSS is built with `@chassis-ui/tokens` 0.11, which removes the transparent primitive colors from its main files (issue 88). `scss/tokens/` no longer reads them, so a project can now install tokens 0.11, which stopped its build with `Undefined variable` on Chassis CSS 0.12.0.

- The 44 Sass variables `$black-t-05` to `$black-t-95`, `$white-t-05` to `$white-t-95` and their `-dark` variables are removed. No rule of Chassis CSS read them, so configuring them never changed the CSS. A project that reads one uses `rgba(0, 0, 0, .05)`, or `$cx-color-primitive-black-t-05` of the color files of the tokens (`color-light.scss`, `color-dark.scss`).
- `--cx-opacity-dim-slight` goes from `0.05` to `0.1`, as `opacity.context.dim-slight` does in tokens 0.11. It is the alpha of `--cx-primary-dim-slight` and of the other colored contexts, so `.bg-primary.bg-opacity-slight` now has the alpha of `.primary-dim-slight`. `--cx-dim-slight` of `.context.solid`, `.notification.solid` and `.badge` is twice as strong, which shows where a component reads it inside them, such as the hover of a link button. For the `default` and `alternate` contexts, whose `dim-slight` colors stay at `0.05`, these two now differ.
- A project with its own token source needs no change to compile: a source built with tokens 0.10 still works, and keeps `--cx-opacity-dim-slight` at `0.05`.
