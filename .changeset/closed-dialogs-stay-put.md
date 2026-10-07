---
'@chassis-ui/css': patch
---

A closed `.dialog` no longer adds to the area the page scrolls. `.modal` and `.alert` set `display`, so a closed `<dialog>` is laid out and hidden with `visibility`, and the browser positioned it absolutely in the page:

- a closed `.modal.fullscreen` (and `max-md:fullscreen` and the other variants below their breakpoint) made the page scroll sideways, by 9 px in a 375 px viewport and 32 px at 1280 px, because the dialog waits at `scale(1.05)`, the start of its entry transition
- a closed modal with content taller than the viewport made a short page scroll down by the height of that content

A closed dialog is now `position: fixed` (`.dialog:not([open])`), as a closed `.drawer` is. An open dialog is positioned as before.
