---
'@chassis-ui/css': patch
---

Fixes of declarations and selectors that wrote wrong CSS in the default build:

- **Datepicker**: today has the weight of `$datepicker-font-today` (the rule read `--cx-day-today-font-weight`, which nothing set), and the months and the years have the font size of the days (`--cx-day-font-size`, likewise). A button of the calendar under the pointer has the color of `$datepicker-fg-hover`: the rules read `--cx-day-hover-fg-color`, which nothing set either, and `--cx-datepicker-day-hover-fg-color` now sets it.
- **Avatar**: the badge of an avatar has its border. The shorthand read `--cx-badge-border-style`, which nothing set, so the browser dropped the declaration. The style is `--cx-avatar-badge-border-style`, the root `--cx-border-style` by default.
- **Card**: `.card-title` has the color of `--cx-card-title-fg-color` (`$card-title-color`); it read a name that the card does not set. `--cx-card-height` sets the height; the declaration read `--cx-card-heading`.
- **Button group**: the first button of a `.button-group` is no longer moved by the width of its border, and a vertical group overlaps the borders by `--cx-border-width` of its buttons, as a horizontal one does.
- **Validation**:
  - a valid or an invalid `.form-input` and `.form-floating` of an `.input-group` are above their neighbors (`z-index` 3 and 4), so the colored border is whole. The two selectors were written as one, which matched nothing.
  - in a form with `data-cx-validate`, the floating label of a field and a `.form-check` take the color of the state from `:user-valid` and `:user-invalid`. The selectors had the `[data-cx-validate]` ancestor inside `:has()`, where it matched nothing; the `.is-valid` and `.is-invalid` classes did work.
- **Range**: Firefox draws the focus ring on the thumb (`::-moz-range-thumb`; the rule was written for `::-moz-slider-thumb`, which is no pseudo-element).
- **Checkbox, radio, switch**: a disabled legacy input reads `--cx-form-disabled-bg-regular`, the property the forms declare. The knob of a modern switch stops its transition under `prefers-reduced-motion`. A checked input takes its background and its border from `--cx-default-cue-main`, and so follows the color mode; the value of the light mode was written in.
- **Progress**: the bar takes its colors from `--cx-primary-base-color` and `--cx-primary-contrast-color`, and so follows the color mode; the values of the light mode were written in.
- **Password strength**: `.strength-text` falls back to `--cx-fg-subtle`; it read `--cx-fg-3`, which does not exist.
- **Link opacity**: `.link-opacity-subtle` and `.link-opacity-slight`, in the Tailwind entry too, read `--cx-opacity-fg-subtle` and `--cx-opacity-fg-slight`. They read `--cx-opacity-link-*`, which the root does not declare, so the classes set no opacity.
- **Outline context**: `--cx-bg-highlight` is the highlight background of the context, the pair of its `--cx-fg-highlight`, as in the smooth variant. It was the inverse background, under the highlight foreground: the active row of a table in an outline context, for one.
- **Accordion**: the open state styles the summary of the open item only, not the summaries of an accordion nested in it.
- **Chip**: the avatar of a chip has its negative margin at the start of the chip in a right-to-left page too (logical margins).
- **Help text**: `.form-help` after a `.check-input` no longer declares a `margin-inline-start` that read `--cx-input-size`, which nothing set. The help is where it was: `.form-check` indents it to the label, and in a `.form-field` it spans both columns.

In Sass:

- `$button-large-border-radius`, `$chip-large-border-radius` and `$opacity-cue-slight` read their own tokens (`$cx-border-radius-button-large`, `$cx-border-radius-chip-large`, `$cx-opacity-context-cue-slight`) and no longer the ones of the medium size and of the icons. The values of `@chassis-ui/tokens` are the same, so the compiled CSS is too.
- `color-contrast()`, `contrast-ratio()` and `luminance()` take a color of any color space and a translucent foreground. A channel that is no integer stopped the compile with `$n: 13.81 is not an int`, which `color-contrast(oklch(0.6 0.1 200))` and `contrast-ratio(#fff, rgba(0, 0, 0, .5))` did.
- `$enable-exclude-strokes` is read with `list.index()` in the card and the list, in place of the global `index()` that Sass deprecates.
