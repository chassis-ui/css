---
'@chassis-ui/css': patch
---

The wrapper of a responsive table, `.table-responsive` and `.max-{breakpoint}:table-responsive`, is positioned (`position: relative`), so it is the containing block of what it scrolls (issue 79). An absolutely positioned descendant, such as the `.visually-hidden` label of an actions column or the hidden header of a `.stacked` table, kept its place at the end of the scrolled row and widened the page on a phone. It now stays in the scroll area.

- A menu in a responsive table with the default `strategy: 'absolute'` opens inside the scroll area too, so one in the last rows is clipped at the bottom edge of the table. Give its toggle `data-cx-strategy="fixed"` or `data-cx-container="body"` to open it above the table.
