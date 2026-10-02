# Contributing to Chassis CSS

Thanks for taking the time to contribute. This doc covers dev setup, conventions, and what a pull
request needs before it can be merged. For the details of each area it links to the docs that are
kept up to date, rather than repeating them.

## Dev setup

You need Node.js 22.12 or later (`.nvmrc` names the version CI uses, 24) and pnpm (the version in `packageManager` of the root
`package.json`; `corepack enable` picks it up).

```sh
git clone https://github.com/chassis-ui/css.git chassis-css
cd chassis-css
pnpm install
pnpm start
```

`pnpm start` builds `dist/`, checks out the assets submodule in `vendor/assets` at the pinned commit
and builds it (the docs site needs it; `pnpm sync-submodules` moves the pin to the latest
`app/docs`) and then runs `pnpm dev`: CSS and JavaScript in watch mode and the docs site at
`http://localhost:4323/css/`. After the first run, `pnpm dev` is enough.

Run every command from the root of the repository. The scripts of the root `package.json` run the
ones of the package in `packages/css` for you.

## Repository layout

The repository is a pnpm workspace of two packages: `packages/css`, which is published and holds
the CSS framework and the JavaScript plugins, and `packages/site`, the documentation site. In the
rest of this guide, `scss/`, `js/`, `postcss/` and `dist/` are the folders in `packages/css/`.

