# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.1]: https://github.com/chassis-ui/css/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/chassis-ui/css/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/chassis-ui/css/releases/tag/v0.0.1
