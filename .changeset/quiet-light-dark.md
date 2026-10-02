---
'@chassis-ui/css': patch
---

Rebuild the minified CSS with lightningcss 1.33, which collapses `light-dark()` calls whose two values are the same.
