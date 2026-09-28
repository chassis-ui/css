# Chassis CSS

> A tokenized CSS framework bridging Figma designs to seamless code implementation.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@chassis-ui/css)](https://www.npmjs.com/package/@chassis-ui/css)
[![CI](https://github.com/chassis-ui/css/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/chassis-ui/css/actions/workflows/ci.yml?query=branch%3Adevelop)

## Overview

Chassis is an open-source end-to-end design system that bridges the gap between design and development, creating a seamless workflow from Figma to production code. It represents a new generation of design systems built on design tokens, solving the common disconnect between designers' intentions and developers' implementations.

Starting with inspiration from Bootstrap but evolving into something entirely new, Chassis focuses on creating a system where design decisions can be made directly in Figma and automatically reflected in code across multiple platforms, products, and brands.

## Features

- **Design Token System**: Chassis creates a single source of truth through design tokens that define every aspect of your UI, from colors and typography to spacing and component styles. The tokens come from [`@chassis-ui/tokens`](https://github.com/chassis-ui/tokens).

- **Advanced Color System**: Beyond simple palettes, Chassis introduces context-based semantics. Base colors derived from the brand feed context colors (`primary`, `success`, `danger`, and more), each with a palette of states such as hover, active, subtle, and contrast that keep their meaning in light and dark modes.

- **Context Classes**: A unique implementation that uses CSS variable re-declaration to create context-aware components. This system allows elements to completely change their color palette while maintaining semantic meaning and reducing CSS file size.

- **Component Library**: Fully tokenized, accessible components that automatically adapt to your brand's design tokens. Components share common foundations while supporting multiple variants, sizes, and states. Interactive components come with TypeScript-typed JavaScript plugins.

- **Multi-Brand & Theme Support**: Built-in support for multiple brands, themes, and color modes through token collections. Switch between brands or toggle dark mode without changing your markup.

- **Tailwind CSS v4 Entry**: An alternative entry point that exposes Chassis components and utilities through Tailwind's own variant engine.

## Getting Started

### Installation

```shell
npm install @chassis-ui/css
```

The JavaScript plugins use two peer dependencies: `@floating-ui/dom` (menus, popovers, tooltips) and `vanilla-calendar-pro` (datepicker). npm 7 and later installs them automatically.

### Usage

Include the compiled CSS in your HTML, and the JavaScript if you use interactive components. The JavaScript builds are ES modules:

```html
<link rel="stylesheet" href="node_modules/@chassis-ui/css/dist/css/chassis.min.css">

<!-- Optional: only for interactive components -->
<script type="module" src="node_modules/@chassis-ui/css/dist/js/chassis.bundle.min.js"></script>
```

`chassis.bundle.min.js` includes both peer dependencies. `chassis.min.js` expects them to be resolved separately.

Components with a data-attribute API, such as `data-cx-toggle="tooltip"`, initialize themselves. Import a plugin to control a component from code:

```js
import '@chassis-ui/css/dist/css/chassis.min.css'
import { Dialog } from '@chassis-ui/css'

Dialog.getOrCreateInstance('#welcome-dialog').show()
```

The package exports `Accordion`, `Button`, `Carousel`, `Chip`, `ChipInput`, `Collapse`, `Combobox`, `Datepicker`, `Dialog`, `Drawer`, `Menu`, `NavOverflow`, `Notification`, `OtpInput`, `Popover`, `ScrollSpy`, `Strength`, `Tab`, `Toast`, `Toggler`, and `Tooltip`.

### Using Sass

Compile Chassis from source to apply your own tokens and settings. Chassis uses the Sass module system:

```scss
// styles.scss
@use "@chassis-ui/css/scss/config" with (
  $enable-dark-mode: false
);
@use "@chassis-ui/css/scss/chassis";

.my-custom-element {
  padding: var(--cx-space-sm) var(--cx-space-md);
  background-color: var(--cx-primary);
  color: var(--cx-primary-contrast);
  border-radius: var(--cx-border-radius-sm);
  font-family: var(--cx-font-family-text);
}
```

Sass needs `node_modules` and the package's `scss/vendor/` directory on its load paths, and a PostCSS step adds the `--cx-` prefix to the custom properties. The [installation guide](https://chassis-ui.com/css/docs/getting-started/installation/) covers both, and [Sass customization](https://chassis-ui.com/css/docs/customize/sass/) shows how to switch to another token set.

### Using Tailwind CSS

For Tailwind CSS v4 projects, import the Tailwind entry point instead. It exposes Chassis components and utilities through Tailwind's own variant engine (`dark:fg-primary`, `lg:font-xl`, `hover:shadow-md`):

```css
/* app.css */
@import "@chassis-ui/css/tailwind";
```

See the [Tailwind guide](https://chassis-ui.com/css/docs/getting-started/tailwind/) for setup, variant behavior, and known differences from the regular Sass/CSS entry.

### Context classes

Context classes change a component's whole color palette while keeping its structure:

```html
<button type="button" class="button primary">Submit</button>

<div class="notification success" role="status">Your changes have been saved.</div>
<div class="notification danger" role="status">The upload failed.</div>

<div class="card context warning">
  <div class="card-body">Your session will expire in 5 minutes.</div>
</div>
```

### Browser support

The targets come from [`.browserslistrc`](.browserslistrc):

| Browser | Supported versions |
|---------|-------------------|
| Chrome | 130 and later |
| Edge | 130 and later |
| Firefox | 132 and later |
| Safari (macOS and iOS) | 18 and later |
| Other browsers | Last 2 major versions |

Internet Explorer is not supported. See [Browsers & Devices](https://chassis-ui.com/css/docs/getting-started/browsers-devices/) for details.

## Documentation

Visit [chassis-ui.com/css](https://chassis-ui.com/css/) for the full documentation:

- [Getting Started](https://chassis-ui.com/css/docs/getting-started/overview/)
- [Core Concepts](https://chassis-ui.com/css/docs/core-concepts/overview/)
- [Design Tokens](https://chassis-ui.com/css/docs/core-concepts/design-tokens/)
- [Context Classes](https://chassis-ui.com/css/docs/core-concepts/context-class/)
- [JavaScript](https://chassis-ui.com/css/docs/getting-started/javascript/)
- [Components](https://chassis-ui.com/css/docs/components/accordion/)

## Chassis Ecosystem

This project is part of the Chassis Design System's multi-repository architecture:

| Project | Description |
|---------|-------------|
| [chassis-website](https://github.com/chassis-ui/website) | Main website and shared documentation package |
| **chassis-css** | **CSS framework and component library (this repository)** |
| [chassis-react](https://github.com/chassis-ui/react) | React component library |
| [chassis-tokens](https://github.com/chassis-ui/tokens) | Design token generation and management |
| [chassis-icons](https://github.com/chassis-ui/icons) | Icon library and build toolkit |
| [chassis-assets](https://github.com/chassis-ui/assets) | Multi-platform asset management |
| [chassis-figma](https://github.com/chassis-ui/figma) | Figma component documentation |

All documentation sites share the `@chassis-ui/docs` package for consistent layouts, components, and styling.

## Contributing

Contributions are welcome. For major changes, please open an issue first to discuss what you would like to change. The [contributing guide](https://chassis-ui.com/css/docs/getting-started/contribute/) covers the tooling and the scripts.

### Development

Requires Node.js 22 or later and pnpm (the version is pinned in `package.json`; `corepack enable` installs it):

```shell
git clone https://github.com/chassis-ui/css.git
cd css
pnpm install
pnpm dev
```

`pnpm dev` compiles CSS and JavaScript in watch mode and serves the documentation site at `http://localhost:4323/css/`. `pnpm test` runs the lint, build, and test suite. The compiled `dist/` and `js/dist/` folders are committed: rebuild them with `pnpm dist` and commit the result with the change, since `pnpm verify` fails in CI when they differ from the source.

## Origin & Attribution

Chassis CSS is derived from [Bootstrap](https://getbootstrap.com/) and has been heavily modified to meet Chassis design system needs. This includes the Sass architecture, JavaScript component system, and documentation site, all of which originate from Bootstrap and have been substantially reworked.

Bootstrap is copyright (c) 2011–2025 the Bootstrap Authors and Twitter, Inc., released under the [MIT License](https://github.com/twbs/bootstrap/blob/main/LICENSE).

The Bootstrap documentation is released under [Creative Commons Attribution 3.0 Unported (CC BY 3.0)](https://creativecommons.org/licenses/by/3.0/).

## License

MIT License — see [LICENSE](LICENSE) file for details.
