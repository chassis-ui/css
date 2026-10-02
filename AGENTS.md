# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project overview

Chassis CSS (`@chassis-ui/css`) is a tokenized CSS framework that bridges design tokens from Figma to production code. It is derived from Bootstrap's Sass architecture and JS component system but has been substantially reworked around a context-based color system and design-token pipeline.

The repository is a pnpm workspace in the layout of `chassis-tokens` and `chassis-react`:

```
packages/
  css/           # @chassis-ui/css, published to npm
    scss/        # the Sass source; scss/tests/ holds the Sass tests
    js/          # src/ (TypeScript), dist/ (compiled modules, committed), tests/
    postcss/     # the PostCSS preset, @chassis-ui/css/postcss
    dist/        # css/, js/ and tailwind/: the build output, committed and published
    build/       # the build of the package (Rolldown, PostCSS, the Tailwind entry, verify)
  site/          # chassis-css-site, the Astro documentation site (private)
build/           # repository scripts (links, version references, release notes)
  tests/         # tests of the build scripts, of build/ and of packages/css/build/
vendor/assets    # git submodule of chassis-ui/assets
_site/           # the built site, not committed
```

**In this file, a path that starts with `scss/`, `js/`, `postcss/` or `dist/` is inside `packages/css/`.** They are also the paths inside the published package. A path of the repository root or of the site is written in full (`build/check-links.mjs`, `packages/css/build/`, `packages/site/content/`).

The three deliverables:

- **CSS framework** — Sass source in `scss/`, compiled to `dist/css/`.
- **JS components** — TypeScript in `js/src/`, compiled to per-component ES modules with declarations in `js/dist/` and combined builds in `dist/js/` (`chassis.js` with the peer dependencies external, `chassis.bundle.js` with them bundled in). The package entry is `js/dist/index.js`, compiled from the barrel `js/src/index.ts`.
- **Documentation site** — an Astro site in `packages/site/`, built to `_site/`, using the shared `@chassis-ui/docs` package for layout/components.

This repo is part of a multi-repo ecosystem (`chassis-website`, `chassis-react`, `chassis-tokens`, `chassis-icons`, `chassis-assets`, `chassis-figma`). See [README.md](README.md) for the full picture.

Human contributors follow [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md): dev setup, branches, what a pull request needs, and how releases are made.

## Quick commands

Package manager is **pnpm** (pinned in the root `package.json`), with Node.js 22.12 or later (`.nvmrc` has 24, the version of the single-version CI jobs). Run `pnpm install` first, and run every command from the repository root: the root scripts run the ones of the package in `packages/css` (`pnpm --filter @chassis-ui/css run <script>`).

- `pnpm dev` — watch CSS/JS + Astro dev server (`http://localhost:4323/css/`)
- `pnpm build` — compile CSS + JS, then build the docs site
- `pnpm dist` — `pnpm css` and `pnpm js` together: everything in `dist/` and `js/dist/`
- `pnpm css` — compile, prefix and minify CSS, then build the Tailwind entry (`dist/tailwind/`)
- `pnpm js` — compile, emit declarations (`js:emit-types`) and minify JS
- `pnpm css:lint` / `pnpm js:lint` / `pnpm site:lint` — lint (or `pnpm check:code` for all three)
- `pnpm js:typecheck` — `tsc --noEmit` over `js/src/` and the type tests in `js/tests/types/`
- `pnpm css:test` — Sass unit tests (Jasmine with sass-true, `scss/tests/`)
- `pnpm js:test:unit` — JS unit tests (Vitest in browser mode, `js/tests/unit/`); Chromium only locally, Chromium, Firefox and WebKit in CI or with `pnpm js:test:unit:all-browsers`. See [js/tests/README.md](packages/css/js/tests/README.md)
- `pnpm js:test:e2e` — Playwright end-to-end tests in Chromium, Firefox and WebKit (`js/tests/e2e/`): one spec per plugin, on the pages of `js/tests/visual/`. A `test.fixme` there is a known defect of a plugin, with what is expected and what happens
- `pnpm js:test:a11y` — axe on the same pages, as they load and with their component open, in Chromium. `js/tests/e2e/helpers/a11y-known.ts` records what it finds today; a new violation fails
- `pnpm js:test:integration` — bundles `dist/js/chassis.js` and single modules of `js/dist/` with Rollup, and packs the package into an empty project that imports it with Node.js and type-checks it with `tsc`
- `pnpm check:package` — `publint` and `attw` over the packed package: `exports`, `types` and file layout
- `pnpm css:test:tailwind` — Node-only regression test for the Tailwind build (`dist/tailwind/`); needs `pnpm dist` run first
- `pnpm js:test:e2e:tailwind-parity` — Playwright project comparing computed styles between `dist/css/chassis.css` and a fresh Tailwind build; opt-in locally (excluded from `pnpm js:test:e2e` and `pnpm test`) because it's slower than the rest of the e2e suite, though CI runs it (the `css` job of `.github/workflows/ci.yml`) — run it after touching `scss/tailwind/` or the utility/component clash policies
- `pnpm verify` — rebuild `dist/` and `js/dist/` and fail when they differ from the commit; the Dist job of CI runs it, and the release workflow publishes only when that job passed on the commit, since `npm publish` ships both as committed
- `pnpm build:test` — tests of the build scripts (`node --test`, `build/tests/`): each runs a script on files of its own, never on the repository
- `pnpm lint:prettier` — Prettier over the whole repository; `.prettierignore` lists what is left out
- `pnpm test` — lint + dist + css/js unit tests (including `css:test:tailwind`) + site build + site lint. It does not run `js:typecheck`, the e2e and integration tests, `check:package` or `verify`; CI runs all of them
- `pnpm test:ci` — every check of `.github/workflows/ci.yml` except the changeset check and the dependency review, in one run: the unit tests in three browsers, the e2e tests and the site build included. Takes several minutes and needs the three Playwright browsers. A test in `build/tests/` fails when the workflow runs a script that `test:ci` does not

