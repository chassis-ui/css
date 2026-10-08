---
'@chassis-ui/css': patch
---

`.skeleton-glow` and `.skeleton-wave` honor `prefers-reduced-motion: reduce`. Both animations stop: a skeleton in `.skeleton-glow` rests at `--cx-skeleton-opacity-max`, the opacity of a `.skeleton` with no animation, and `.skeleton-wave` drops its mask, so the placeholder is fully visible with no fixed highlight across it. `$enable-reduced-motion: false` leaves the rule out, as it does for the spinners and the transitions.
