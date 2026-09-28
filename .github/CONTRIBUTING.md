# Contributing to Chassis CSS

Thanks for taking the time to contribute. This doc covers dev setup, conventions, and what a pull
request needs before it can be merged. For the details of each area it links to the docs that are
kept up to date, rather than repeating them.

## Dev setup

You need Node.js 22 or later and pnpm (the version in `packageManager` of `package.json`;
`corepack enable` picks it up).

```sh
git clone https://github.com/chassis-ui/css.git chassis-css
cd chassis-css
pnpm install
pnpm start
```

`pnpm start` builds `dist/`, fetches and builds the assets submodule in `vendor/assets` (the docs
site needs it) and then runs `pnpm dev`: CSS and JavaScript in watch mode and the docs site at
`http://localhost:4323/css/`. After the first run, `pnpm dev` is enough.

## Repository layout

The repository builds three things: the CSS framework, the JavaScript plugins and the
documentation site.

| Path                | What it is                                                                                                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scss/`             | The Sass source. `chassis.scss` and the other `chassis-*.scss` files are the entries; one partial per component. `scss/tailwind/` is the Tailwind CSS v4 entry. `scss/tests/` holds the Sass tests |
| `js/src/`           | The TypeScript source of the plugins, one module per component; `index.ts` re-exports them                                                                                                         |
| `js/tests/`         | Unit tests (`unit/`), end-to-end tests (`e2e/`), bundle and package tests (`integration/`) and type tests (`types/`). See [js/tests/README.md](../js/tests/README.md)                              |
| `dist/`, `js/dist/` | The build output, **committed and published**. See [Committed build output](#committed-build-output)                                                                                               |
| `postcss/`          | The PostCSS preset published as `@chassis-ui/css/postcss`; it adds the `--cx-` prefix                                                                                                              |
| `build/`            | The build, release and check scripts                                                                                                                                                               |
| `site/`             | The Astro documentation site, published at [chassis-ui.com/css](https://chassis-ui.com/css/)                                                                                                       |
| `vendor/assets`     | A git submodule of [chassis-ui/assets](https://github.com/chassis-ui/assets); changes belong there                                                                                                 |

## Branch and commit conventions

`develop` is the integration branch: open pull requests against it. `main` holds released versions
only; pushing it publishes to npm (see [Releases](#releases)).

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) with a lower-case,
imperative summary:

- **Types in use**: `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `chore`. A `!` after
  the type marks a breaking change (`feat!: resolve the package entry to compiled JavaScript`).
- **Scopes in use**: `js`, `site`, `tailwind`; omitted for changes that span several areas or
  none.
