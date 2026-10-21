---
'@chassis-ui/css': patch
---

The dividers inside card, popover, toast, `.nav-tabs`, `.nav-underline` and `.table` read `--cx-border-style` instead of a fixed `solid`, so a `.border-style-*` class on the component reaches them too (issue 39). Until now `card border-style-dashed` dashed the outline of the card and left the header and footer dividers solid.

- Card: the header and footer dividers, and the lines of a `.list.flush` inside it. Popover: the header divider. Toast: the header and footer dividers.
- `.nav-tabs` and `.nav-underline` set `--cx-border-style` on themselves (`$border-style`), as the components with an outline do, and their bar reads it. The side borders of the active tab, which join the bar, read it too.
- `.table` sets `--cx-border-style` on itself. The cells, the outline of `.bordered` and the rows of `.stacked` read it, instead of the `solid` of Reboot.
- A line that marks a state keeps its own style: the top of the active tab, the underline of the active link, the active row indicator and `.table-divider`. The arrow of a popover is drawn with borders and stays solid.

With no style class, every line is solid as before. A style class on an ancestor still does not reach these components.
