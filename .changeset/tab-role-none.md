---
'@chassis-ui/css': patch
---

The tab plugin gives the element around a tab, such as the `<li class="nav-item">` of a `.nav`, `role="none"` instead of `role="presentation"`. The two roles are synonyms in ARIA and screen readers announce the tabs the same way. An element that already has a `role` keeps it, so markup written with `role="presentation"` still works; the examples of the docs use `role="none"`.
