---
'@chassis-ui/css': minor
---

`fg-opacity-a11y` sets the opacity of a foreground color to `--cx-opacity-fg-a11y`, the alpha that `@chassis-ui/tokens` 0.7.0 gives the `fg-subtle` color of the `primary`, `secondary`, `neutral`, `danger`, `success`, `warning` and `info` contexts. `:root` declares the custom property, from the new `$opacity-fg-a11y`, a key of `$context-opacities` and of `$fg-opacities`. In `tailwind/merge.js` the class is in the `fg-opacity` group.
