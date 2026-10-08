---
'@chassis-ui/css': patch
---

**Breaking:** the styles of the `color-mode()` mixin follow the colors of the framework: the nearest `data-cx-theme` attribute, and the system preference where no attribute is set. `$color-mode-type` has a new value for this, `auto`, and it is the default. Until now the default was `media-query`, which ignored the attribute, so the dark styles of a project did not switch with a color mode toggle.

Inside a rule, the mixin puts the condition on the element of that rule, as the `dark:` and `light:` variants of the Tailwind entry do:

```scss
.logo {
  @include color-mode(dark) {
    background-image: url("logo-dark.svg");
  }
}
```

```css
.logo[data-cx-theme=dark],
.logo:where([data-cx-theme=dark] *):not(:where([data-cx-theme=dark] [data-cx-theme=light] *)) {
  background-image: url("logo-dark.svg");
}
@media (prefers-color-scheme: dark) {
  .logo:not(:where([data-cx-theme=light], [data-cx-theme=light] *)) {
    background-image: url("logo-dark.svg");
  }
}
```

Outside a rule, it writes its content under `[data-cx-theme="dark"]` and, inside the media query, under `:root:where(:not([data-cx-theme="light"]))`. A mode other than `light` and `dark` follows the attribute alone.

A project that calls `color-mode()` gets the attribute selectors in addition to the media query. To keep the output of 0.7.0, set the old default:

```scss
@use "@chassis-ui/css/scss/config" with (
  $color-mode-type: media-query
);
```

`data` and `media-query` write what they wrote before. The framework does not call the mixin, so the compiled CSS of `dist/` is the same.
