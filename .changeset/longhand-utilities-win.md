---
'@chassis-ui/css': minor
---

**Breaking:** In `dist/css/chassis.css` a longhand utility wins over a shorthand utility on the same element, as it does in the Tailwind entry and as `mt-*` already did over `m-*`. Two utility maps had the shorthands last:

- The `place-*` classes came after `justify-content-*`, `align-items-*`, `align-content-*` and `align-self-*`, so `place-items-center align-items-baseline` aligned the items to the center. The longhand class now wins: `baseline`.
- The negative margins came after every positive margin, so `-m-2xl mb-0` gave a bottom margin of `-2xl`. Each negative margin now follows its positive one, shorthands first, and the longhand wins: `mb-0` gives `0`.

Only an element with both classes changes. The Tailwind parity test compares every such pair of utilities in both builds since issue 44.
