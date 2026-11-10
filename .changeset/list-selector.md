---
'@chassis-ui/css': patch
---

The tab and scrollspy plugins find a list by its `.list` class. Both looked for `.list-group`, a class Chassis does not have, so a `.list` used as tabs was found only with `role="tablist"` in the markup, and scrollspy did not activate the item before a nested `.list`. Markup that still carries `.list-group` is no longer matched by that class: a tab list with `role="tablist"` keeps working, anything else needs `.list`.
