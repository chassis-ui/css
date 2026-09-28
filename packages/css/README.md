# @chassis-ui/css

The CSS framework of the [Chassis Design System](https://chassis-ui.com): tokenized components, context classes for color, and TypeScript-typed JavaScript plugins, built on the design tokens of [`@chassis-ui/tokens`](https://github.com/chassis-ui/tokens).

```shell
npm install @chassis-ui/css
```

The JavaScript plugins use two peer dependencies: `@floating-ui/dom` (menus, popovers, tooltips) and `vanilla-calendar-pro` (datepicker). npm 7 and later installs them automatically.

## What the package holds

| Folder           | Files                                                                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dist/css/`      | The compiled CSS: `chassis.css`, and `chassis-grid.css`, `chassis-reboot.css` and `chassis-utilities.css` as separate parts, each with a minified build and source maps |
| `dist/js/`       | The JavaScript as ES modules: `chassis.js` expects the peer dependencies to be resolved, `chassis.bundle.js` includes them                                              |
| `dist/tailwind/` | The entry for Tailwind CSS v4                                                                                                                                           |
| `js/dist/`       | One module per plugin, with type declarations; `js/src/` is their TypeScript source                                                                                     |
| `scss/`          | The Sass source                                                                                                                                                         |
| `postcss/`       | The PostCSS plugin that adds the `--cx-` prefix to custom properties                                                                                                    |

## Use

Include the compiled CSS in your HTML, and the JavaScript if you use interactive components:

```html
<link rel="stylesheet" href="node_modules/@chassis-ui/css/dist/css/chassis.min.css">

<!-- Optional: only for interactive components -->
<script type="module" src="node_modules/@chassis-ui/css/dist/js/chassis.bundle.min.js"></script>
```

Components with a data-attribute API, such as `data-cx-toggle="tooltip"`, initialize themselves. Import a plugin to control a component from code:

```js
import '@chassis-ui/css/dist/css/chassis.min.css'
import { Dialog } from '@chassis-ui/css'

Dialog.getOrCreateInstance('#welcome-dialog').show()
```

Compile from the Sass source to apply your own tokens and settings:

```scss
@use "@chassis-ui/css/scss/config" with (
  $enable-dark-mode: false
);
@use "@chassis-ui/css/scss/chassis";
```

Sass needs `node_modules` and the package's `scss/vendor/` directory on its load paths, and a PostCSS step adds the `--cx-` prefix to the custom properties. The [installation guide](https://chassis-ui.com/css/docs/getting-started/installation/) covers both.

In a Tailwind CSS v4 project, import the Tailwind entry instead:

```css
@import "@chassis-ui/css/tailwind";
```

## Documentation

[chassis-ui.com/css](https://chassis-ui.com/css/) has the full documentation:

- [Getting started](https://chassis-ui.com/css/docs/getting-started/overview/)
- [Sass customization](https://chassis-ui.com/css/docs/customize/sass/)
- [Tailwind CSS](https://chassis-ui.com/css/docs/getting-started/tailwind/)
- [JavaScript](https://chassis-ui.com/css/docs/getting-started/javascript/)
- [Browsers and devices](https://chassis-ui.com/css/docs/getting-started/browsers-devices/)

## Changes

[CHANGELOG.md](https://github.com/chassis-ui/css/blob/main/packages/css/CHANGELOG.md) lists every release. [VERSIONING.md](https://github.com/chassis-ui/css/blob/main/VERSIONING.md) says what is public API and which version a change gets.

## License

MIT. Chassis CSS is derived from [Bootstrap](https://getbootstrap.com/), copyright the Bootstrap Authors and Twitter, Inc., released under the MIT License; see `LICENSE.BOOTSTRAP`.
