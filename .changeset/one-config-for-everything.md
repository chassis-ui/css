---
'@chassis-ui/css': patch
---

One `@use "@chassis-ui/css/scss/config" with (…)` configures every variable of the framework: the feature flags, the defaults, the token variables (`$primary`, `$danger`, `$space-medium`) and the vendor tokens. `@use "@chassis-ui/css/scss/config/defaults" with (…)` takes the same variables.

Until now the compile stopped with `This module was already loaded, so it can't be configured using "with"` for a token variable in either rule, and for an `$enable-*` flag in `config/defaults`: `scss/config/_defaults.scss` loaded those modules before it forwarded them. A token variable had to be set with `@use "@chassis-ui/css/scss/tokens" with (…)`, placed before the `config` rule; that still works.

The compiled CSS is the same. The source maps of `dist/css/` follow the moved lines.