| Path                | What it is                                                                                                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/css/`     | The published package, `@chassis-ui/css`. The folders of the next rows are inside it                                                                                                               |
| `scss/`             | The Sass source. `chassis.scss` and the other `chassis-*.scss` files are the entries; one partial per component. `scss/tailwind/` is the Tailwind CSS v4 entry. `scss/tests/` holds the Sass tests |
| `js/src/`           | The TypeScript source of the plugins, one module per component; `index.ts` re-exports them                                                                                                         |
| `js/tests/`         | Unit tests (`unit/`), end-to-end tests (`e2e/`), bundle and package tests (`integration/`) and type tests (`types/`). See [js/tests/README.md](../packages/css/js/tests/README.md)                 |
| `dist/`, `js/dist/` | The build output, **committed and published**. See [Committed build output](#committed-build-output)                                                                                               |
| `postcss/`          | The PostCSS preset published as `@chassis-ui/css/postcss`; it adds the `--cx-` prefix                                                                                                              |
| `build/`            | The build of the package: Rolldown, PostCSS, the Tailwind entry and `pnpm verify`                                                                                                                  |
| `packages/site/`    | The Astro documentation site, published at [chassis-ui.com/css](https://chassis-ui.com/css/). A private package that depends on the one in `packages/css/`                                         |
| `build/` (root)     | The scripts of the repository: the link check, version references, release notes                                                                                                                   |
| `vendor/assets`     | A git submodule of [chassis-ui/assets](https://github.com/chassis-ui/assets); changes belong there                                                                                                 |

## Branch and commit conventions

`develop` is the integration branch: open pull requests against it, and CI runs there. `main` and
`staging` only ever receive a commit that passed CI on `develop`: `main` is production, and a push
to it publishes a new version to npm (see [Releases](#releases)); `staging` is a preview deployment
of the docs site, pushed from `develop` when one is wanted.

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

After a change to `scss/tailwind/` or `packages/css/build/tailwind/`, also run `pnpm css:test:tailwind` and
`pnpm js:test:e2e:tailwind-parity`. The generated Tailwind files and the commands that write them
again are described in AGENTS.md too.

Class names, custom properties, Sass variables and mixins are public API: renaming or removing one
breaks the projects that use it. [VERSIONING.md](../VERSIONING.md) lists what is public and which
bump a change needs; say what breaks in the changeset.

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
Playwright tests: one spec per plugin in `js/tests/e2e/`, on the pages of `js/tests/visual/`, for
what a unit test cannot see (the keyboard, where focus goes, the production bundle).
`pnpm js:test:a11y` runs axe on the same pages. For a change to the exports, `packages/css/package.json` or `postcss/`, also run
`pnpm js:test:integration` and `pnpm check:package`, which pack the package and install it into an
empty project.

Check behavior in the production build (`pnpm js`), not only in the dev watcher: tree-shaking and
`sideEffects` only show there.

## Changing the docs

The pages are in `packages/site/content/docs/`. [WRITING.md](../WRITING.md) is their style guide: voice,
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

## Changing the build scripts

The scripts in `build/` and `packages/css/build/` build the package, check the repository and make
the release. Several run for a version only, so an error in one shows when a version is being
released. Their tests are in `build/tests/`:

```sh
pnpm js:lint
pnpm build:test
```

A test writes the files a script reads into a temporary directory and runs the script there, so
it never reads or changes the repository. Add a test for a change of behavior.

## Committed build output

`dist/` and `js/dist/` are generated from the source **and committed**, because `npm publish`
ships them as they are in the commit. Don't edit them by hand. Change the source, rebuild with
`pnpm dist`, and commit the rebuilt files with the change.

`pnpm verify` rebuilds both folders and fails when the result differs from what is committed, or
when `js/dist/` has a file with no module in `js/src/`. CI runs it on Node.js 22 and 24. If it
fails on your pull request, run `pnpm dist` and commit what changed.

## What a pull request needs before merge

- **Passing CI.** `.github/workflows/ci.yml` runs these jobs, and the commands above run the same
  checks locally. `pnpm test:ci` runs all of them except the changeset check and the dependency
  review in one command; it takes several minutes and needs the Playwright browsers
  (`pnpm --filter @chassis-ui/css exec playwright install chromium firefox webkit`).
  - **Dist**: `pnpm build:test` and `pnpm verify` on Node.js 22 and 24.
  - **CSS**: Sass lint, build and tests, the Tailwind tests and the Tailwind parity tests.
  - **JS**: lint, type check, unit tests in Chromium, Firefox and WebKit, end-to-end tests,
    accessibility checks, integration tests and `pnpm check:package`.
  - **Site**: `pnpm lint:prettier` for the whole repository, `astro check`, the site build,
    `site:lint` and `pnpm docs:links`.
  - **Audit**: `pnpm check:pnpm`, which is `pnpm audit --prod --audit-level moderate`, fails the
    job; the full audit is reported only.
  - **Dependency Review**: on a pull request, fails when it adds a dependency with a known
    vulnerability of moderate severity or higher.
  - **Bundle Size**: the gzip size of each `dist/` CSS and JavaScript file against its budget in
    `packages/css/.bundlewatch.config.json`; raise a budget with `pnpm bundlewatch:fix` when a change outgrows it
    on purpose.
  - **Changeset**: a changeset is present when the pull request changes `scss/`, `js/src/`,
    `postcss/`, `dist/` or `js/dist/`. It also runs on pushes to `develop`.
- **The rebuilt `dist/` and `js/dist/`**, committed with any change to the source that changes
  them.
- **A changeset** for anything that changes the published package: CSS output, class names,
  custom properties, Sass API, JavaScript API, `exports` or the package contents. CI fails a pull
  request that changes `scss/`, `js/src/`, `postcss/`, `dist/` or `js/dist/` without one; for such
  a change that releases nothing, such as a refactor with the same output, add an empty changeset.
  A pull request that only touches the docs site, the tests or the tooling doesn't need one.

## Changesets

A changeset is a Markdown file in [`.changeset/`](../.changeset/) that names the version bump and
the text of the CHANGELOG entry. Write one with:

```sh
pnpm changeset
```

Pick the bump, then write the entry: what changed and, for a breaking change, what a project has to
change, starting with `**Breaking:**`. Commit the file with your change.
[VERSIONING.md](../VERSIONING.md) says which bump a change needs; while the version is `0.x`, a
breaking change is a **minor**.

For a change that releases nothing, add an empty changeset instead:

```sh
pnpm changeset --empty
```

Don't edit `packages/css/CHANGELOG.md` by hand; the version step writes it from the changesets.

## Releases

The version is made on `develop`, and `.github/workflows/release.yml` publishes it when the commit
reaches `main`:

1. On `develop`, a maintainer runs `pnpm changeset:version`. It removes the changesets, bumps the
   version in `packages/css/package.json`, writes the CHANGELOG entry, updates the version
   references (`packages/site/config.yml`, `BaseComponent.VERSION`, the Sass banner) and rebuilds
   `dist/` and `js/dist/`, so their banners and the CDN URLs and SRI hashes in
   `packages/site/config.yml` match the new version. The maintainer reviews the result, commits
   it and pushes `develop`. The Changeset check skips that push, since it changes the version.
2. CI runs on that commit. When it has passed, the maintainer pushes the same commit to `main`
   (`git push origin develop:main`), and to `staging` first when a preview is wanted. Neither push
   runs CI again: the results belong to the commit, and the ruleset of `main` requires them.
3. The push to `main` starts `release.yml`. It reads the version, asks npm whether it has it, and
   stops when it does. Otherwise it reads the results of the Dist, CSS, JS, Site and Bundle Size
   jobs on the commit and stops unless each one passed. Then it publishes `@chassis-ui/css` with
   npm trusted publishing and provenance (no npm token), and creates the GitHub release
   `v<version>` with the CHANGELOG entry as its body and `chassis-css-<version>-dist.zip`
   attached.

`develop`, `staging` and `main` are the same commit after a release, so nothing is merged back. A
push to `main` that does not change the version publishes nothing.

A prerelease version (`0.6.0-beta.1`) is published under the dist-tag of its first identifier
(`beta`), or `next` when that is a number, and its GitHub release is marked as a prerelease; see
[VERSIONING.md](../VERSIONING.md#prereleases). A version without a CHANGELOG entry is not
published.

npm trusts the file `release.yml` of this repository as the publisher of the package. Renaming the
workflow breaks publishing until the trusted publisher on npmjs.com names the new file.

## Using the issue tracker

Search existing (including closed) issues first, then
[open a new one](https://github.com/chassis-ui/css/issues/new/choose) if your bug or idea isn't
already covered. For a security vulnerability, don't open a public issue; see
[SECURITY.md](SECURITY.md). Everyone taking part follows the
[Code of Conduct](CODE_OF_CONDUCT.md).
