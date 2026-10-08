---
'@chassis-ui/css': patch
---

A closed `.dialog` and a closed `.drawer` have no transition (`:not([open])`), so they are hidden the moment they close. The exit runs while the element is still open, as `.hiding`, and the plugin closes it when the exit is over; a transition that had not run by then went on with the element closed. In WebKit on a busy page that left a closed modal opaque, or a closed drawer in its open place, for up to several seconds.

The entry and the exit are as they were. A dialog or a drawer that is closed with its own `close()`, without the plugin, no longer fades or slides out: it left the top layer at that moment, and lost its backdrop and its centering with it.
