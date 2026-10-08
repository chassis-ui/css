---
'@chassis-ui/css': patch
---

The modules of the Tailwind entry load together in one Sass file: `scss/tailwind/layers`, `theme`, `root`, `reboot`, `components` and `utilities`, the separate modules of the Tailwind guide. In this order they compile to the CSS of the combined `scss/tailwind` entry, and `reboot` and `components` can be left out.

Until now the compile stopped at the second of `layers`, `root`, `reboot` and `components` with `This module was already loaded, so it can't be configured using "with"`: each configured `scss/mixins/banner` with a file name of its own. They forward the banner without one now, as the combined entry does, so a project's stylesheet starts with one banner, and the build passes the file names of `dist/tailwind/`.

`theme.css`, `utilities.css` and `bridge.css` of `dist/tailwind/` start with the banner now, like the other files. The rules of every file of `dist/tailwind/` are the same.