- Examples from this repo's history: `fix: preserve carousel focus, set aria attribute of disabled
navigation`, `feat(tailwind): generate grid classes on demand`.

Branch names aren't templated; name yours descriptively (for example `fix/carousel-focus`).

## Changing the CSS

The Sass conventions (module system, layers, the `border-radius()` mixin, forbidden generic class
names, docs markers) are in [AGENTS.md](../AGENTS.md#scss-conventions). Then:

```sh
pnpm css:lint
pnpm css
pnpm css:test
```

After a change to `scss/tailwind/` or `build/tailwind/`, also run `pnpm css:test:tailwind` and
`pnpm js:test:e2e:tailwind-parity`. The generated Tailwind files and the commands that write them
again are described in AGENTS.md too.

Class names, custom properties, Sass variables and mixins are public API: renaming or removing one
breaks the projects that use it. Say so in the CHANGELOG entry.

## Changing the JavaScript

Each plugin is a TypeScript module in `js/src/` that extends `BaseComponent`, with a spec in
`js/tests/unit/`:

```sh
pnpm js:lint
pnpm js:typecheck
pnpm js
pnpm js:test:unit
```

`js:test:unit` runs the specs in Chromium through Vitest's browser mode;
`pnpm js:test:unit:all-browsers` adds Firefox and WebKit, as CI does. `pnpm js:test:e2e` runs the
Playwright tests. For a change to the exports, `package.json` or `postcss/`, also run
`pnpm js:test:integration` and `pnpm check:package`, which pack the package and install it into an
empty project.

Check behavior in the production build (`pnpm js`), not only in the dev watcher: tree-shaking and
`sideEffects` only show there.

## Changing the docs

The pages are in `site/content/docs/`. [WRITING.md](../WRITING.md) is their style guide: voice,
section order, frontmatter and examples. With `pnpm dev` running, pages reload as you edit them.

Before opening a pull request:

```sh
pnpm check:astro
pnpm site:build
pnpm site:lint
```

`site:lint` validates the HTML of the built site and checks that every link between its pages
resolves, so it runs after `site:build`. For a change to README.md, AGENTS.md or another Markdown
file, `pnpm docs:links` checks its links, external URLs included.

## Committed build output

`dist/` and `js/dist/` are generated from the source **and committed**, because `npm publish`
ships them as they are in the commit. Don't edit them by hand. Change the source, rebuild with
`pnpm dist`, and commit the rebuilt files with the change.

`pnpm verify` rebuilds both folders and fails when the result differs from what is committed, or
when `js/dist/` has a file with no module in `js/src/`. CI runs it on Node.js 22 and 24. If it
fails on your pull request, run `pnpm dist` and commit what changed.

## What a pull request needs before merge

- **Passing CI.** `.github/workflows/ci.yml` runs these jobs, and the commands above run the same
  checks locally:
  - **Dist**: `pnpm verify` on Node.js 22 and 24.
  - **CSS**: Sass lint, build and tests, the Tailwind tests and the Tailwind parity tests.
  - **JS**: lint, type check, unit tests in Chromium, Firefox and WebKit, end-to-end tests,
    integration tests and `pnpm check:package`.
  - **Site**: `astro check`, the site build, `site:lint` and `pnpm docs:links`.
  - **Audit**: `pnpm audit --prod` fails the job; the full audit is reported only.
  - **Bundle size**: reported only.
- **The rebuilt `dist/` and `js/dist/`**, committed with any change to the source that changes
  them.
- **A CHANGELOG entry** under `## [Unreleased]` in [CHANGELOG.md](../CHANGELOG.md) for anything
  that changes the published package: CSS output, class names, custom properties, Sass API,
  JavaScript API, `exports` or the package contents. Mark a breaking change with **Breaking:**. A
  pull request that only touches the docs site, the tests or the tooling doesn't need one.

## Releases

Releases are made from `main` by `.github/workflows/publish-release.yml`:

1. A maintainer sets the new version with `pnpm change-version <old> <new>` (or `--patch`,
   `--minor`, `--major`), which updates `package.json` and the version references in the README,
   the docs config, `BaseComponent.VERSION` and the Sass banner. `pnpm dist` then rebuilds `dist/`
   and `js/dist/`, whose banners name the version, and the Unreleased section of the CHANGELOG is
   renamed to the version's entry. All of it is committed on `develop`.
2. `develop` is merged into `main` and pushed. The workflow runs the whole CI on that commit. When
   the version is not on npm yet, it runs `pnpm verify`, publishes `@chassis-ui/css` with npm
   trusted publishing and provenance (no npm token), and creates the GitHub release `v<version>`
   with the CHANGELOG entry as its body.

A prerelease version (`0.6.0-beta.1`) is published under the dist-tag of its first identifier
(`beta`), or `next` when that is a number. A version without a CHANGELOG entry is not published.

## Using the issue tracker

Search existing (including closed) issues first, then
[open a new one](https://github.com/chassis-ui/css/issues/new/choose) if your bug or idea isn't
already covered. For a security vulnerability, don't open a public issue; see
[SECURITY.md](SECURITY.md). Everyone taking part follows the
[Code of Conduct](CODE_OF_CONDUCT.md).
