# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project overview

Chassis CSS (`@chassis-ui/css`) is a tokenized CSS framework that bridges design tokens from Figma to production code. It is derived from Bootstrap's Sass architecture and JS component system but has been substantially reworked around a context-based color system and design-token pipeline. The repo contains three deliverables:

- **CSS framework** — Sass source in `scss/`, compiled to `dist/css/`.
- **JS components** — vanilla JS in `js/src/`, compiled to per-component builds in `js/dist/` and combined builds in `dist/js/` (`chassis.js` standalone, `chassis.bundle.js` with dependencies bundled in).
- **Documentation site** — an Astro site in `site/`, built to `_site/`, using the shared `@chassis-ui/docs` package for layout/components.

This repo is part of a multi-repo ecosystem (`chassis-website`, `chassis-tokens`, `chassis-icons`, `chassis-assets`, `chassis-figma`). See [README.md](README.md) for the full picture.

## Quick commands

Package manager is **pnpm** (pinned in `package.json`). Run `pnpm install` first.

- `pnpm dev` — watch CSS/JS + Astro dev server (port 4323)
- `pnpm build` — compile CSS + JS, then build the docs site
- `pnpm css` / `pnpm js` — compile + prefix + minify CSS, or compile + minify JS
- `pnpm css:lint` / `pnpm js:lint` / `pnpm site:lint` — lint (or `pnpm check:code` for all three)
- `pnpm css:test` / `pnpm js:test:karma` — Sass (Jasmine) / JS (Karma) unit tests
- `pnpm css:test:tailwind` — Node-only regression test for the Tailwind build (`dist/tailwind/`); needs `pnpm dist` run first
- `pnpm js:test:e2e:tailwind-parity` — Playwright project comparing computed styles between `dist/css/chassis.css` and a fresh Tailwind build; opt-in (excluded from `pnpm js:test:e2e` and `pnpm test`) because it's slower than the rest of the e2e suite — run it after touching `scss/tailwind/` or the utility/component clash policies
- `pnpm test` — full suite: lint + dist + css/js tests (including `css:test:tailwind`) + site build + site lint

Run the narrowest relevant command while iterating; run `pnpm test` (or at least `pnpm check:code`) before considering a change complete.

## SCSS conventions

- Module system: `@use` / `@forward` only — never `@import`.
- One partial per component (e.g. `_accordion.scss`), forwarded from `scss/chassis.scss`.
- CSS layers, declared in `scss/_root.scss`: `colors, theme, config, root, reboot, layout, content, components, custom, helpers, utilities`. Component rules live inside `@layer components { ... }` (or `forms`, etc.).
- Prefer the `border-radius()` mixin over the raw `border-radius` property — it gates rounding on the global radius toggle. Use the raw property only for shape-defining elements (circles, pills) where the radius is structural, not stylistic.
- `--fg-color` / `--bg-color` custom properties look unused component-locally but are consumed by the context utility classes — don't remove them during cleanup without checking `scss/_context.scss` and `scss/utilities/`.
- Component selectors may not use certain "generic" modifier class names (`small`, `large`, `primary`, `outline`, `solid`, `horizontal`, etc. — see `forbiddenGenericClasses` in [stylelint.config.js](stylelint.config.js)), enforced by stylelint.
- Doc markers `// scss-docs-start name` / `// scss-docs-end name` mark regions extracted into the docs site.
- Run `pnpm css:lint && pnpm css:test` after editing `scss/`. After editing `scss/tailwind/` specifically, also run `pnpm css:tailwind && pnpm css:test:tailwind` (needs a fresh `dist/tailwind/` build), and `pnpm js:test:e2e:tailwind-parity` for anything that could change computed styles.
- `scss/tailwind/_source-exclusions.scss` and `scss/tailwind/_clash-policy.scss` are generated, checked-in files (`pnpm css:tailwind:update-clashes` / `pnpm css:tailwind:update-clash-policy` regenerate them from `build/tailwind-*-clashes.json`) — don't hand-edit; `build/tailwind/build-tailwind.mjs` fails the build if either has drifted from what it re-derives. `scss/tailwind/_source-safelist.scss` is hand-maintained, not generated.
- The `--cx-` custom-property prefix is applied by PostCSS, not Sass (`postcss/index.js`, published as `@chassis-ui/css/postcss`) — `build/postcss.config.js` and `build/tailwind/postcss.tailwind.config.js` both import it rather than duplicating the plugin.

## JavaScript conventions

- Components extend `base-component.js`, one file per component under `js/src/`, mirrored by unit tests in `js/tests/unit/`.
- Shared DOM/utility helpers live in `js/src/dom/` and `js/src/util/`.
- The package ships per-component builds (`js/dist/`) plus two combined builds in `dist/js/`: `chassis.js` (dependencies external) and `chassis.bundle.js` (dependencies bundled in) — verify changes against the **production build** (`pnpm js:compile`), not just dev/watch output. Tree-shaking, `sideEffects`, and bundling behavior in `package.json` can regress in the compiled bundle even when a dev-mode click-test passes.
- After editing `js/src/`, run `pnpm js:lint && pnpm js:test:karma`; for changes touching module boundaries or exports also run `pnpm js:test:integration`.

## Docs conventions

- MDX docs live in `site/content/docs/`, organized by section (`components/`, `forms/`, `layout/`, `utilities/`, `helpers/`, etc.). Reusable snippets live in `site/content/callouts/`.
- Style guide: [WRITING.md](WRITING.md) — instructive voice (no `you`/`your`/`we`/`our`) for component/helper/core-concepts docs, tutorial voice (`you`/`your` allowed) for getting-started/customize/overview pages. Standard component section order: Introduction → Basic structure → Content components → Layout → Advanced → Theming → Accessibility → JavaScript API → CSS, with Theming placed right after Basic structure instead of after Layout for variant-centric components (Button, Badge, Notification).
- Frontmatter requires `title`, `description` (instructive voice, <160 chars), `toc`; conditional fields include `css_layer` and `css_media` (`container` vs `viewport`) — see WRITING.md's Frontmatter section.
- `<ResizableExample>` is reserved for container-query (`css_media: container`) components only.
- Inside `<Example code={...}>` blocks, preserve the template literal's indentation exactly as written — flattening it breaks MDX rendering.
- Reference implementations: `components/stepper.mdx`, `components/navbar.mdx`, `helpers/focus-ring.mdx`, `customize/optimize.mdx`.
- Run `pnpm site:lint` (eslint + prettier + vnu HTML validation) after editing `site/`.

## Formatting

- 2-space indent, LF line endings, final newline, trim trailing whitespace (`.editorconfig`); `.md`/`.mdx` keep trailing whitespace (line breaks).
- Prettier: single quotes in JS (double quotes in `.scss`), no semicolons, no trailing commas, 100 print width (80 for `.md`/`.mdx`).

## Commits

Conventional Commits style, with an imperative, lower-case summary: `feat:`, `fix:`, `docs:`, `refactor:`, `test:` (e.g. `fix: preserve carousel focus, set aria attribute of disabled navigation`).

## Do not edit

- Generated output: `dist/`, `_site/`, `js/dist/`, `.cache/`.
- Git submodule (synced from `chassis-assets`, not owned by this repo): `vendor/assets/`.
