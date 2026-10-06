---
'@chassis-ui/css': patch
---

Rebuild the JavaScript with rolldown 1.2.12. The modules run the same code: a nested `if` now has its braces, and the last `case` of a `switch` no longer ends with a `break`. The minified builds do not change.
