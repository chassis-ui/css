---
'@chassis-ui/css': minor
---

**Breaking:** the default tokens of Chassis CSS now come from `@chassis-ui/website-tokens`, with the same token names and values as `@chassis-ui/tokens` 0.11 and 0.12. `@chassis-ui/tokens` becomes the builder of token repositories, with the `chassis-tokens` command, and drops its own `dist/` in a later release. `scss/vendor/_chassis-tokens.scss` forwards `@chassis-ui/website-tokens/dist/web/docs/chassis/main`, and the compiled CSS does not change.

- A project that compiles the Sass with the default token source installs `@chassis-ui/website-tokens` in place of `@chassis-ui/tokens`. Without it the compile stops, since the default source can no longer find its file.
- A project that forwards `@chassis-ui/tokens/dist/...` in a `_chassis-tokens.scss` of its own keeps working while `@chassis-ui/tokens` 0.12.x ships `dist/`, and moves to `@chassis-ui/website-tokens/dist/...` before the builder drops it. The rest of the path stays the same.
- A project that loads `dist/css/` or `dist/tailwind/` needs no change.
