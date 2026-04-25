# Chassis CSS

> A tokenized CSS framework bridging Figma designs to seamless code implementation.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version: 0.1.2](https://img.shields.io/badge/Version-0.1.2-blue.svg)](https://github.com/chassis-ui/css)

## Overview

Chassis is an open-source end-to-end design system that bridges the gap between design and development, creating a seamless workflow from Figma to production code. It represents a new generation of design systems built on design tokens, solving the common disconnect between designers' intentions and developers' implementations.

Starting with inspiration from Bootstrap but evolving into something entirely new, Chassis focuses on creating a system where design decisions can be made directly in Figma and automatically reflected in code across multiple platforms, products, and brands.

### Core Features

- **Design Token System**: Chassis creates a single source of truth through design tokens that define every aspect of your UI, from colors and typography to spacing and component styles.

- **Advanced Color System**: Beyond simple palettes, Chassis introduces context-based semantics. Every color has meaning and purpose in the UI, with carefully designed contextual palettes that maintain accessibility and visual hierarchy.

- **Context Classes**: A unique implementation that uses CSS variable re-declaration to create context-aware components. This system allows elements to completely change their color palette while maintaining semantic meaning and reducing CSS file size.

- **Component Library**: Fully tokenized, accessible components that automatically adapt to your brand's design tokens. Components share common foundations while supporting multiple variants, sizes, and states.

- **Multi-Brand & Theme Support**: Built-in support for multiple brands, themes, and color modes through token collections. Switch between brands or toggle dark mode without changing your markup.

## Chassis Ecosystem

This project is part of the Chassis Design System's multi-repository architecture:

| Project | Description |
|---------|-------------|
| [chassis-website](https://github.com/chassis-ui/website) | Main website and shared documentation package |
| **chassis-css** | **CSS framework and component library (this repository)** |
| [chassis-tokens](https://github.com/chassis-ui/tokens) | Design token generation and management |
| [chassis-icons](https://github.com/chassis-ui/icons) | Icon library and build toolkit |
| [chassis-assets](https://github.com/chassis-ui/assets) | Multi-platform asset management |
| [chassis-figma](https://github.com/chassis-ui/figma) | Figma component documentation |

All documentation sites share the `@chassis-ui/docs` package for consistent layouts, components, and styling.

## Getting Started

### Installation

Install Chassis CSS via npm:

```shell
npm install @chassis-ui/css
```

### Usage

Include the compiled CSS in your HTML:

```html
<!-- Include Chassis CSS -->
<link rel="stylesheet" href="node_modules/@chassis-ui/css/dist/css/chassis.min.css">

<!-- Optional JavaScript -->
<script src="node_modules/@chassis-ui/css/dist/js/chassis.bundle.min.js"></script>
```

### Using with a bundler

```js
// Import Chassis CSS in your JavaScript entry file
import '@chassis-ui/css/dist/css/chassis.min.css';

// Import JS components as needed
import { Modal, Dropdown, Tooltip } from '@chassis-ui/css';

// Initialize components
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all tooltips on a page
  const tooltipElements = document.querySelectorAll('[data-cx-toggle="tooltip"]');
  for (const element of tooltipElements) {
    new Tooltip(element);
  }
});
```



## Design System in Action

### Token-Driven Development

Chassis tokens flow directly from Figma to your code, creating a seamless design-to-development workflow:

```scss
// In your custom SCSS file
@import '@chassis-ui/tokens/dist/web/my-app/my-brand.scss';
@import '@chassis-ui/css/scss/chassis.scss';

// Create a custom component using tokens
.my-custom-element {
  padding: var(--cx-space-small) var(--cx-space-medium);
  background-color: var(--cx-primary);
  color: var(--cx-primary-contrast);
  border-radius: var(--cx-border-radius-small);
  font-family: var(--cx-font-family-base);
}
```

### Component Examples

Chassis provides a rich library of components built on this token system:

```html
<!-- Button with semantic context -->
<button class="button primary">Submit</button>

<!-- Card with contextual styling -->
<div class="card context success">
  <div class="card-header">Success</div>
  <div class="card-body">
    Your changes have been saved successfully.
  </div>
</div>

<!-- Alert using the context system -->
<div class="alert warning">
  <h4>Please note</h4>
  <p>Your session will expire in 5 minutes.</p>
</div>
```

### Context Classes for Semantic UI

One of Chassis's most powerful features is the context class system that allows components to adapt their entire color palette while maintaining semantic meaning:

```html
<!-- Same component structure, different semantic contexts -->
<div class="notification primary">Primary information</div>
<div class="notification success">Success message</div>
<div class="notification warning">Warning alert</div>
<div class="notification danger">Critical error</div>
```

## Why Chassis?

### For Designers

- **Design Once, Deploy Everywhere**: Create in Figma and automatically update all implementations
- **Full Control**: Modify tokens in Figma and see changes reflect across your application ecosystem
- **Consistent User Experiences**: Ensure your design intent is preserved in the final product

### For Developers

- **Reduced Implementation Time**: The design-to-code bridge eliminates tedious translation work
- **Robust Component Library**: Well-tested components ready for production use
- **Flexible Utility System**: Expressive classes for rapid custom layouts

### For Teams

- **Single Source of Truth**: Design tokens serve as the shared language between design and development
- **Scales with Your Organization**: From small teams to enterprise-level design systems
- **Open Source Foundation**: Build on a community-supported framework that's constantly improving

## Documentation

Visit [chassis-ui.com](https://chassis-ui.com) for comprehensive documentation including:

- [Getting Started Guide](https://chassis-ui.com/getting-started/)
- [Core Concepts](https://chassis-ui.com/docsref/)
- [Component Library](https://chassis-ui.com/components/)
- [Design Tokens](https://chassis-ui.com/docsref/)

## Browser Support

Chassis CSS supports all major modern browsers:

| Browser | Supported Versions |
|---------|-------------------|
| Chrome  | Last 2 versions   |
| Firefox | Last 2 versions   |
| Safari  | Last 2 versions   |
| Edge    | Last 2 versions   |
| Opera   | Last 2 versions   |

IE 11 and older versions are not supported.

## Philosophy: Color System

Chassis introduces an advanced approach to UI colors that goes beyond traditional color systems. It's built on a deep understanding of how color creates meaning in interfaces:

- **Base Colors**: Seven foundational colors derived from brand identity, each with a complete palette of tints and shades that serve as the building blocks for the entire system.

- **Context Colors**: Eleven semantic colors (including default, primary, secondary, success, etc.) that maintain their meaning across light and dark modes, ensuring consistent user experience.

- **Context Palettes**: For each context color, Chassis creates specialized variants like hover, active, subtle, and contrast to ensure accessibility and consistent interaction states.

- **Body Colors**: Core interface colors that define surfaces, text, borders, and other fundamental UI elements, all of which adapt automatically to theme changes.

- **Re-declaration Approach**: A technical innovation that uses CSS variable re-declaration to create context-aware components with minimal CSS size.

## Origin & Attribution

Chassis CSS started as an evolution of Bootstrap, building upon its grid system and component architecture while completely reimagining the approach to design tokens, colors, and Figma integration. We're grateful to the Bootstrap team for their foundational work that helped inspire Chassis.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test the build: `pnpm build && pnpm test`
5. Commit your changes: `git commit -m "feat: add my feature"`
6. Push to the branch: `git push origin feature/my-feature`
7. Open a Pull Request

For major changes, please open an issue first to discuss what you would like to change.

## Development

Clone the repo and install dependencies:

```shell
git clone https://github.com/chassis-ui/css.git
cd css
pnpm install
```

The documentation is built with [Astro](https://astro.build/) and can be run locally:

```shell
# Run the documentation site with live reloading
pnpm dev

# Build the CSS and JavaScript
pnpm build

# Run tests
pnpm test
```

The project uses [stylelint](https://stylelint.io/) for SCSS formatting. If you're using VS Code, install the [vscode-stylelint](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint) extension with these settings:

```json
{
  "stylelint.validate": ["css", "scss"]
}
```

## License

MIT License — see [LICENSE](LICENSE) file for details.
