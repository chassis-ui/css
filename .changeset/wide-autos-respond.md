---
'@chassis-ui/css': minor
---

`w-100` and `w-auto` have a variant per breakpoint (`md:w-100`, `lg:w-auto`), like the fraction widths: `w-6/12 lg:w-auto` ends a fraction at a breakpoint. The two values moved from the `width` entry of `$utilities` to the responsive `width-fraction` entry; `w-25`, `w-50` and `w-75` stay without variants.

**Breaking:** in `tailwind/merge.js` the width classes are in `w`, the width group of tailwind-merge, and the `width` and `width-fraction` groups are gone. A fraction now resolves against the other widths (`twMerge('w-6/12', 'w-auto')` is `w-auto`). Nothing changes for a project that passes `classGroups` to `extendTailwindMerge` whole.
