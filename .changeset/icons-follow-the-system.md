---
'@chassis-ui/css': patch
---

The icons of form controls follow the system preference. On a system that prefers dark, a page with no `data-cx-theme` attribute was dark with the light icons: the caret of a select, the mark of a checkbox and a radio, the knob of a switch and the validation icons kept the fill of the light mode, a dark caret on a dark field. The icons are SVG images with their color written in, which `light-dark()` cannot reach, and only `[data-cx-theme="dark"]` declared the dark ones.

`:root` now takes the dark icons inside `@media (prefers-color-scheme: dark)`, unless it has `data-cx-theme="light"`. Nothing changes for a page that sets the attribute, and nothing is written with `$enable-dark-mode: false`. `chassis.min.css` grows by 5.9 kB, 0.1 kB gzipped.
