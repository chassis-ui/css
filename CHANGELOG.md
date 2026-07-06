# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.3] - 2026-07-07

### Fixed
- Fixed `build/css-minify.js`: the dynamic `import('browserslist')` used to read `.browserslistrc` targets was silently failing under pnpm's strict `node_modules` layout (`browserslist` was never a direct dependency, only a transitive one), so every build minified with lightningcss's default targets instead of this project's actual declared browser support. Added `browserslist` as a direct devDependency; a failure to load targets now fails the build instead of silently degrading. Also dropped the invalid `sourceRoot: null` key lightningcss emits in source maps (violates the source map spec, triggers devtools warnings), removed a redundant JSON parse/stringify round-trip on the input source map, and anchored the `.css` → `.min.css` extension replace to the end of the filename
- Fixed the docs site dev server (`site/`) intermittently failing to load `Dialog`/`Drawer`/etc. component scripts (e.g. modals opening and immediately closing): whenever `@chassis-ui/docs` is installed as a real dependency (not workspace-linked), Vite's `optimizeDeps` pre-bundles its `example-mode.js` with its own inlined copy of `@chassis-ui/css`, producing a second module instance and duplicate data-api click listeners alongside the one aliased in `site/src/libs/astro.ts`. Excluded `@chassis-ui/docs` from `optimizeDeps` so it always resolves through the same aliased instance

## [0.3.2] - 2026-07-05

### Fixed
- Fixed the `sideEffects` field in `package.json`: it listed `./js/src/*.js`, `./js/dist/*.js`, and `./dist/js/*.js`, but not `./js/index.js` — the package's actual `exports["."]` entry point. Bundlers treated that barrel file as side-effect-free and tree-shook away any component nobody imported by name (e.g. `Dialog`, `Drawer`, `Accordion`, `Toast`, `Carousel`), silently dropping their self-registering `data-cx-toggle`/`data-cx-dismiss` click handlers. This only affected consumers who bundle `@chassis-ui/css` from source directly (e.g. via a bare `import '@chassis-ui/css'` in their own build) rather than loading the prebuilt `chassis.bundle.js`. Added `./js/index.js` to `sideEffects`.

## [0.3.1] - 2026-07-04