Run the narrowest relevant command while iterating, then the checks in [Before a task is done](#before-a-task-is-done).

## Before a task is done

Run the checks of the area you changed, and report the ones that fail.

| Area changed                                                        | Run                                                                                                                                                                           |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scss/`                                                             | `pnpm css:lint`, `pnpm css`, `pnpm css:test`, `pnpm verify`                                                                                                                   |
| `scss/tailwind/`, `packages/css/build/tailwind/`                    | the row above, then `pnpm css:test:tailwind` and `pnpm js:test:e2e:tailwind-parity`                                                                                           |
| `js/src/`                                                           | `pnpm js:lint`, `pnpm js:typecheck`, `pnpm js:test:unit`, `pnpm verify`; `pnpm js:test:e2e` for behavior a user sees, `pnpm js:test:a11y` for ARIA attributes                 |
| Exports, `packages/css/package.json`, `postcss/`, `js/src/index.ts` | `pnpm js:test:integration`, `pnpm check:package`, `pnpm verify`                                                                                                               |
| `packages/site/`                                                    | `pnpm check:astro`, `pnpm site:build`, then `pnpm site:lint` (its HTML validation reads `_site/`)                                                                             |
| `build/`, `packages/css/build/`                                     | `pnpm js:lint`, `pnpm build:test`; add a test in `build/tests/` for a change of behavior                                                                                      |
| `.github/workflows/`                                                | `actionlint`, and `pnpm build:test`: a script `ci.yml` runs is part of `test:ci` in the root `package.json`. A job name is also in the ruleset of `main` and in `release.yml` |
| README or other Markdown                                            | `pnpm docs:links`, `pnpm lint:prettier`                                                                                                                                       |
| A `package.json` or `pnpm-lock.yaml`                                | `pnpm install --frozen-lockfile`, `pnpm verify` (the bundled dependencies are in `dist/js/chassis.bundle.js`)                                                                 |

## Generated and committed output

`dist/` and `js/dist/` are generated **and committed**: `npm publish` ships them as they are in the commit, and the `dist` job in CI runs `pnpm verify`, which fails when a fresh build differs from them. Never edit them by hand. Change the source, rebuild with `pnpm dist`, and commit the rebuilt files together with the source change. `pnpm verify` also fails on a file in `js/dist/` with no module in `js/src/`, so delete the output of a removed module.

## SCSS conventions

- Module system: `@use` / `@forward` only — never `@import`.
- One partial per component (e.g. `_accordion.scss`), forwarded from `scss/chassis.scss`.
- CSS layers, declared in `scss/_root.scss`: `colors, theme, config, root, reboot, layout, content, components, custom, helpers, utilities`. Component rules live inside `@layer components { ... }` (or `forms`, etc.).
- Prefer the `border-radius()` mixin over the raw `border-radius` property — it gates rounding on the global radius toggle. Use the raw property only for shape-defining elements (circles, pills) where the radius is structural, not stylistic.
- `--fg-color` / `--bg-color` custom properties look unused component-locally but are consumed by the context utility classes — don't remove them during cleanup without checking `scss/_context.scss` and `scss/utilities/`.
- Component selectors may not use certain "generic" modifier class names (`small`, `large`, `primary`, `outline`, `solid`, `horizontal`, etc. — see `forbiddenGenericClasses` in [stylelint.config.js](stylelint.config.js)), enforced by stylelint.
- The Sass of the site (`packages/site/src/scss/`) loads the framework by relative path (`../../../css/scss/mixins`), and is linted with it.
- Doc markers `// scss-docs-start name` / `// scss-docs-end name` mark regions extracted into the docs site.
- Run `pnpm css:lint && pnpm css:test` after editing `scss/`. After editing `scss/tailwind/` specifically, also run `pnpm css:tailwind && pnpm css:test:tailwind` (needs a fresh `dist/tailwind/` build), and `pnpm js:test:e2e:tailwind-parity` for anything that could change computed styles.
- In the Tailwind entry the grid classes are `@utility` rules (`scss/tailwind/mixins/_grid.scss`) whose declarations sit in a nested `@layer layout`, the `utilities.layout` sublayer, so utilities override them at every breakpoint. A property Tailwind core merges into a same-name grid class (`col-<n>`'s `grid-column`) is reset directly in the `@utility`, outside the sublayer; `pnpm css:tailwind` fails if one isn't.
- Tailwind-specific code lives only in Tailwind folders: `scss/tailwind/` (entries, partials, and its own `mixins/`), `scss/tests/tailwind/`, and `packages/css/build/tailwind/`. Tailwind code may `@use` native modules; native code never loads anything from `scss/tailwind/` — `pnpm css:lint:tailwind` (`packages/css/build/tailwind/check-isolation.mjs`) enforces it, for the Sass of the site too.
- `scss/tailwind/_source-exclusions.scss` and `scss/tailwind/_clash-policy.scss` are generated, checked-in files (`pnpm css:tailwind:update-clashes` / `pnpm css:tailwind:update-clash-policy` regenerate them from `packages/css/build/tailwind/*-clashes.json`) — don't hand-edit; `packages/css/build/tailwind/build.mjs` fails the build if either has drifted from what it re-derives. `scss/tailwind/_source-safelist.scss` is hand-maintained, not generated.
- The `--cx-` custom-property prefix is applied by PostCSS, not Sass (`postcss/index.js`, published as `@chassis-ui/css/postcss`) — `packages/css/build/postcss.config.js` and `packages/css/build/tailwind/postcss.config.js` both import it rather than duplicating the plugin.

## JavaScript conventions

- Source is TypeScript. Components extend `BaseComponent` (`js/src/base-component.ts`), one file per component under `js/src/`, mirrored by unit tests in `js/tests/unit/<component>.spec.js` (the specs are JavaScript).
- Every public component is re-exported from `js/src/index.ts`. Imports between modules use the `.js` extension (`./accordion.js`), which `tsc` and the build resolve to the `.ts` file.
- Shared DOM/utility helpers live in `js/src/dom/` and `js/src/util/`.
- The package ships per-component builds (`js/dist/`) plus two combined builds in `dist/js/`: `chassis.js` (dependencies external) and `chassis.bundle.js` (dependencies bundled in) — verify changes against the **production build** (`pnpm js:compile`), not just dev/watch output. Tree-shaking, `sideEffects`, and bundling behavior in `package.json` can regress in the compiled bundle even when a dev-mode click-test passes.
- After editing `js/src/`, run `pnpm js:lint && pnpm js:typecheck && pnpm js:test:unit`; for changes touching module boundaries or exports also run `pnpm js:test:integration && pnpm check:package`.

## Docs conventions

- MDX docs live in `packages/site/content/docs/`, organized by section (`components/`, `forms/`, `layout/`, `utilities/`, `helpers/`, etc.). Reusable snippets live in `packages/site/content/callouts/`.
- The site depends on the package as `workspace:*` and Astro runs in `packages/site`. `file` of `<ScssDocs>` and `<JsDocs>` and `filePath` of `<Code>` are relative to `packages/css` (`sourceDir` in `packages/site/config.yml`): `file="scss/_button.scss"`, and `file="../site/src/scss/_examples.scss"` for a file of the site.
- The site uses `@chassis-ui/docs` through its `chassisDocs()` integration (`packages/site/astro.config.ts`). `packages/site/src/libs/` holds only what is the site's own: the schema of its keys of `config.yml` (`config.ts`), its data files (`data.ts`) and its Astro integration (`astro.ts`). Pages read the config and the paths from `@chassis-ui/docs/site`.
- Style guide: [WRITING.md](WRITING.md) — instructive voice (no `you`/`your`/`we`/`our`) for component/helper/core-concepts docs, tutorial voice (`you`/`your` allowed) for getting-started/customize/overview pages. Standard component section order: Introduction → Basic structure → Content components → Layout → Advanced → Theming → Accessibility → JavaScript API → CSS, with Theming placed right after Basic structure instead of after Layout for variant-centric components (Button, Badge, Notification).
- Frontmatter requires `title`, `description` (instructive voice, <160 chars), `toc`; conditional fields include `css_layer` and `css_media` (`container` vs `viewport`) — see WRITING.md's Frontmatter section.
- `<ResizableExample>` is reserved for container-query (`css_media: container`) components only.
- Inside `<Example code={...}>` blocks, preserve the template literal's indentation exactly as written — flattening it breaks MDX rendering.
- Reference implementations: `components/stepper.mdx`, `components/navbar.mdx`, `helpers/focus-ring.mdx`, `customize/optimize.mdx`.
- The site's static files (`packages/site/public/static/`, built to `_site/static/`) are requested under the shared `/static` path, the same URLs on every Chassis site (chassis-ui.com routes them by the `Referer` header), so there is no prefix: no `staticPath`, rewrite or `assetsPrefix`. Write a static URL with `getStaticPath()` of `@chassis-ui/docs/site`, never as `/static/…`.
- `pnpm vendor` builds `vendor/assets` at the pinned commit (`pnpm site:build` and `pnpm start` run it); `pnpm sync-submodules` moves the pin to the latest `app/docs`, to commit on its own. Both are `chassis-docs` commands of `@chassis-ui/docs`, as are the two HTML validators of `pnpm site:lint`; the site's exceptions for them are in `packages/site/html-validate.json` and `packages/site/vnu-filters.txt`.
- Run `pnpm site:lint` (eslint + prettier + vnu and html-validate HTML validation + the link check) after editing `packages/site/`.

## Formatting

- 2-space indent, LF line endings, final newline, trim trailing whitespace (`.editorconfig`); `.md`/`.mdx` keep trailing whitespace (line breaks).
- Prettier: single quotes in JS (double quotes in `.scss`), no semicolons, no trailing commas, 100 print width (80 for `.md`/`.mdx`).
- `pnpm lint:prettier` checks the whole repository, in CI too; `pnpm exec prettier --write <file>` formats a file. `.prettierignore` leaves out the generated files and `packages/css/js/`: the plugins and their tests follow the ESLint rules of `eslint.config.js` (no parentheses around a single arrow parameter), which `pnpm js:lint` checks.

## Commits

Conventional Commits style, with an imperative, lower-case summary: `feat:`, `fix:`, `docs:`, `refactor:`, `test:` (e.g. `fix: preserve carousel focus, set aria attribute of disabled navigation`).

Add a changeset (`pnpm changeset`) to a change of what the package publishes, and an empty one (`pnpm changeset --empty`) to a change of `scss/`, `js/src/`, `postcss/`, `dist/` or `js/dist/` that releases nothing; CI's Changeset job fails without it. While the version is `0.x`, a breaking change is a `minor` whose text starts with `**Breaking:**`. [VERSIONING.md](VERSIONING.md) lists what is public API and which bump a change needs.

Never commit, merge or push without being asked. CI runs on `develop` and on pull requests only; a commit goes to `staging` and `main` after it passed there. Pushing `main` starts `release.yml`, which publishes `@chassis-ui/css` to npm when the version is new and the CI jobs passed on that commit. The version is made on `develop` with `pnpm changeset:version`.

## Do not edit

- Generated output: `dist/`, `js/dist/` (rebuild them, see [Generated and committed output](#generated-and-committed-output)), `_site/`, `packages/site/public/`, `.cache/`.
- Written by the version step (`pnpm changeset:version`): `packages/css/CHANGELOG.md`, the version in `packages/css/package.json`, and the version references in `packages/site/config.yml` (with the CDN URLs and their SRI hashes), `js/src/base-component.ts` and `scss/mixins/_banner.scss`.
- Git submodule (synced from `chassis-assets`, not owned by this repo): `vendor/assets/`.
