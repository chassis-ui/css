## What this changes

<!-- One or two sentences. If it fixes an open issue, add "Fixes #123". -->

## Why

<!-- The problem this solves. -->

## How to check it

<!--
The quickest way for a reviewer to see it: a docs page to open with `pnpm dev`, the class or
option to try, or the test that fails without the change.
-->

---

See [CONTRIBUTING.md](CONTRIBUTING.md#what-a-pull-request-needs-before-merge) for the details
behind each of these.

- [ ] The checks of the areas I changed pass locally (the table in
      [AGENTS.md](../AGENTS.md#before-a-task-is-done)): `pnpm css:lint`, `pnpm css:test` for
      `scss/`; `pnpm js:lint`, `pnpm js:typecheck`, `pnpm js:test:unit` for `js/src/`;
      `pnpm site:build` and `pnpm site:lint` for `site/`
- [ ] **`dist/` and `js/dist/` rebuilt** with `pnpm dist` and committed, if the source changed
      them (`pnpm verify` passes)
- [ ] **Changeset** (`pnpm changeset`) if the published package changed, with **Breaking:** for
      a renamed or removed class, custom property, Sass variable, mixin, JavaScript option or
      export (see [VERSIONING.md](../VERSIONING.md)); an empty one (`pnpm changeset --empty`) if
      `scss/`, `js/src/`, `postcss/` or `dist/` changed but nothing is released
- [ ] Docs updated, if the change is visible to users of a component