### Fixed
- Fixed `scss/vendor/_chassis-tokens.scss` default token forward: replaced the relative `../../node_modules/@chassis-ui/tokens/...` path (which only resolved when `@chassis-ui/tokens` was hoisted/nested inside `@chassis-ui/css`'s own `node_modules`) with a bare `@chassis-ui/tokens/...` package specifier, so consumers installing `@chassis-ui/css` under pnpm's isolated `node_modules` layout no longer hit a "Can't find stylesheet to import" Sass build error
- Added `--load-path node_modules` to `css:compile` so the Dart Sass CLI resolves the bare `@chassis-ui/tokens` specifier the same way Vite/Astro consumers already do

## [0.3.0] - 2026-07-04

Chassis CSS 0.3.0 is a near-total rewrite of the SCSS architecture, the component set, and the JavaScript plugin layer. Almost every class, custom property, and Sass API surface changed in some way — treat this as a breaking major-style release despite the semver-minor version number.

### Added

**New components**
- `Dialog` (`.dialog`): new foundational primitive built on the native `<dialog>` element, shared by Modal, Alert, and Drawer (`show()`/`showModal()`, backdrop/keyboard config, `.dialog-static`, `.scrollable`, `.translucent`, seamless "dialog swapping" between triggers inside an already-open dialog)
- `Drawer` (`.drawer`): replaces Offcanvas; native `<dialog>`-based, `.drawer-start/-end/-top/-bottom` placements, swipe-to-dismiss gestures, `.sheet` edge-flush variant, `.fullscreen`, non-modal `scroll` mode, responsive inline-collapse
- `Menu` (`.menu`): replaces Dropdown; rebuilt on Floating UI with native submenu (nested flyout) support — hover/click/`both` trigger modes, safe-triangle hover intent, mobile stacked/back-button submenu variant, portal `container` option, `display: dynamic|static`, keyboard nav
- `Stepper` (`.stepper`): horizontal/vertical progress steps with automatic "completed" state derivation and container-query overflow scrolling
- `Nav Overflow` (`.nav-overflow`): Priority+ pattern that auto-collapses overflowing nav items into a "more" menu, driven by `ResizeObserver`
- `Datepicker`: wraps `vanilla-calendar-pro`; input-bound, button-triggered, or always-visible `inline` modes, single/multiple/ranged selection, live theme sync
- `Combobox`: searchable select-style menu built on Menu, single or `multiple` selection, hidden-input form submission, diacritic-insensitive search
- `Chip Input`: tag/chip entry field with keyboard navigation, multi-select, paste support, and a public `add()`/`remove()`/`getValues()` API
- `Otp Input`: segmented one-time-passcode input with auto-advance, paste distribution, and `autocomplete="one-time-code"` SMS autofill support
- `Strength`: password-strength meter (segmented or bar variant) with configurable scoring/thresholds and a `strengthChange` event (never exposes the password value)
- `Toggler`: minimal utility component for toggling an arbitrary class or attribute on a target element
- `Form Field`, `Form Help`, `Form Label`, `Input Help`: new form-layout primitives (`.form-field`, `.form-card`, `.input-help` inline icon/button slot inside `.form-input`)
- Vertical input groups (`.input-group.vertical`), including nested groups

**SCSS architecture**
- CSS cascade layers with an explicit global order: `colors, theme, config, root, reboot, layout, content, components, custom, helpers, utilities`
- New `scss/config/` entry point consolidating all feature flags (`_settings.scss`) and every configurable variable (`_defaults.scss`, ~1,500 lines) behind a single `@use "@chassis-ui/css/scss/config" as *`
- Design tokens now resolve through a swappable vendor package (`scss/config/_vendor.scss` → `scss/vendor/_chassis-tokens.scss`, resolved via Sass `loadPaths`), so a consumer can override the entire token source without editing the framework
- `scss/tokens/` and `scss/maps/` split into focused per-domain files (borders, sizing, spacing, opacity, colors-body, colors-light/dark, plus per-component token files for Alert, Datepicker, Grid, Icon, Menu, Modal, Notification, Stepper, etc.)
- Native CSS `light-dark()` now drives dark mode in `_root.scss` (falls back to duplicated selectors only when `$enable-dark-mode: false`)
- New `scss/rfs/_clamp.scss`: `cx-clamp()`/`clamp()` mixin family generates fluid `clamp()` values (font-size, line-height, gap, padding, margin) from a single max value, replacing the old media-query-based RFS engine
- New mixins: `focus-ring()` (outline-based focus indicator), `translucent()` (frosted-glass backdrop-filter effect, opt out via `prefers-reduced-transparency`), `mask-icon()`, `tokens()` (dumps a Sass map as custom properties), `rtl-value()`/`rtl-prop()`, `dialog-header()`/`dialog-body()`/`backdrop-transitions()`
- New container-query mixin family mirroring the breakpoint mixins: `container-breakpoint-up/-down/-between/-only`, `set-container()`
- New color functions: `scss/functions/_color-context.scss` (`get-sass-color()`, `remove-context()`) for resolving/stripping context-prefixed CSS variables, including the new `oklch(from var(...) l c h / alpha)` relative-color format
- New Sass map helpers: `defaults()` (override-merge that supports removing keys), `map-get-nested()`

**New utilities**
- `scss/utilities/_gap.scss`, `_grid.scss` (CSS grid utilities), `_icon.scss`, `_link.scss` (`.link-{context}` color utilities), `_position.scss`, `_skeleton.scss`, `_spinner.scss`
- `space-x`/`space-y` (Tailwind-style "space between children"), `divide-x`/`divide-y`, `aspect-ratio`/`aspect-ratio-attr`, `container`/`.contains-inline`/`.contains-size`, `min-w-*`/`min-h-*`, `.dvh-{25,50,75,100}` (dynamic viewport height)

**Build & tooling**
- `build/check-imports.js`: static analyzer that flags unresolved, unused, or missing Sass `@use`/`@forward` imports (`css:lint:imports`)
- `build/css-minify.js`: minification moved from `clean-css` to `lightningcss` (needed for `light-dark()`, `color-mix()`, and `@layer` support)
- `build/html-validate.js`: validates built site HTML via `html-validate` (`site:lint:html`)
- Pagefind search indexing wired into `site:build` (`site:pagefind`)
- `postcss-prefix-custom-properties` plugin prefixes every `--*` custom property with `--cx-` at build time (see Changed)

### Changed

**Design tokens & color system**
- Deprecated Sass `@import` rules replaced with `@use` and `@forward` across the entire codebase
- Color variables now use `oklch()`
- CSS variable prefixing (`--cx-`) now handled by PostCSS instead of Sass — Sass source and mixins/functions emit unprefixed `--name` custom properties throughout
- RFS (Responsive Font Sizes) system replaced with CSS `clamp()`

**JavaScript**
- JavaScript is now ESM-only — the UMD build, `js/index.umd.js`, and all `jQuery` interop (`jQueryInterface()`, `defineJQueryPlugin()`) have been removed; `js/index.esm.js` is now the single entry point at `js/index.js`
- Dropped jQuery support
- Dropdown component replaced with the new Menu component, which adds submenu support
- Offcanvas renamed to Drawer, built on the native `<dialog>` element
- Modal and Alert rebuilt on the native `<dialog>` element (`.modal-window`/`.modal-container`/`.modal-backdrop` markup removed; `.modal` now applies directly to `<dialog>`)
- Popper.js (`@popperjs/core`) replaced with Floating UI (`@floating-ui/dom`) for Menu, Tooltip, and Popover positioning, via a new shared `FloatingBase` class; adds a responsive placement syntax (e.g. `placement="bottom small:top large:right"`) tied to CSS breakpoints; `popperConfig` option renamed to `floatingConfig`; `[data-popper-placement]` attribute renamed to `[data-cx-placement]`
- Added Vanilla Calendar Pro (`vanilla-calendar-pro`) as a peer dependency for the new Datepicker component
- `tab.js` dropdown handling rebuilt around the new Menu component; `scrollspy.js` menu-item activation updated to match

**Components**
- Card groups now use container queries
- List group horizontal variants now use container queries; `.list-group` renamed to `.list` (`.list.outline`, `.list.numbered`, `.list.flush`, `.list.plain`)
- Accordion: `.indicator-end` renamed `.caret-end`; Safari/WebKit Tab-focus loss after a pointer click on `<summary>` fixed by switching `display: flex` to `list-item` and moving flex layout into a new `.accordion-title` wrapper
- Avatar: `.avatar-group` renamed `.avatar-stack`
- Badge: `.round` renamed `.circle`
- Breadcrumb: `.breadcrumb-page` renamed `.breadcrumb-item`
- Card: `.card-content` renamed `.card-body` (flex column with gap)
- Image: `.img-fluid`/`.img-thumbnail` renamed `.image.fluid`/`.image.thumbnail`; new `.figure`/`.figure-caption`
- Type: `.text-initials`/`.text-monospace` renamed `.font-initials`/`.font-monospace`; heading-extension classes (`.h1`–`.h6`) and the old `.font-{size}` utilities removed from `_type.scss` in favor of the new `_text.scss` utility scale
- Button/Button-group: `.dropdown-toggle`/`.dropdown-toggle-split` renamed `.menu-toggle`/`.menu-toggle-split`
- Navbar: offcanvas integration switched to Drawer classes; `navbar-expand` now driven by container queries instead of viewport media queries; new `.navbar.translucent`
- Toast: new `.toast-footer`, `.toast.translucent`

**Forms**
- Consolidated `.form-select` into `.form-input` (`select.form-input`); `_form-select.scss` removed
- Form validation icons now require a `.validation-icons` class on any ancestor (previously controlled only by a Sass flag with no markup opt-in)
- Validation state trigger model changed from `.was-validated` + `:valid`/`:invalid` to `[data-cx-validate]` + `:user-valid`/`:user-invalid` combined with `.is-valid`/`.is-invalid`, extended to Combobox, OTP Input, and both checkbox styles
- `_form-check.scss` split into `_check-legacy.scss` (native-input, background-image icons) and `_check-modern.scss` (wrapper-div, `:has()` + masked pseudo-element icons); size/gap/font variants consolidated into a single map-driven mixin
- `.col-form-label-large`/`.col-form-label-small` replaced by `.col-form-label.large`/`.col-form-label.small`
- `.icon-addon` replaced by `.input-help` (icon/button inside `.form-input`) and `.input-addon` (prepend/append inside `.input-group`)
- Floating labels rewritten to use `:has()` instead of adjacent-sibling selectors, making label-floating robust to intervening elements like `.input-help`

**Utilities**
- Utility breakpoint variants use `{breakpoint}:` prefix (Tailwind-style) exclusively; the legacy infix form and its `breakpoint-infix()` alias are fully removed in favor of `breakpoint-prefix()`
- Media queries switched from `min-width`/`max-width` (with a 0.02px Safari rounding offset) to CSS range syntax (`width >= Xpx`)
- The utilities-API map format gained `property` maps (emit a CSS variable and a consuming property together), `selector` (`class`/`attr-starts`/`attr-includes`), `child-selector`, `variables`, `group` (deduplicated shared-property output), `print`, and `dark` media variants; the legacy `rfs`, `css-var`, `local-vars`, and `rtl` utility-map keys are no longer supported
- `border-*-radius` mixins and utilities switched from physical to logical CSS properties (RTL/vertical-writing-mode aware)
- Negative margin utilities now gated behind `$enable-negative-margins` and renamed with a `-m`/`-mt`/etc. prefix

**Build & tooling**
- Focus ring rendering switched from `box-shadow` to `outline` (new `focus-ring()` mixin)
- `gradient-bg()` mixin renamed to `gradient()`; no longer sets `background-color` itself
- The prebuilt RTL CSS build (`css:rtl`, the `rtlcss` PostCSS plugin, `.rtl.css`/`.rtl.min.css` output) has been dropped in favor of logical properties handling RTL directly
- Rollup now emits a single ESM bundle (UMD format and globals mapping removed); external deps swapped `@popperjs/core` → `@floating-ui/dom` + `vanilla-calendar-pro`
- `package.json` gained an `exports` map and `sideEffects` array in place of the `main`/`module` fields

### Removed
- jQuery peer dependency and all jQuery interop code and tests
- UMD build output and build scripts (`js:compile:umd`, `js:minify:umd`, `js/index.umd.js`)
- `@popperjs/core` dependency
- Dropdown and Offcanvas components (JS and SCSS) — replaced by Menu and Drawer
- `scss/functions/_math.scss` (`add()`, `subtract()`, custom `divide()`) and `scss/functions/_rfs.scss` (`responsive-scale()`/`rscale()`) — superseded by native Sass math and the new `clamp()`-based RFS system
- `scss/mixins/_button.scss` (`solid-button()`, `outline-button()`, `smooth-button()`) — button color-variant logic now generated from tokens directly
- `scss/helpers/_context.scss`, `_links.scss`, `_ratio.scss` — equivalent classes now generated through the utilities API (`fg-color`/`bg-color`/`link-{context}`) and the new `_stretched-link.scss`/aspect-ratio utilities
- `.lightbox` and `.centered` Modal variants
- `.navbar-nav-scroll`
- `$negative-spacers`, `$basic-opacities`, and `$bg-opacities` Sass maps

### Fixed
- Toast `hide()` now clears the autohide timeout immediately instead of after checking `defaultPrevented`, preventing a stale autohide from firing after a manual `hide()`
- Notification link-emphasis selector now excludes `.button`/`.close-button` children, preventing unwanted bold styling on those elements
- `svg-icon()` now escapes already-formed `data:image/svg+xml` URIs, fixing malformed `background-image` URLs in some code paths
- Accordion constructor now guards against malformed markup before creating its `MutationObserver`; data-API click handler now only initializes the clicked accordion and its same-`name` siblings instead of every accordion on the page

## [0.2.3] - 2026-05-03

### Changed
- `$enable-responsive-gradients` default value changed to `false`

### Fixed
- Added `scss-docs` start/end markers to `opacity-var()`, `to-color()`, and `to-opacity()` in `_color.scss` for documentation extraction
- Fixed `cleanPublicDirectory()` to delete directory contents rather than the directory itself, preventing `ENOTEMPTY` errors on macOS and Windows caused by OS-managed metadata files
- Fixed misplaced parenthesis in `copyStaticRecursively()` that caused `{ recursive: true }` to be ignored in `mkdirSync`
- Fixed documentation issues in Sass customization, background, colors, and focus-ring pages
- Removed unused shortcode components (`CSSOnly`, `DeprecatedIn`, `InFigma`)

## [0.2.2] - 2026-05-03

### Fixed
- Fixed `publish-release.yml` GitHub Actions workflow

## [0.2.1] - 2026-05-03

### Fixed
- Added `publishConfig` to `package.json` for correct npm registry targeting
- Removed `pnpm-workspace.yaml` (not needed for single-package repo)
- Fixed deployment configuration issues

## [0.2.0] - 2026-05-03

### Added
- `to-color()` SCSS function: converts any Sass color to a rounded `oklch()` value with preserved alpha
- `to-opacity()` SCSS function: generates a CSS relative color expression using `oklch(from … / opacity)` syntax, replacing `rgba()` for dynamic opacity on CSS custom properties
- `opacity-var()` SCSS function: replaces `rgba-css-var()` — generates `oklch(from var(--cx-{identifier}) l c h / var(--cx-{target}-opacity, 1))` for component color utilities
- Breakpoint prefix support for utility classes: responsive variants now use `{breakpoint}:` prefix convention (e.g. `sm:icon-md`, `lg:list-horizontal`)
- Breakpoint prefix support for `.navbar-expand` — expanded to use the new prefix convention instead of infix
- GitHub Actions workflow (`publish-release.yml`) that detects version bumps on `main` and auto-publishes releases

### Changed
- Renamed `$enable-responsive-utilities` to `$enable-adaptive-font-sizes` for clarity; controls breakpoint-based responsive font and icon size utilities
- Replaced all `rgba()` calls in SCSS variables and component styles with `to-opacity()` / `to-color()` — migrated ~76 occurrences across `_variables.scss`, `_reboot.scss`, `_button.scss`, `_forms.scss`, `_navbar.scss`, `_toast.scss`, and more
- `rgba-css-var()` function renamed to `opacity-var()` and updated to use CSS relative color syntax instead of `rgba(var(--rgb), opacity)` — no longer requires separate `-rgb` custom properties
- Removed legacy `-rgb` variable aliases (`$fg-main-rgb`, `$bg-main-rgb`, `$border-main-rgb`, etc.) from `_variables.scss` — color opacity is now applied directly via `opacity-var()` and `to-opacity()`
- Navbar `container` selector generation refactored to use escaped breakpoint strings with proper handling for numeric breakpoints
- Cleaned up `_navbar.scss` comment block and removed unused `&#{$infix}` pattern in favor of explicit `breakpoint-prefix` loop
- Container selector syntax changed from `.container-{breakpoint|fluid}` to `.container.{breakpoint|fluid}` (compound class), with CSS escaping for numeric breakpoint names (e.g. `.container.2xlarge` → `.container.\32 xlarge`)
- Image class selectors changed from `.image-fluid` / `.image-thumbnail` to compound classes `.image.fluid` / `.image.thumbnail`
- List variant selectors changed from `.list-numbered` / `.list-flush` / `.list-plain` to compound classes `.list-group.numbered` / `.list-group.flush` / `.list-group.plain`
- List horizontal variant renamed from `.list-horizontal` to `.list-group.horizontal`; responsive variant changed from `.list-horizontal-{breakpoint}` to `.list-group.{breakpoint}:horizontal` (e.g. `.list-group.large:horizontal`)
- Utility breakpoint infix convention replaced with prefix across all utilities — infix pattern `{utility}-{breakpoint}-{value}` is now `{breakpoint}:{utility}-{value}` (e.g. `p-large-xlarge` → `large:p-xlarge`)
- Offcanvas responsive class renamed from `.offcanvas-{breakpoint}` to `.{breakpoint}:offcanvas` (e.g. `offcanvas-large` → `large:offcanvas`)
- Table responsive class renamed from `.table-responsive-{breakpoint}` to `.{breakpoint}:table-responsive` (e.g. `table-responsive-large` → `large:table-responsive`)
- Modal fullscreen breakpoint class renamed from `.fullscreen-{breakpoint}-down` to `.{breakpoint}:down:fullscreen` (e.g. `fullscreen-large-down` → `large:down:fullscreen`)
- SCSS source files across all components updated with standardized JSDoc-style block comments describing component purpose, variants, and dependencies
- JS source across all components cleaned up: standardized JSDoc block comments (`Constants`, `Class definition`, `Data API implementation`, `jQuery`), removed inline workaround comments
- `eslint.config.js` minor update

### Fixed
- Form label color: now set via `--cx-fg-color` CSS custom property for proper theming support

## [0.1.2] - 2026-04-14

### Added
- Responsive icon utilities for icon positioning
- `$enable-bts` setting renamed to ``$enable-responsive-utilities`
- `_vendor.scss` file for centralized Chassis Tokens import
- Icon documentation with responsive utility examples

### Changed
- Changed `box-padding` setting to `exclude-strokes` for better Figma alignment
- Updated component mixins to use `exclude-strokes` instead of `box-padding`
- Reorganized homepage components into `homepage/` subdirectory
- Updated Chassis Tokens vendor submodule

### Fixed
- Icon positioning and sizing utilities now support responsive variants

## [0.1.1] - 2026-04-08

### Added
- Breakpoint Type Scale (BTS) utilities for responsive font sizing
- Enable/disable BTS feature via `$enable-bts` variable
- Responsive font size classes following mobile-first approach
- Circle option to border radius map

### Changed
- Updated home page documentation
- Renamed opacity levels for better clarity
- Updated internal path references

### Documentation
- Improved typography documentation with BTS examples
- Updated README.md with correct package installation and usage examples
- Fixed broken URLs and import paths in documentation

## [0.1.0] - 2025-10-28

### Added
- Major framework refactor with improved architecture
- Comprehensive documentation site built with Astro
- Design token system integration
- Context-aware color system with re-declaration approach
- Complete component library with tokenized styles
- Multi-brand and theme support
- RFS (Responsive Font Sizing) customization
- Icon positioning and inner padding utilities
- Network accessible development server

### Changed
- Migrated from Hugo to Astro for documentation
- Transferred project ownership to chassis-ui organization
- Improved build scripts and configuration
- Updated ESLint and Stylelint configurations
- Moved content folder structure for better organization
- Enhanced package.json configuration
- Updated to ES module format

### Fixed
- Icon-only button styling issues
- Code component rendering in documentation
- Transfer ownership related path issues
- Package.json configuration errors

### Documentation
- Complete rewrite of all component documentation
- New documentation for:
  - Accordion components with tokens
  - Button and Notification components
  - Modal components
  - Navigation and Navbar
  - Nav and Tabs
  - Forms (complete 8-part documentation)
  - List components
  - Card components
  - Icons
- Added docsref system and aliases
- Comprehensive core concepts documentation
- Getting started guide

## [0.0.1] - 2025-02-27

### Added
- Initial project setup
- Core SCSS architecture from Bootstrap foundation
- Basic component structure
- Grid system
- Utility classes
- Build tooling setup
- Development environment configuration

### Documentation
- Initial README
- License files (MIT and Bootstrap attribution)
- Basic project structure documentation

## Changed Ownership - 2025-10-13

The project was transferred to the chassis-ui organization, establishing it as an independent framework separate from Bootstrap.

---

## Development Timeline

### 2026 Q1-Q2
- Added breakpoint type scales
- Updated opacity system
- Enhanced border radius utilities
- Improved documentation

### 2025 Q4
- Major framework refactor
- Ownership transfer to chassis-ui
- Documentation improvements
- Build system enhancements

### 2025 Q3
- Astro migration completed
- Build script improvements
- Package configuration updates
- Submodule integration

### 2025 Q2
- Comprehensive component documentation
- Forms documentation series
- Navigation components
- RFS customization
- Card and icon improvements
- Link color namespace addition

### 2025 Q1-Q2
- Astro documentation migration (19 parts)
- Foundation work and architecture
- Initial component implementations

### 2025 Q1
- Project initialization
- Core framework setup
- Development environment

---

[0.2.3]: https://github.com/chassis-ui/css/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/chassis-ui/css/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/chassis-ui/css/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/chassis-ui/css/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/chassis-ui/css/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/chassis-ui/css/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/chassis-ui/css/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/chassis-ui/css/releases/tag/v0.0.1
