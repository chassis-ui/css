---
'@chassis-ui/css': patch
---

The dividers inside card, popover, toast, `.nav-tabs`, `.nav-underline` and `.table` read `--cx-border-style` instead of a fixed `solid`, as the outline of the component does (issue 39). Until now `--cx-border-style: dashed` on a card dashed its outline and left the header and footer dividers solid.

- Card: the header and footer dividers, and the lines of a `.list.flush` inside it. Popover: the header divider. Toast: the header and footer dividers.
- `.nav-tabs` and `.nav-underline`: the bar, and the side borders of the active tab, which join it.
- `.table`: the cells, the outline of `.bordered` and the rows of `.stacked`, instead of the `solid` of Reboot.
- A line that marks a state keeps its own style: the top of the active tab, the underline of the active link, the active row indicator and `.table-divider`. The arrow of a popover is drawn with borders and stays solid.

With the default `$border-style` every line is solid as before.
