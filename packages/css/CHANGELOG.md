# Changelog

## 0.7.2

### Patch Changes

- 6239ca6: A closed `.dialog` and a closed `.drawer` have no transition (`:not([open])`), so they are hidden the moment they close. The exit runs while the element is still open, as `.hiding`, and the plugin closes it when the exit is over; a transition that had not run by then went on with the element closed. In WebKit on a busy page that left a closed modal opaque, or a closed drawer in its open place, for up to several seconds.
  
  The entry and the exit are as they were. A dialog or a drawer that is closed with its own `close()`, without the plugin, no longer fades or slides out: it left the top layer at that moment, and lost its backdrop and its centering with it.
- ae03539: The Tailwind entry has an opt-in safelist for class names built at runtime: `@chassis-ui/css/tailwind/safelist.css`, or `@use "@chassis-ui/css/scss/tailwind/safelist"` in a Sass build, loaded after the entry.
  
  Tailwind generates a class only where its scanner finds the whole name in a source file, so a name that JavaScript joins from parts (`` `col-span-${span}` ``, the responsive props of `@chassis-ui/react`) had no rule, with no warning. The safelist is a list of `@source inline()` rules for the responsive layout classes: the placement classes of `.grid`, and `grid-cols-*`, `grid-rows-*`, `grid-flow-*`, `gap-*`, `row-gap-*`, `column-gap-*`, the flex directions and wraps, `flex-fill`, `justify-content-*`, `align-items-*`, `align-content-*` and the `w-*` fractions. Each is listed without a prefix, with the `sm:`–`2xl:` prefixes and with the `@sm:`–`@2xl:` prefixes. Compiled from Sass it follows `$breakpoints`, `$grid-columns`, `$grid-rows`, `$utilities-overrides`, `$enable-grid-system` and `$enable-container-queries`, and `$safelist-utilities-extra` adds the keys of more utilities to the ones of `$safelist-utilities`.
  
  The default entry is unchanged and still generates a class only where a project writes it, as every utility outside the list is. With the default settings the safelist adds about 80 KB to the minified CSS of a project (9 KB gzipped).

## 0.7.1

### Patch Changes

- 78a8777: No computed color holds the `none` keyword, so axe can measure contrast. White, black and the other colors with no chroma were written with a missing hue, `oklch(100% 0 none)`, which is also the computed value of every element that uses them. axe-core 4.13 cannot parse it: on a page with a white background its `color-contrast` rule stopped with `error-occurred` and reported `incomplete`, so a light page passed the audit without being measured.
  
  - `to-color()` writes a color with no chroma as `oklab()`: `--cx-white` is `oklab(100% 0 0)`, and so are the 172 tokens of `:root` that had `none` in one of their modes. A hue of `0` would not do, since `color-mix(in oklch, …)` interpolates towards it. A browser that converts `oklab(100% 0 0)` to oklch finds no chroma and takes the hue of the other color, as it did with `none`.
  - `$solid-bg-even`, `$solid-bg-evident` and the backdrop of `.drawer` mix `in oklab`. In oklch they computed to `oklch(L 0 none)` for a context with no chroma, whatever the tokens say. With black or `transparent` as the other color, the two spaces give the same color.
  
  Nothing changes on screen. A project that interpolates one of these tokens `in hsl` or `in hwb` (the framework does not) gets a slightly different color from the mix: there a missing hue and a color with no chroma are not the same thing to the browsers.
- 2597407: A breakpoint mixin or function stops the compile on a name that is not a key of `$breakpoints`: ``breakpoint `lgg` not found in `xs, sm, md, lg, xl, 2xl` ``. Until now the lookup gave no width, and `media-breakpoint-up()`, `media-breakpoint-down()` and the other query mixins wrote their content with no query around it, for every width.
  
  The compile also stops when a name and the key of `$breakpoints` differ in Sass type. An unquoted `2xl` is a number and a quoted `"2xl"` a string, two keys of a map: a `$breakpoints` with `"2xl"` lost the gutter, the page margin, the column count and the container width of that breakpoint. Write the name without quotes, in the map and in the mixins. `is-breakpoint($name, $breakpoints)` is the check the framework uses, for a stylesheet of your own.
  
  A build that stops after the update has a name to correct:
  
  - a misspelled name in a mixin (`media-breakpoint-up(xxl)`),
  - a quoted `"2xl"` in `$breakpoints` or in a call,
  - a `$breakpoints` without `sm`, which the dialog, the modal, the alert, the menu and the card name in their own rules, or without `lg` when `$font-size-root-lg` is set.
  
  `.container` no longer takes the max-widths of breakpoints that a project removed from `$breakpoints`. They were written with no query, so every container had the max-width of the largest one at every width; `$container-max-widths` warns about such a key and ignores it, as the grid maps do.
  
  The compiled CSS of `dist/` is the same. The source maps of `dist/css/` follow the moved lines.
- 769206e: A closed `.dialog` no longer adds to the area the page scrolls. `.modal` and `.alert` set `display`, so a closed `<dialog>` is laid out and hidden with `visibility`, and the browser positioned it absolutely in the page:
  
  - a closed `.modal.fullscreen` (and `max-md:fullscreen` and the other variants below their breakpoint) made the page scroll sideways, by 9 px in a 375 px viewport and 32 px at 1280 px, because the dialog waits at `scale(1.05)`, the start of its entry transition
  - a closed modal with content taller than the viewport made a short page scroll down by the height of that content
  
  A closed dialog is now `position: fixed` (`.dialog:not([open])`), as a closed `.drawer` is. An open dialog is positioned as before.
- 58e938c: **Breaking:** the styles of the `color-mode()` mixin follow the colors of the framework: the nearest `data-cx-theme` attribute, and the system preference where no attribute is set. `$color-mode-type` has a new value for this, `auto`, and it is the default. Until now the default was `media-query`, which ignored the attribute, so the dark styles of a project did not switch with a color mode toggle.
  
  Inside a rule, the mixin puts the condition on the element of that rule, as the `dark:` and `light:` variants of the Tailwind entry do:
  
  ```scss
  .logo {
    @include color-mode(dark) {
      background-image: url("logo-dark.svg");
    }
  }
  ```
  
  ```css
  .logo[data-cx-theme=dark],
  .logo:where([data-cx-theme=dark] *):not(:where([data-cx-theme=dark] [data-cx-theme=light] *)) {
    background-image: url("logo-dark.svg");
  }
  @media (prefers-color-scheme: dark) {
    .logo:not(:where([data-cx-theme=light], [data-cx-theme=light] *)) {
      background-image: url("logo-dark.svg");
    }
  }
  ```
  
  Outside a rule, it writes its content under `[data-cx-theme="dark"]` and, inside the media query, under `:root:where(:not([data-cx-theme="light"]))`. A mode other than `light` and `dark` follows the attribute alone.
  
  A project that calls `color-mode()` gets the attribute selectors in addition to the media query. To keep the output of 0.7.0, set the old default:
  
  ```scss
  @use "@chassis-ui/css/scss/config" with (
    $color-mode-type: media-query
  );
  ```
  
  `data` and `media-query` write what they wrote before. The framework does not call the mixin, so the compiled CSS of `dist/` is the same.
- c42477e: **Breaking:** the custom properties that set the font of a card title, a card subtitle, a drawer title and the datepicker header had the name of the element twice. They are named as the ones of `.card.lg` and of the modal are:
  
  | Before                                                                          | Now                                                           |
  | ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
  | `--cx-card-title-title-font-*`, `--cx-card-title-title-line-height`             | `--cx-card-title-font-*`, `--cx-card-title-line-height`       |
  | `--cx-card-subtitle-subtitle-font-*`, `--cx-card-subtitle-subtitle-line-height` | `--cx-card-subtitle-font-*`, `--cx-card-subtitle-line-height` |
  | `--cx-drawer-title-title-font-*`, `--cx-drawer-title-title-line-height`         | `--cx-drawer-title-font-*`, `--cx-drawer-title-line-height`   |
  | `--cx-datepicker-header-header-font-size`, `-font-weight`                       | `--cx-datepicker-header-font-size`, `-font-weight`            |
  
  A project that set one of the old names sets the new one. `font-*` is `font-family`, `font-size` and `font-weight`.
- 58e938c: The icons of form controls follow the system preference. On a system that prefers dark, a page with no `data-cx-theme` attribute was dark with the light icons: the caret of a select, the mark of a checkbox and a radio, the knob of a switch and the validation icons kept the fill of the light mode, a dark caret on a dark field. The icons are SVG images with their color written in, which `light-dark()` cannot reach, and only `[data-cx-theme="dark"]` declared the dark ones.
  
  `:root` now takes the dark icons inside `@media (prefers-color-scheme: dark)`, unless it has `data-cx-theme="light"`. Nothing changes for a page that sets the attribute, and nothing is written with `$enable-dark-mode: false`. `chassis.min.css` grows by 5.9 kB, 0.1 kB gzipped.
- 05a3140: One `@use "@chassis-ui/css/scss/config" with (…)` configures every variable of the framework: the feature flags, the defaults, the token variables (`$primary`, `$danger`, `$space-medium`) and the vendor tokens. `@use "@chassis-ui/css/scss/config/defaults" with (…)` takes the same variables.
  
  Until now the compile stopped with `This module was already loaded, so it can't be configured using "with"` for a token variable in either rule, and for an `$enable-*` flag in `config/defaults`: `scss/config/_defaults.scss` loaded those modules before it forwarded them. A token variable had to be set with `@use "@chassis-ui/css/scss/tokens" with (…)`, placed before the `config` rule; that still works.
  
  The compiled CSS is the same. The source maps of `dist/css/` follow the moved lines.
- c42477e: Fixes of declarations and selectors that wrote wrong CSS in the default build:
  
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
- 09eb7a9: `.skeleton-glow` and `.skeleton-wave` honor `prefers-reduced-motion: reduce`. Both animations stop: a skeleton in `.skeleton-glow` rests at `--cx-skeleton-opacity-max`, the opacity of a `.skeleton` with no animation, and `.skeleton-wave` drops its mask, so the placeholder is fully visible with no fixed highlight across it. `$enable-reduced-motion: false` leaves the rule out, as it does for the spinners and the transitions.
- d1162a8: The modules of the Tailwind entry load together in one Sass file: `scss/tailwind/layers`, `theme`, `root`, `reboot`, `components` and `utilities`, the separate modules of the Tailwind guide. In this order they compile to the CSS of the combined `scss/tailwind` entry, and `reboot` and `components` can be left out.
  
  Until now the compile stopped at the second of `layers`, `root`, `reboot` and `components` with `This module was already loaded, so it can't be configured using "with"`: each configured `scss/mixins/banner` with a file name of its own. They forward the banner without one now, as the combined entry does, so a project's stylesheet starts with one banner, and the build passes the file names of `dist/tailwind/`.
  
  `theme.css`, `utilities.css` and `bridge.css` of `dist/tailwind/` start with the banner now, like the other files. The rules of every file of `dist/tailwind/` are the same.
- 63f1526: `$utilities-overrides` changes the default utilities of a build that loads the complete framework. It is a map of `scss/utilities`, empty by default and merged over `$utilities`:
  
  ```scss
  @use "@chassis-ui/css/scss/utilities" with (
    $utilities-overrides: (
      "float": null,
      "border": (responsive: true),
      "width": (values: (10: 10%, 25: null)),
      "cursor": (property: cursor, class: cursor, values: auto pointer grab)
    )
  );
  @use "@chassis-ui/css/scss/chassis";
  ```
  
  - `null` removes a utility
  - a map under the name of a utility is merged into its definition, option by option, so `(responsive: true)` is a complete override. A changed utility keeps its place in the `utilities` layer
  - `values` is merged with the default values when the override gives a map: a new key adds a class, the key of a default value changes it, and `null` removes the class. A key is matched by the class it names, so `50` and `"50"` are the same key. A list replaces the values
  - a map under a new name adds a utility after the default ones. It needs `property` and `values`, and the compile stops without them, which also catches a misspelled name
  - the rule goes before `@use "@chassis-ui/css/scss/chassis"` and after a `@use "@chassis-ui/css/scss/config" with (…)`; in another place Sass stops with an error
  - the overrides are merged over a configured `$utilities` map too, and reach `scss/tailwind` compiled with Sass. The prebuilt `dist/tailwind/` files and `tailwind/merge.js` are built from the default map
  
  `utility-values-map()` returns the `values` of a utility as the map the generators read: a list with each value under its own name, a single value under the `null` key. `map-get-multiple()` takes a third argument, the keys the map may lack without a warning; the grid bundle passes it the names of the overrides, so a removed utility of its list is left out in silence.
  
  Nothing changes for a build without the variable: `dist/css/` and `dist/tailwind/` are the same files.

## 0.7.0

### Minor Changes

- 1a54d5d: Container-query variants of the grid classes and the layout utilities, and a grid whose gutter follows its container.
  
  - **`@md:` variants.** Every placement class of `.grid` has a variant per container width under the `@` prefix, Tailwind's container variant: `.@md:col-span-4`, `.@lg:col-start-3`, `.@md:col-end-13`, `.@md:col-auto`, `.@md:row-span-2`. It applies when the nearest query container (`.contains-inline`, `set-container()`, a `.navbar`) is at least as wide as the breakpoint, where `.md:col-span-4` follows the viewport. The prefixes are `@sm:` to `@2xl:`; an unprefixed class is the layout below `sm` and of an element with no query container above it. Where a breakpoint class and a container class both apply to an element, the container class wins
  - **The layout utilities have the same variants:** `d-*`, `flex-*`, `order-*`, `justify-content-*`, `align-items-*`, `align-content-*`, `align-self-*`, `gap-*`, `row-gap-*`, `column-gap-*`, `place-items-*`, `place-content-*`, `place-self-*`, `justify-items-*`, `justify-self-*`, `grid-cols-*`, `grid-rows-*`, `grid-flow-*`, `auto-cols-*`, `auto-rows-*`, `space-x-*`, `space-y-*`, `divide-x`, `divide-y`, `w-{n}/12`, `w-100`, `w-auto`, `text-start` / `text-center` / `text-end`, `float-*` and `object-fit-*` (`.@md:d-flex`, `.@md:flex-row`, `.@md:w-6/12`)
  - **`.grid.contained` and `.grid-fill.contained`** take `--cx-grid-gutter` and `--cx-grid-columns` from the breakpoint of the query container, not of the viewport: a grid in a narrow column of a wide page has the gutter of a narrow page. `--cx-grid-gap`, a gap utility and `grid-cols-*` still override them, and without a query container above it the grid keeps the values of the viewport, as a plain `.grid` does: the first breakpoint's values are declared in `@container (width >= 0)`, which matches any container and nothing else. Plain `.grid` is unchanged
  - **Utilities API:** a `container` key, boolean. `container: true` generates the `@` variants of a utility, after its responsive ones. The utilities above set it; margin, padding, font size and icon size set `container: false`, and a `map.merge` of `$utilities` turns it on for them
  - **Sass:** the option `$enable-container-queries` (`true` by default) governs the `@` variants and the modifier. New: `container-breakpoint-prefix()`, `make-cssgrid-container()` and `grid-container-vars()`
  - **Tailwind entry:** nothing new to import. `@md:col-span-4` and `@md:d-flex` are Tailwind's own container variants there, at the Chassis breakpoints, for every utility; `.grid.contained` is plain CSS of the entry
  - `chassis.min.css` is 693 KB, from 628 KB in 0.6.0 (84.5 KB gzipped, from 78.6 KB): 20 KB less for the flexbox grid, 85 KB more for the new grid classes at six breakpoints and for five container widths of 63 placement rules and 217 utility rules. `$enable-container-queries: false` leaves the container widths out. The grid bundle is 206 KB, from 156 KB (21.9 KB gzipped, from 16.9 KB), with the utilities it gained
- 789615b: Fixes from a review of the grid system.
  
  - **`.grid-fill` wraps without a minimum set.** Its columns are at least `12rem` wide (`$grid-min`, the fallback of `--cx-grid-min`), where the minimum of `0` put every child in one row, whatever their number. `--cx-grid-min` still sets the width of one grid. In a grid narrower than the minimum, the one column that fits takes the width of the grid instead of overflowing it
  - **`place-items-*` has a variant per breakpoint and per container width** (`.md:place-items-center`, `.@md:place-items-center`), which its documentation described and the build did not generate
  - **The grid bundle** (`chassis-grid.css`) has `.contains-inline`, without which its `.contained` modifier and `@md:` classes had no query container to read, and the fraction widths (`.w-6/12`) with their variants. Its utility list named a `justify-items` key that does not exist; `map-get-multiple()` now warns about a key the map lacks
  - **`grid-root-vars()` and `grid-container-vars()` check their maps.** A map with no value for the first breakpoint (`$grid-gutters: (md: 1.5rem)`) stops the compile, where it left `--cx-grid-gutter` undefined below `md`; a key that is no breakpoint is reported with a warning and ignored, as before
  - **`tailwind/merge.js` exports `overrideClassGroups`.** tailwind-merge lists `grid`, `table`, `inline`, `list-item`, `collapse` and `static` in its display, visibility and position groups, and in the Tailwind entry they are Chassis classes, so `twMerge('grid gap-md', 'd-flex')` dropped `.grid`. Pass `override: { classGroups: overrideClassGroups }` beside `extend: { classGroups }` to `extendTailwindMerge`, and the Chassis class stays
  - `Navbar`: the rule of a container inside a `.navbar` listed `.sm\:container` to `.2xl\:container`, classes that do not exist (the variants are `.container.sm`, which `.navbar > .container` matches). The selectors are removed
  - **Tailwind entry:** with those selectors gone, `sm:container` to `2xl:container` are no longer names of Chassis classes, and the entry no longer excludes them from Tailwind: `lg:container` is Tailwind's own `container` utility under its `lg:` variant, where it generated nothing. `container` alone stays the Chassis class
- 588e601: The rest of the grid vocabulary, under Tailwind's names and with its declarations, each with a variant per breakpoint and per container width.
  
  - **End lines:** `.col-end-{1…13}` and `.col-end-auto` (`grid-column-end`), `.row-end-{1…7}` and `.row-end-auto`. `.col-span-3 .col-end-13` places three tracks against the end edge of the grid. They are generated one line past `$grid-columns` and `$grid-rows`
  - **`.col-auto` and `.row-auto`** (`grid-column: auto`, `grid-row: auto`) take a span and a line off an item at a breakpoint: `.col-span-full .md:col-auto`. `.col-auto` was a class of the flexbox grid until this release; markup that still carries it gets an item of one track
  - **Tracks:** `.grid-cols-none`, `.grid-rows-none` and `.grid-rows-subgrid`, and `.auto-cols-{auto,min,max,fr}` and `.auto-rows-{auto,min,max,fr}` for the size of the tracks a grid adds beyond its template (`grid-auto-columns`, `grid-auto-rows`)
  - **Alignment:** `.justify-items-{start,end,center,stretch}`, `.justify-self-{auto,start,end,center,stretch}`, `.place-self-{auto,start,end,center,stretch}` and `.place-content-{start,end,center,between,around,evenly,stretch}`
  - **Sass:** `$grid-min`, the minimum column width of `.grid-fill` (12rem) and the fallback of `--cx-grid-min`, beside `$grid-columns` and `$grid-rows`; `@chassis-ui/tokens` has no token for it yet
  - **Tailwind entry:** nothing changes for a project that used Tailwind's utilities of these names. The end lines and the `auto` resets are Tailwind's own; the track and alignment utilities are Chassis utilities equal to Tailwind's, in the groups of tailwind-merge of the same names (`grid-flow`, `auto-cols`, `auto-rows`, `justify-items`, `justify-self`, `place-content`, `place-self`)
  - The grid bundle (`chassis-grid.css`) has all of them
- 69f7c98: **Breaking:** the page margins and the column counts of the grid come from `@chassis-ui/tokens`, and the compiled CSS has the values of tokens 0.7.0: wider page margins, new gutters, and lighter text colors in the dark theme.
  
  - `$margin-xsmall` to `$margin-2xlarge` and `$columns-xsmall` to `$columns-2xlarge` of `scss/tokens/_grid.scss` read `$cx-grid-margin-*` and `$cx-grid-columns-*`, where they held `.75rem` and `12`. A project that compiles the Sass needs `@chassis-ui/tokens` 0.7.0 or later, and a token source of its own (`_chassis-tokens.scss`) needs the twelve variables: without them the compile stops at an undefined variable
  - The padding of `.container` (`--cx-container-padding`) is 1rem, and 1.5rem from `md`, where it was 0.75rem at every breakpoint. Set `$container-paddings`, or the `$margin-*` variables, to keep the old padding
  - The gap of `.grid` and `.grid-fill` (`--cx-grid-gutter`) is 1rem, and 1.5rem from `md`, where it was 0.5rem, 1rem, 1.5rem, 2rem, 2.5rem and 3rem from `xs` to `2xl`. Set `$grid-gutters`, or the `$gutter-*` variables, to keep the old gaps
  - The column counts stay 12 at every breakpoint
  - `--cx-opacity-fg-subtle` is 0.6 where it was 0.5, and `--cx-opacity-icon-subtle` 0.5 where it was 0.4, with every `fg-subtle` and `icon-subtle` color, the `spinner-opacity-subtle` and `text-decoration-opacity-subtle` utilities and the idle icon of the switch. The `fg-subtle` of the `primary`, `secondary`, `neutral`, `danger`, `success`, `warning` and `info` contexts has an alpha of 0.7
  - In the dark theme, `fg-main`, `fg-highlight`, `link-main`, `link-hover` and `link-active` of the same seven contexts are lighter shades of their palette, and so are the colors made from them (`fg-subtle`, `fg-slight`, `border-subtle`, `icon-subtle`, the valid and invalid icons of the forms)
- 1a54d5d: `grid-rows-{1…6}`: the number of explicit rows of a grid as a class, with the declaration of Tailwind's utility of the same name (`grid-template-rows: repeat(n, minmax(0, 1fr))`).
  
  - `.grid-rows-2` sets the rows of one grid, and takes the place of `--cx-grid-rows`, which this release removes. The classes are generated up to `$grid-rows` and have a variant per breakpoint (`.md:grid-rows-3`) and per container width (`.@md:grid-rows-3`), as `grid-cols-*` has. The grid bundle has them too
  - **Tailwind entry:** `grid-rows-{1…6}` are Chassis utilities equal to Tailwind's own, so nothing changes for a project that used Tailwind's; `tailwind/merge.js` has a `grid-row-counts` group
  - 4 KB of `chassis.min.css` (0.3 KB gzipped), counted in the sizes of the container-query changeset
- 1cbbc47: **Breaking:** the flexbox grid, deprecated in 0.6.0, is removed. `.grid` is the only grid of Chassis.
  
  - **Classes removed:** `.row`, `.col`, `.col-auto`, `.col-{1…12}`, `.offset-{0…11}`, `.row-cols-auto`, `.row-cols-{1…6}`, `.g-{size}`, `.gx-{size}` and `.gy-{size}`, with their breakpoint variants. Migrate `.row` to `.grid`, `.col-4` to `.col-span-4`, `.col-12` (or a column with no class below a breakpoint) to `.col-span-full`, `.offset-2` to `.col-start-3`, `.md:offset-0` to `.md:col-start-auto`, `.row-cols-3` to `.grid-cols-3`, `.g-md` to `.gap-md`, `.gx-*` and `.gy-*` to `.column-gap-*` and `.row-gap-*`, `.col` to `.grid-fill` on the parent or `.d-flex` with `.flex-fill`, and `.col-auto` to `.d-flex` on the parent. Outside a row, `.col-{n}` used as a width becomes `.w-{n}/12`, `.col` becomes `.flex-fill` and `.col-auto` becomes `.w-auto`. An item of a `.grid` with no span class is one track wide, not full width
  - **`.grid` no longer declares a row.** It set one explicit row of `minmax(0, 1fr)` (`--cx-grid-rows`, 1 by default), which took all the free space of a grid with a set height and left the rows after it at their content height, or at nothing when the content was taller than the grid. The rows are now implicit, as tall as their content. `--cx-grid-rows` is gone: use `.grid-rows-{n}` or a `grid-template-rows` declaration. The internal `--cx-columns`, `--cx-rows` and `--cx-gap` that `.grid` set on itself, and its descendants inherited, are gone too
  - **`.col-start-13` and `.row-start-7` are removed,** with their breakpoint variants: an item that starts on the last line of the grid lies outside it, in an implicit track. The start classes go from `1` to `$grid-columns` and `$grid-rows`
  - **`$enable-cssgrid` is `$enable-grid-system`,** and governs the whole grid system: with `false` the grid utilities (`grid-cols-*`, `grid-rows-*`, `grid-flow-*`, `auto-cols-*`, `auto-rows-*`) and the grid rules of the card are left out too, where the old option removed `.grid` and its placement classes only. That is 33 KB of `chassis.min.css` (3.6 KB gzipped). The containers, the gap utilities, the fraction widths and the `:root` grid variables stay. A `@use … with ($enable-cssgrid: …)` no longer compiles
  - **`grid-auto-flow-*` is `grid-flow-*`,** Tailwind's name and values: `.grid-auto-flow-row`, `.grid-auto-flow-column` and `.grid-auto-flow-dense` become `.grid-flow-row`, `.grid-flow-col` and `.grid-flow-dense`, with `.grid-flow-row-dense` and `.grid-flow-col-dense` beside them. The entry of `$utilities` is `"grid-flow"`, and the group of `tailwind/merge.js` with it
  - **`.order-first` is `order: -9999` and `.order-last` `order: 9999`,** where they were -1 and 6: an `order` above 5, set inline or by an added class, no longer overtakes `.order-last`. In the Tailwind entry the two are equal to Tailwind's and lose their `!important`
  - **`.grid-cols-subgrid` is a utility,** the `subgrid` value of the column counts, in the `utilities` layer with `.grid-cols-{n}` where it was in `layout`, and with their variants (`.md:grid-cols-subgrid`). In the Tailwind entry it is no longer an excluded class but a Chassis utility equal to Tailwind's
  - **The old names of the placement classes are removed:** `.g-col-{n}` is `.col-span-{n}`, `.g-start-{n}` is `.col-start-{n}`, and `.grid-cols-fill` is `.col-span-full`
  - **Sass removed:** the mixins `make-row()`, `make-col-ready()`, `make-col()`, `make-col-auto()`, `make-col-offset()`, `row-cols()` and `make-grid-columns()`; the variables `$grid-gutter-x`, `$grid-gutter-y`, `$grid-row-columns`, `$gutters` and `$container-padding-x`; the option `$enable-grid-classes`; the `$gutter` parameter of `make-container()`. A `@use … with (…)` that configures one of them no longer compiles. Set `$grid-gutters` for the gap of `.grid` and `$container-paddings` for the padding of `.container`, both per breakpoint
  - **`.container` pads with `--cx-container-padding` directly.** It no longer sets `--cx-gutter-x` and `--cx-gutter-y`, and a `--cx-gutter-x` set on a container no longer changes its padding: set `--cx-container-padding` to the padding itself, half of the old value
  - `--cx-card-group-margin`, the space between the stacked cards of a `.card-group`, defaults to half of `--cx-grid-gutter` (0.5rem, and 0.75rem from `md`) where it was 0.75rem. `$toast-spacing` keeps its 1.5rem, now from `$space-xlarge`
  - `Card`: the rules of a `.card-body` that holds only an image match the items of a `.grid` (`.grid > [class*="col-span-"]`), no longer the columns of a `.row`
  - **Tailwind entry:** the flexbox grid utilities, the `g-col-*` and `g-start-*` aliases and the `layout` sublayer of `utilities` that held them are gone, so the entry emits no grid `@utility` at all. `col-{n}` and `col-auto` are Tailwind core's own utilities again (`col-6` is `grid-column: 6`): markup that still carries a flexbox grid class compiles without an error and renders something else. `scss/tailwind/mixins/_grid.scss` is removed, with `make-grid-columns-tailwind()`, `make-cssgrid-tailwind()` and `generate-tailwind-grid-merge-manifest()`
  - **`tailwind/merge.js`:** the groups `grid-col`, `grid-row-cols`, `grid-offset`, `grid-gutter`, `grid-gutter-x` and `grid-gutter-y` are gone, and so are `col-start-end` and `col-start`, which held only the aliases. tailwind-merge resolves `col-span-*` and `col-start-*` by itself
  - The grid bundle (`chassis-grid.css`) has `flex-fill` and its breakpoint variants, which its utility list named by a key that did not exist. Its other flex, alignment and spacing utilities stay
  - The removal takes 20 KB off `chassis.min.css` (2.6 KB gzipped) and off the grid bundle. The sizes of the release are in the container-query entry
- c071ddb: `fg-opacity-a11y` sets the opacity of a foreground color to `--cx-opacity-fg-a11y`, the alpha that `@chassis-ui/tokens` 0.7.0 gives the `fg-subtle` color of the `primary`, `secondary`, `neutral`, `danger`, `success`, `warning` and `info` contexts. `:root` declares the custom property, from the new `$opacity-fg-a11y`, a key of `$context-opacities` and of `$fg-opacities`. In `tailwind/merge.js` the class is in the `fg-opacity` group.
- c071ddb: The subtle text of a context variant has the alpha of its context. `%solid-context`, `%smooth-context` and `%outline-context` computed `--cx-fg-subtle` with `--cx-opacity-fg-subtle` in every context, so a `.badge.smooth` or a `.context.outline` in a colored context had fainter subtle text than the `fg-subtle` token of that context, whose alpha `@chassis-ui/tokens` 0.7.0 raised.
  
  The `context()` mixin now sets `--cx-context-opacity-fg-subtle`, which the variants read: `--cx-opacity-fg-a11y` in the contexts of the new `$a11y-contexts` (`primary`, `secondary`, `neutral`, `danger`, `success`, `warning` and `info`), and `--cx-opacity-fg-subtle` in the others, which render as before.
- 3067e9e: `w-100` and `w-auto` have a variant per breakpoint (`md:w-100`, `lg:w-auto`), like the fraction widths: `w-6/12 lg:w-auto` ends a fraction at a breakpoint. The two values moved from the `width` entry of `$utilities` to the responsive `width-fraction` entry; `w-25`, `w-50` and `w-75` stay without variants.
  
  **Breaking:** in `tailwind/merge.js` the width classes are in `w`, the width group of tailwind-merge, and the `width` and `width-fraction` groups are gone. A fraction now resolves against the other widths (`twMerge('w-6/12', 'w-auto')` is `w-auto`). Nothing changes for a project that passes `classGroups` to `extendTailwindMerge` whole.

### Patch Changes

- 43764e3: The grid bundle (`chassis-grid.css`) declares the order of the cascade layers, as the reboot and utilities bundles do. Without the statement its layers were ordered as they appeared, so a bundle loaded after it put `reboot` above `layout` and `utilities`. The statement moved from `scss/_root.scss` to `scss/_layer-order.scss`, which `_root.scss` loads.
  
  The breakpoint and grid custom properties moved to the end of the `:root` rule, which their media query no longer splits in two.

## 0.6.0

### Added

- **`@chassis-ui/css/tailwind/merge.js`:** the grid classes are now part of the generated tailwind-merge `classGroups` config, so `twMerge('col-6', 'col-4')`, `twMerge('g-md', 'g-lg')`, `twMerge('offset-2', 'offset-4')`, and the `row-cols-*`, `gx-*`, `gy-*`, `g-col-*`, `g-start-*` equivalents resolve to the last class
- `Nav`: `.sm` and `.lg` size modifiers on `.nav`, for the base nav and the tabs, segments, and underline variants. They scale the link padding, gap, icon size, caret size, and font from Chassis Tokens; segments also scale the bar padding and corner radius, and underline scales the gap between links. Without a modifier the medium size applies
- **`@chassis-ui/css/postcss`:** the preset now has type declarations, so a TypeScript PostCSS configuration gets `chassisPrefix()`, `chassisPostcss()`, `mergeLayerBlocks`, and the `ChassisPrefixOptions` type checked
- `package.json` is now an export (`@chassis-ui/css/package.json`), for the tools that read a package's version or fields
- `Nav`: `.nav-link` is now a centered flex row with a gap, so an icon placed inside the link aligns with the label and scales with the nav size. New `--cx-nav-link-gap`, `--cx-nav-link-icon-size`, `--cx-nav-link-caret-size`, and `--cx-nav-link-caret-spacing` custom properties, and `--cx-nav-segments-idle-fg-color`/`--cx-nav-segments-idle-bg-color` for the idle segment links

### Changed

- **Breaking:** **JavaScript entry:** `import { Tooltip } from '@chassis-ui/css'` now resolves to compiled JavaScript (`js/dist/index.js`) with type declarations (`js/dist/index.d.ts`), instead of the TypeScript source (`js/index.ts`). Node.js could not import the source from `node_modules`, a bundler had to compile it, and a TypeScript project checked it with its own compiler options: a strict project got 209 errors from 0.5.0. Imports from `@chassis-ui/css` and from `@chassis-ui/css/js/dist/*` need no change. `@chassis-ui/css/js/src/*` is no longer an export; import the module from `@chassis-ui/css/js/dist/` instead (`js/dist/tooltip.js` for `js/src/tooltip.ts`). `js/index.ts` moved to `js/src/index.ts`, so a bundler alias that names the file by its path needs the new path, `js/dist/index.js`
- **Source maps** no longer hold a copy of their sources. They name the Sass files in `scss/` and the modules in `js/src/`, which the package ships, so the browser's developer tools show the same source as before when the package is installed from npm or loaded from a CDN that serves the whole package. The installed package is 7.2 MB instead of 14.4 MB. Two kinds of source are not in the package and no longer show: the Chassis Tokens file the CSS is compiled with, and the dependencies inside `chassis.bundle.js`. A copy of `dist/` alone, without `scss/` and `js/src/` next to it, shows no source
- `package.json` declares `engines.node` `>=22`, the version the PostCSS preset and the Sass build are tested with. The CSS and the JavaScript in the browser are not affected
- **Tailwind entry:** grid column, offset, gutter, and CSS grid placement classes (`col-6`, `md:col-4`, `lg:offset-2`, `g-md`, `g-col-4`, …) are now Tailwind `@utility` rules, so a Tailwind build only generates the ones a project uses, at the breakpoints it uses them, instead of every class at every breakpoint. Class names are unchanged; grid class names built at runtime need an `@source inline(...)` safelist entry. The classes sit in a `layout` sublayer of Tailwind's `utilities` layer, so utilities still override them at every breakpoint (`w-100 md:col-6` stays full width). Two results differ from 0.5.2: with `g-*` and `gx-*`/`gy-*` on one element the axis-specific class now wins (`g-md gx-0` has no horizontal gutter), and grid classes now rank above the `content`, `components`, and `helpers` layers instead of below them. `dist/css` is unaffected
- **Sass:** the Tailwind entry's mixins moved from `scss/mixins/` to `scss/tailwind/mixins/`, and `scss/mixins` no longer forwards `generate-tailwind-utilities`, `generate-tailwind-merge-manifest`, `emit-source-config`, or the Tailwind grid mixins. Only affects projects that called these directly from `scss/mixins`; the documented `@chassis-ui/css/scss/tailwind` entry is unchanged
- **Breaking:** `Nav`: `.nav-pills` renamed to `.nav-segments` and `.card-header-pills` to `.card-header-segments`, with no aliases; the `--cx-nav-pills-*` custom properties are now `--cx-nav-segments-*`. The variant is restyled as a segmented control, with its colors, padding, corner radius, font, and shadow resolved from Chassis Tokens
- **Breaking:** `Nav`: the Sass variables are now size-specific. `$nav-link-padding-y`, `$nav-link-padding-x`, and `$nav-link-font` are replaced by `$nav-link-{small,medium,large}-*`; `$nav-tabs-border-width` by `$nav-tabs-main-border-width`; `$nav-tabs-border-radius` by `$nav-tabs-medium-border-radius`; `$nav-underline-gap` by `$nav-underline-{small,medium,large}-gap`; and every `$nav-pills-*` variable by a `$nav-segments-*` one. A `@use ... with (...)` that configures a removed variable no longer compiles
- `Nav`: the active link's default colors now resolve from `--fg-active`/`--bg-active` (previously `--fg-main`/`--bg-even`), and a pressed link (`:active`) no longer takes the active link's style
- `Nav`: a `.nav-link` whose menu is open now keeps its hover style in every variant; `.nav-tabs` and `.nav-pills` previously gave it the active style
- `Nav`: `.nav-underline` links no longer show the underline on hover and keyboard focus; only the active link is underlined
- Docs: the `Nav` page is rewritten to the style guide's standard section order, with new sections for size variants, icons, Sass variables, and design tokens

### Fixed

- `Nav`: opening a menu from a toggle placed directly inside a `.nav-pills` nav, without a `.nav-item` wrapper, gave every sibling link the active style, because the open state was matched on the toggle's parent. It is now matched on the toggle itself
- Docs: the vertical example on the `Tab` page used `.nav-pills-vertical` and `.me-4`, neither of which exists, so the links never stacked; it now uses `.flex-column` and `.me-md`. The `Nav` page's link to the Tab plugin pointed at an anchor that does not exist
- **Types:** 16 of the type declarations in `js/dist/` were older than their modules, because the build did not write them. `NavOverflow`'s `moreText: string | false` and the `null` a `Toggler` value can hold were missing, among others. The build now writes the declarations with the modules, and a release fails when any file in `dist/` or `js/dist/` differs from a fresh build

### Minor Changes

- b60c264: **Breaking:** `.grid` is the grid system of Chassis, with gutters, column counts and container padding from the design tokens per breakpoint. The flexbox grid is deprecated.
  
  - **Placement classes with Tailwind's names and declarations**, generated for every breakpoint: `col-span-{1…12}`, `col-span-full`, `col-start-{1…13}`, `row-span-{1…6}` and `row-start-{1…7}`, with `col-start-auto` and `row-start-auto` to reset a start line at a wider breakpoint. `g-col-{n}` and `g-start-{n}` keep working as second selectors of `col-span-{n}` and `col-start-{n}`, deprecated. The declaration of `g-col-{n}` is now `grid-column: span n / span n` instead of `auto / span n`: the same placement, unless an element sets `grid-column-end` itself.
  - **The gap of `.grid` and `.grid-fill` is the gutter token of the breakpoint**, `--cx-grid-gutter` on `:root` (0.5rem at `xs` to 3rem at `2xl`, from `$grid-gutters`), where it was `$grid-gutter-x` (1.5rem) at every width. `--cx-grid-gap` on an element still sets the gap of one grid. The tracks are `minmax(0, 1fr)`, so content no longer widens a column. `.grid-fill` takes `--cx-grid-min` as the minimum column width.
  - **The column count comes from `$grid-column-counts`** (`--cx-grid-columns` on `:root`, 12 at every breakpoint until the Figma library defines the counts). `grid-cols-{1…12}` are utilities with Tailwind's `repeat(n, minmax(0, 1fr))`; `grid-cols-fill` is deprecated in favour of `col-span-full`.
  - **The padding of `.container` is `--cx-container-padding`** from `$container-paddings`, the page margin per breakpoint, independent of the gutter (0.75rem at every breakpoint, today's value). A `--cx-gutter-x` set on a container still works until 0.7.0. `$container-padding-x` is deprecated: when a project sets it, half of it is the padding at every breakpoint, as before, and the build warns.
  - **In the Tailwind entry, the placement classes are Tailwind core's own** `col-span-*`, `col-start-*`, `row-span-*` and `row-start-*` utilities: the entry no longer emits grid placement rules of its own, only the deprecated `g-col-*` and `g-start-*` aliases, which now carry the declarations of the classes they alias and sit in the `utilities` layer with them instead of the `utilities.layout` sublayer. In `@chassis-ui/css/tailwind/merge.js` the aliases join tailwind-merge's `col-start-end` and `col-start` groups, so `col-span-4 g-col-6` resolves to one class.
  - **Responsive fraction widths** `w-{1…11}/12` (`md:w-6/12`), the names and values of Tailwind's `w-<fraction>`, replace `col-{n}` used as a width outside a `.row`, as on skeletons; `w-100`, `w-auto` and `flex-fill` replace `col-12`, `col-auto` and `col`.
  - **Deprecated as of 0.6.0, removed in 0.7.0:** the flexbox grid (`.row`, `.col-*`, `.offset-*`, `.row-cols-*`, `.g-*`, `.gx-*`, `.gy-*`), its mixins (`make-row()`, `make-col-ready()`, `make-col()`, `make-col-auto()`, `make-col-offset()`, `row-cols()`, `make-grid-columns()`) and its variables (`$grid-gutter-y`, `$grid-row-columns`, `$gutters`). The build warns once per compile while `$enable-grid-classes` is true; set it to `false` to drop the flexbox grid now, or `$enable-deprecation-messages: false` to silence the notice. Migrate `.row` to `.grid`, `.col-4` to `.col-span-4`, `.offset-2` to `.col-start-3`, `.md:offset-0` to `.md:col-start-auto`, `.row-cols-3` to `.grid-cols-3`, `.g-md` to `.gap-md`, `.gx-*` and `.gy-*` to `.column-gap-*` and `.row-gap-*`.
  - The grid bundle (`chassis-grid.css`) declares the `--cx-space-*` custom properties its gap and gutter classes read.

### Patch Changes

- e58ef47: Fix the defects the end-to-end tests found in Dialog, Combobox, Menu and Datepicker.
  
  - **Dialog:** Escape pressed repeatedly no longer closes a dialog with `data-cx-keyboard="false"`, and a dialog the browser closes by itself releases the scroll lock of the page and fires `hidden`. A non-modal dialog is centered in the viewport.
  - **Combobox:** ArrowDown and ArrowUp on a closed menu leave the focus on the first or the last item. Escape in the input closes the menu. Tab on an item moves on to the next control in Safari.
  - **Combobox, Menu:** the arrow keys wrap at the ends of the list, as documented.
  - **Menu:** Escape closes the menu when a click left the focus on the page, as Safari does.
  - **Datepicker:** `show`, `shown`, `hide` and `hidden` also fire when the calendar opens on a click on its input and closes on Escape or a click outside. The focus returns from the calendar to its trigger when the calendar closes.
- e58ef47: Build the CSS with `@chassis-ui/tokens` 0.6.0. Half-pixel values keep their full precision: `0.03125rem` instead of `0.0313rem` in `--cx-border-width-sm`, `--cx-border-width-lg`, `--cx-box-shadow-sm` and the shadows and letter spacing built on them.
- 5c1cbfe: Rebuild the JavaScript with rolldown 1.2.12. The modules run the same code: a nested `if` now has its braces, and the last `case` of a `switch` no longer ends with a `break`. The minified builds do not change.
- cce6918: Rebuild the minified CSS with lightningcss 1.33, which collapses `light-dark()` calls whose two values are the same.
- c7e01b9: Build `chassis.bundle.js` with `@floating-ui/dom` 1.8.0, which positions a floating element against a `scrollbar-gutter: stable` viewport and a left-side scrollbar correctly. The peer dependency range stays `^1.7.6`.

## [0.5.2] - 2026-09-25

### Fixed

- `Nav`: `.nav-pills`' border radius now resolves from Chassis Tokens (`--border-radius-md` for the bar, `--border-radius-sm` for the items) instead of a hardcoded `var(--border-radius-full)`, so pills match their Figma design instead of always rendering fully rounded

## [0.5.1] - 2026-09-23

### Fixed

- `:root`'s `--font-family-*` tokens lost the quotes around family names. A name that only parses quoted, like `'Source Serif 4'` (`4` isn't a CSS identifier), came out as `Source Serif 4, ...`. The browser then rejected the whole `font-family` declaration and fell back to its default font. Names that are plain identifiers (`'Archivo Narrow'`) were unaffected, which is why Chassis's default tokens never showed it. The tokens now keep their quotes
- `Component.VERSION` reported `0.4.0` in 0.5.0: `build/change-version.js` still listed the pre-TypeScript `js/src/base-component.js` path and skipped the file

## [0.5.0] - 2026-09-19

### Added

- **Tailwind CSS v4 integration:** a new `@chassis-ui/css/tailwind` entry point (plus à-la-carte imports under `@chassis-ui/css/tailwind/*`) exposes Chassis tokens, components, and utilities to Tailwind CSS v4 projects. Chassis utilities are re-emitted as Tailwind `@utility` rules, so every Tailwind variant (`dark:`, `lg:`, `hover:`, `@md:`, `print:`) works on them without extra configuration; `dark:`/`light:` variants follow the same nearest-`data-cx-theme`-wins logic as Chassis's own `light-dark()` tokens; `sm:`–`2xl:` and `@md:`–`@2xl:` read Chassis's `$breakpoints` map instead of Tailwind's defaults. Tailwind core utility names that clash with Chassis component classes (`outline`, `collapse`, `container`, `grid`, `col-*`, and others) are excluded from Tailwind's own generation; utility names that clash by value are patched so Chassis's token-driven declaration wins. See the [Tailwind guide](https://chassis-ui.com/css/docs/getting-started/tailwind/)
- **`@chassis-ui/css/tailwind/merge.js`:** a generated [tailwind-merge](https://github.com/dcastil/tailwind-merge) `classGroups` config for the Tailwind entry point, so `extendTailwindMerge({ extend: { classGroups } })` resolves conflicts between Chassis utilities (`twMerge('fg-primary', 'fg-danger')` → `'fg-danger'`) the same way it already does for Tailwind's own utilities
- **`@chassis-ui/css/tailwind/bridge.css`:** an opt-in stylesheet that maps Chassis's context color palette (11 base colors plus the full shade ramp) into Tailwind's own `--color-*` theme namespace, so Tailwind-native color utilities Chassis has no equivalent for (`ring-*`, `outline-*`, `decoration-*`, `caret-*`, `accent-*`, `fill-*`, `stroke-*`, gradient stops, `placeholder-*`, and the `/<opacity>` modifier on any color utility) work with Chassis's palette. Same-name clashes this reintroduces against Chassis's own `bg-*`/`border-*` utilities are patched with `!important`, the same fix as the existing utility-name clash policy
- **`@chassis-ui/css/postcss`:** the `--cx-` custom-property prefix step is now a public preset — `chassisPrefix({ tailwind })` and `chassisPostcss({ tailwind })` — instead of a build-internal PostCSS config, so any project compiling Chassis from Sass (with or without the Tailwind entry point) can wire it into its own build. Fixes a real gap: the Tailwind entry's own `dist/tailwind/root.css` was shipping an unprefixed `--breakpoint-*`/`--container-*` Chassis runtime property (read by the nav-overflow plugin), because that name also has to stay unprefixed inside Tailwind's own `@theme`; the preset now tells the two apart by where the declaration sits, not just its name. The Tailwind entry point itself now compiles fully through Sass — `@layer` order, component-name exclusions, the JS-toggled-class safelist, and same-name `!important` remedies are all emitted by the Sass source instead of being patched onto the build output afterward — so a project with its own `chassis-tokens` and its own `$utilities`/`$breakpoints` gets the same result compiling `@chassis-ui/css/scss/tailwind` directly that the prebuilt `dist/tailwind/*.css` gets. See the [Tailwind guide](https://chassis-ui.com/css/docs/getting-started/tailwind/)

### Changed

- **Breaking:** Sizing keywords renamed to short form everywhere they're CSS-facing — class modifiers, Sass map keys, `$variable` name segments, `%placeholder` names, and generated CSS custom properties now use `2xs`/`xs`/`sm`/`md`/`lg`/`xl`/`2xl`/`3xl`/`4xl`/`5xl`/`6xl` instead of `2xsmall`/`xsmall`/`small`/`medium`/`large`/`xlarge`/`2xlarge`/`3xlarge`/`4xlarge`/`5xlarge`/`6xlarge`. Breakpoints are included in the rename, so the framework now has one consistent short vocabulary: `$breakpoints`/`$container-max-widths` map keys, responsive prefixes (`large:` → `lg:`, `.container.large` → `.container.lg`, `max-large:drawer` → `max-lg:drawer`), and `FloatingBase.BREAKPOINTS`/`ResponsivePlacements` on the JS side (base key `xsmall` → `xs`). Also renamed: the sizing/spacing/border/font/shadow maps and their generated `--size-*`/`--space-*`/`--border-*`/`--font-size-*`/`--line-height-*` custom properties; component size modifiers (e.g. `.button.large` → `.button.lg`, `.accordion.small` → `.accordion.sm`); the `scss/config/_defaults.scss` component variables and `scss/tokens/_forms.scss` composite variables that aren't 1:1 vendor mirrors. The upstream `@chassis-ui/tokens` package's 1:1 vendor-mirror variables in `scss/tokens/*.scss` (e.g. `$size-large: $cx-size-context-large`) keep their long-form names by design, so future vendor-package syncs stay a trivial diff — only the layer built on top of that boundary changed.

### Fixed

- **Custom prefixes:** `chassisPrefix()`/`chassisPostcss()` now take a `prefix` option (default `'cx-'`), and the JS plugins no longer hardcode `--cx-`. The preset writes the prefix into a `--chassis-prefix` property on `:root`, and a new internal `cssVar()` helper reads it at runtime, so `Carousel`, `NavOverflow`, `Strength`, and responsive placements keep working when a project renames the namespace — including with the prebuilt `dist/js`. Non-Tailwind builds can also opt out of prefixing entirely, by skipping the step or passing `prefix: ''`; the JS then reads the plain names. The Tailwind entry point still requires a prefix, since plain `--breakpoint-*`/`--container-*`/`--color-*` names collide with Tailwind's theme keys
- `Strength`: the `$form-password-strength-{weak,fair,good,strong}-color` defaults hardcoded `var(--cx-danger)` and similar, so a custom prefix produced references like `var(--acme-cx-danger)` that don't exist, and so did building with no prefix. They now use the plain Sass names (`var(--danger)`), which the prefix step renames like every other property
- **`chassisPrefix({ prefix })`:** the prefix must now end in `-` or `_`. A prefix like `acme` produced `--acmeprimary`, and `b` left every `--bg-*` unprefixed
- `FloatingBase.BREAKPOINTS` (responsive tooltip/popover/menu placements) read unprefixed `--breakpoint-*` properties that the built CSS never contains, so it always used its hardcoded pixel fallbacks and ignored a customized `$breakpoints` map; it now reads the prefixed properties
- Docs: `Carousel` and `Datepicker` doc examples still used leftover long-form sizing classes (`button small`, `cxd-placeholder-image-large`, `gap-medium`, `mt-medium`, `p-medium`) missed by the sizing rename above; updated to the short form (`button sm`, `cxd-placeholder-image-lg`, `gap-md`, `mt-md`, `p-md`)

## [0.4.0] - 2026-09-15

### Added

- **TypeScript:** `js/src/**` and the `js/index` entry point are now fully TypeScript instead of plain JS. The package ships real `.d.ts` declarations (emitted alongside each `js/dist/*.js`) instead of requiring a separate `@types` package; a compile-time-only `js/tests/types/api.ts` contract test locks in the public API shape
- **Build:** the production JS build now compiles through Rolldown's native TypeScript support instead of Rollup + Babel, producing smaller output across all four JS artifacts (`chassis.js`, `chassis.bundle.js`, and their minified builds); a new `build/browser-targets.js` resolves `.browserslistrc` into Rolldown/oxc target strings
- **Testing:** unit tests migrated from Karma/Jasmine to Vitest
- Added `bundlewatch` scripts (`build/bundlewatch-fix.mjs`, `build/bundlewatch-table.mjs`) for tracking bundle-size regressions
- All components now expose a public `isDisposed()` instance method
- `Pagination`: new bordered and grouped display modes
- `Button`: no-context (default, no color-context class) buttons now get body foreground/background colors instead of resolving to unset/transparent values
- `Carousel`: reworked layout; indicators are now rendered as an `<ol>` instead of a bare collection of buttons, and previous/next controls get new directional icons
- New `.directional-icon` helper class that horizontally mirrors an icon in `[dir="rtl"]` contexts; `.icon-link-hover`'s hover/focus transform is likewise RTL-aware
- `Table`: sticky headers and sticky columns
- New `.border-transparent` utility and `auto` value for position utilities (`top`/`end`/`bottom`/`start`)
- `Datepicker`: styling reworked to be fully class-based instead of relying on `vanilla-calendar-pro`'s inline styles, with renamed design tokens to match
- Added `AGENTS.md` and `WRITING.md` (replacing `.github/DOCUMENTATION_STYLEGUIDE.md`) documenting repo conventions and the docs writing style guide

### Changed

- **Breaking:** `Pagination` sub-classes renamed from `page-*` to `pagination-*`
- **Breaking:** `.input-help` renamed to `.input-adorn`, and the `Form Help` component/class renamed to `Form Adorn` to match
- **Breaking:** `NavOverflow` now requires the `.nav` to be wrapped in a `.nav-overflow` element, with `data-cx-toggle="nav-overflow"` moved from the `.nav` to that wrapper. The component previously measured, observed, and collapsed the same `.nav` element it was mutating — collapsing items changed the nav's own width, so on nav styles/layouts where that width wasn't otherwise pinned (e.g. `.nav-pills`, or a `.nav` whose flex ancestor let its min-content width leak through), the ResizeObserver could fire repeatedly and either never settle on a stable collapsed state or flicker on load. The wrapper is measured/observed instead, with `container-type: inline-size` closing off the remaining path for the nav's content width to affect the wrapper's own size. Ported from upstream Bootstrap's nav-overflow rewrite. Existing markup needs the extra wrapper element; see `site/content/docs/components/nav-overflow.mdx`
- `NavOverflow`: nav items now keep `flex-shrink: 0` by default (previously only `.nav-overflow-keep` items did), so items are measured at their natural width instead of visually compressing under space pressure before the component gets a chance to collapse them
- `NavOverflow`: the overflow threshold now accounts for the nav's actual `column-gap` instead of a fixed 10px buffer
- `NavOverflow`: `moreText` now accepts `false` for an icon-only toggle; an empty string is treated the same way. Both fall back to `aria-label="More"` so the toggle keeps an accessible name instead of losing it to an empty label element
- `NavOverflow`: the overflow toggle's icon/text are now built with DOM APIs instead of an HTML template string, and icon markup (`moreIcon` and `[data-cx-overflow-icon]`) is now run through a new `DefaultIconAllowlist` sanitizer before insertion, closing an XSS gap where a configured `moreText`/`moreIcon`/`menuPlacement` value could break out of its slot
- `Menu`: the toggle now reuses the shared `.caret` helper instead of a component-specific `.menu-toggle` class
- `Button`: the `.smooth` variant's hover background now resolves from `--context-bg-evident` (previously `--context-bg-main`) and its press background from `--context-bg-even` (previously `--context-bg-evident`); all buttons no longer swap foreground/background/border color on `:focus-visible` (focus is now indicated by the focus ring alone)
- `Button`: `.link` buttons' text/icon color now derives from `--fg-idle`/`--fg-hover`/`--fg-press`/`--fg-disabled` (mapped to the link color tokens) instead of a separate hardcoded `color` declaration, and no longer changes color on `:focus-visible` (hover only)
- Sanitizer: adopted a hardened `SAFE_URL_PATTERN` that also blocks `data:`/`vbscript:` URI schemes (previously only `javascript:`), plus a `DATA_URL_PATTERN` allowlist for safe image/video/audio data URIs

### Fixed

- `border()` mixin: the border color custom property now falls back to `transparent` when unset, instead of resolving to an empty/invalid value
- `Accordion`: the open/close CSS transition is now scoped by the `[data-cx-accordion]` attribute selector instead of `:not(.no-transition)`, matching the `data-cx-accordion` JS init trigger introduced in 0.3.5
- `Chip`: removed a `>` direct-child combinator from icon/avatar/close-button selectors so nested markup still matches
- `Badge`: default border color is now `transparent` instead of unset
- `Skeleton`: fixed incorrect color and animation
- `Spinner`: default size now matches the icon size
- `Carousel`: fixed items wrapping incorrectly at the end when more than one item is shown per slide; focus is now preserved across transitions, and disabled navigation controls get `aria-disabled`
- `Dialog`: the dialog now stays in the top layer (keeping the native `::backdrop` and browser centering) until its exit transition actually finishes, instead of closing synchronously and cutting the animation off
- `Dialog`/`Drawer`: `dispose()` now closes an open `<dialog>` and releases the body scroll lock instead of leaving both dangling; the native `cancel` event listener is now correctly removed on dispose
- `Toggler`: constructing with no explicit `value` no longer throws a `TypeError`
- `Tooltip`: calling `show()` on a `display: none` reference element now throws synchronously again instead of surfacing as a silent unhandled promise rejection
- `Combobox`: the default search input's filtering (the common, callback-less usage) was being silently skipped entirely; it now runs correctly, debounced to 150ms per keystroke
- `Menu`: fixed a submenu `mouseenter` listener leak on every open/close cycle (an `EventHandler.off()` bug meant bare `mouseenter`/`mouseleave` removals silently did nothing), and throttled the submenu hover-tracking `mousemove` handler to one update per animation frame
- `Chip Input`: fixed a dispose leak where listeners registered without a namespace weren't removed on teardown; fixed `paste` events breaking once namespaced by adding `paste` to the native-event allowlist
- Fixed a memory/listener leak in `NavOverflow`'s no-`ResizeObserver` fallback path — disposing one instance now removes only that instance's `window` resize listener instead of leaking every disposed instance's listener for the lifetime of the page
- Fixed the nav overflow docs incorrectly referencing `update.bs.navoverflow`/`overflow.bs.navoverflow` event names (leftover from the upstream port); they are `update.cx.navoverflow`/`overflow.cx.navoverflow`

### Removed

- Deleted `js/src/util/backdrop.ts`, `focustrap.ts`, and `scrollbar.ts` — no source file imported them, artifacts of old js plugins.

## [0.3.5] - 2026-07-25

### Changed

- `Accordion`: JavaScript now initializes via a `data-cx-accordion` attribute on the wrapper instead of the `.accordion` class, so `.accordion` is purely a visual/CSS class and no longer triggers JS on its own. Markup that relied on `.accordion` alone for the smooth open/close transition needs `data-cx-accordion` added to the wrapper to keep that behavior. Also renamed the internal attribute marking the transient clone used during the close transition from `data-accordion-clone` to `data-cx-clone`

## [0.3.4] - 2026-07-18

### Changed

- `Pagination`: reworked the color custom properties into explicit per-state variables (`--idle-fg-color`/`--idle-bg-color`, `--hover-fg-color`/`--hover-bg-color`, `--focus-fg-color`/`--focus-bg-color`, `--active-fg-color`/`--active-bg-color`/`--active-border-color`, `--disabled-fg-color`/`--disabled-bg-color`/`--disabled-border-color`) instead of overloading a single `--fg-color`/`--bg-color` pair across `:hover`, `:focus-visible`, `.active`, and `.disabled`; `.page-link` switched from `display: block` to a flex layout (`align-items: center`, `height: 100%`) so icon-based prev/next controls center correctly, and icons get `transform: translateZ(0)` to prevent a sub-pixel shift when `z-index` changes on hover/focus/active; added a new `$pagination-icon-size`/`--pagination-icon-size` Sass variable and CSS custom property

### Fixed

- Fixed `Pagination`'s `--border-radius` custom property incorrectly falling back through `--pagination-border-color` instead of `--pagination-border-radius`, so overriding `--pagination-border-color` silently also overrode the border radius
- Fixed `_icon-link.scss`: `text-decoration-color` now resolves from `currentcolor` instead of the hardcoded `--link-main-color`, so the underline correctly follows contextual link colors (e.g. `.link-danger`) instead of always rendering in the base link color
- Fixed `b`/`strong` bold weight in `_reboot.scss` to use the `$font-weight-bolder` (`bolder` keyword) Sass variable directly instead of the fixed `--bold-font-weight` custom property, so bold text scales relative to its inherited weight instead of always resolving to the same absolute value

## [0.3.3] - 2026-07-07

### Fixed

- Fixed `build/css-minify.js`: the dynamic `import('browserslist')` used to read `.browserslistrc` targets was silently failing under pnpm's strict `node_modules` layout (`browserslist` was never a direct dependency, only a transitive one), so every build minified with lightningcss's default targets instead of this project's actual declared browser support. Added `browserslist` as a direct devDependency; a failure to load targets now fails the build instead of silently degrading. Also dropped the invalid `sourceRoot: null` key lightningcss emits in source maps (violates the source map spec, triggers devtools warnings), removed a redundant JSON parse/stringify round-trip on the input source map, and anchored the `.css` → `.min.css` extension replace to the end of the filename
- Fixed the docs site dev server (`site/`) intermittently failing to load `Dialog`/`Drawer`/etc. component scripts (e.g. modals opening and immediately closing): whenever `@chassis-ui/docs` is installed as a real dependency (not workspace-linked), Vite's `optimizeDeps` pre-bundles its `example-mode.js` with its own inlined copy of `@chassis-ui/css`, producing a second module instance and duplicate data-api click listeners alongside the one aliased in `site/src/libs/astro.ts`. Excluded `@chassis-ui/docs` from `optimizeDeps` so it always resolves through the same aliased instance

## [0.3.2] - 2026-07-05

### Fixed

- Fixed the `sideEffects` field in `package.json`: it listed `./js/src/*.js`, `./js/dist/*.js`, and `./dist/js/*.js`, but not `./js/index.js` — the package's actual `exports["."]` entry point. Bundlers treated that barrel file as side-effect-free and tree-shook away any component nobody imported by name (e.g. `Dialog`, `Drawer`, `Accordion`, `Toast`, `Carousel`), silently dropping their self-registering `data-cx-toggle`/`data-cx-dismiss` click handlers. This only affected consumers who bundle `@chassis-ui/css` from source directly (e.g. via a bare `import '@chassis-ui/css'` in their own build) rather than loading the prebuilt `chassis.bundle.js`. Added `./js/index.js` to `sideEffects`.

## [0.3.1] - 2026-07-04

### Fixed

- Fixed `scss/vendor/_chassis-tokens.scss` default token forward: replaced the relative `../../node_modules/@chassis-ui/tokens/...` path (which only resolved when `@chassis-ui/tokens` was hoisted/nested inside `@chassis-ui/css`'s own `node_modules`) with a bare `@chassis-ui/tokens/...` package specifier, so consumers installing `@chassis-ui/css` under pnpm's isolated `node_modules` layout no longer hit a "Can't find stylesheet to import" Sass build error
- Added `--load-path node_modules` to `css:compile` so the Dart Sass CLI resolves the bare `@chassis-ui/tokens` specifier the same way Vite/Astro consumers already do

## [0.3.0] - 2026-07-04

Chassis CSS 0.3.0 is a near-total rewrite of the SCSS architecture, the component set, and the JavaScript plugin layer. Almost every class, custom property, and Sass API surface changed in some way — treat this as a breaking major-style release despite the semver-minor version number.

### Added

**New components**

- `Dialog` (`.dialog`): new foundational primitive built on the native `<dialog>` element, shared by Modal, Alert, and Drawer (`show()`/`showModal()`, backdrop/keyboard config, `.dialog-static`, `.scrollable`, `.translucent`, seamless "dialog swapping" between triggers inside an already-open dialog)
- `Drawer` (`.drawer`): replaces Offcanvas; native `<dialog>`-based, `.drawer-start/-end/-top/-bottom` placements, swipe-to-dismiss gestures, `.sheet` edge-flush variant, `.fullscreen`, non-modal `scroll` mode, responsive inline-collapse
- `Menu` (`.menu`): replaces Dropdown; rebuilt on Floating UI with native submenu (nested flyout) support — hover/click/`both` trigger modes, safe-triangle hover intent, mobile stacked/back-button submenu variant, portal `container` option, `display: dynamic|static`, keyboard nav
- `Stepper` (`.stepper`): horizontal/vertical progress steps with automatic "completed" state derivation and container-query overflow scrolling
- `Nav Overflow` (`.nav-overflow`): Priority+ pattern that auto-collapses overflowing nav items into a "more" menu, driven by `ResizeObserver`
- `Datepicker`: wraps `vanilla-calendar-pro`; input-bound, button-triggered, or always-visible `inline` modes, single/multiple/ranged selection, live theme sync
- `Combobox`: searchable select-style menu built on Menu, single or `multiple` selection, hidden-input form submission, diacritic-insensitive search
- `Chip Input`: tag/chip entry field with keyboard navigation, multi-select, paste support, and a public `add()`/`remove()`/`getValues()` API
- `Otp Input`: segmented one-time-passcode input with auto-advance, paste distribution, and `autocomplete="one-time-code"` SMS autofill support
- `Strength`: password-strength meter (segmented or bar variant) with configurable scoring/thresholds and a `strengthChange` event (never exposes the password value)
- `Toggler`: minimal utility component for toggling an arbitrary class or attribute on a target element
- `Form Field`, `Form Help`, `Form Label`, `Input Help`: new form-layout primitives (`.form-field`, `.form-card`, `.input-help` inline icon/button slot inside `.form-input`)
- Vertical input groups (`.input-group.vertical`), including nested groups

**SCSS architecture**

- CSS cascade layers with an explicit global order: `colors, theme, config, root, reboot, layout, content, components, custom, helpers, utilities`
- New `scss/config/` entry point consolidating all feature flags (`_settings.scss`) and every configurable variable (`_defaults.scss`, ~1,500 lines) behind a single `@use "@chassis-ui/css/scss/config" as *`
- Design tokens now resolve through a swappable vendor package (`scss/config/_vendor.scss` → `scss/vendor/_chassis-tokens.scss`, resolved via Sass `loadPaths`), so a consumer can override the entire token source without editing the framework
- `scss/tokens/` and `scss/maps/` split into focused per-domain files (borders, sizing, spacing, opacity, colors-body, colors-light/dark, plus per-component token files for Alert, Datepicker, Grid, Icon, Menu, Modal, Notification, Stepper, etc.)
- Native CSS `light-dark()` now drives dark mode in `_root.scss` (falls back to duplicated selectors only when `$enable-dark-mode: false`)
- New `scss/rfs/_clamp.scss`: `cx-clamp()`/`clamp()` mixin family generates fluid `clamp()` values (font-size, line-height, gap, padding, margin) from a single max value, replacing the old media-query-based RFS engine
- New mixins: `focus-ring()` (outline-based focus indicator), `translucent()` (frosted-glass backdrop-filter effect, opt out via `prefers-reduced-transparency`), `mask-icon()`, `tokens()` (dumps a Sass map as custom properties), `rtl-value()`/`rtl-prop()`, `dialog-header()`/`dialog-body()`/`backdrop-transitions()`
- New container-query mixin family mirroring the breakpoint mixins: `container-breakpoint-up/-down/-between/-only`, `set-container()`
- New color functions: `scss/functions/_color-context.scss` (`get-sass-color()`, `remove-context()`) for resolving/stripping context-prefixed CSS variables, including the new `oklch(from var(...) l c h / alpha)` relative-color format
- New Sass map helpers: `defaults()` (override-merge that supports removing keys), `map-get-nested()`

**New utilities**

- `scss/utilities/_gap.scss`, `_grid.scss` (CSS grid utilities), `_icon.scss`, `_link.scss` (`.link-{context}` color utilities), `_position.scss`, `_skeleton.scss`, `_spinner.scss`
- `space-x`/`space-y` (Tailwind-style "space between children"), `divide-x`/`divide-y`, `aspect-ratio`/`aspect-ratio-attr`, `container`/`.contains-inline`/`.contains-size`, `min-w-*`/`min-h-*`, `.dvh-{25,50,75,100}` (dynamic viewport height)

**Build & tooling**

- `build/check-imports.js`: static analyzer that flags unresolved, unused, or missing Sass `@use`/`@forward` imports (`css:lint:imports`)
- `build/css-minify.js`: minification moved from `clean-css` to `lightningcss` (needed for `light-dark()`, `color-mix()`, and `@layer` support)
- `build/html-validate.js`: validates built site HTML via `html-validate` (`site:lint:html`)
- Pagefind search indexing wired into `site:build` (`site:pagefind`)
- `postcss-prefix-custom-properties` plugin prefixes every `--*` custom property with `--cx-` at build time (see Changed)

### Changed

**Design tokens & color system**

- Deprecated Sass `@import` rules replaced with `@use` and `@forward` across the entire codebase
- Color variables now use `oklch()`
- CSS variable prefixing (`--cx-`) now handled by PostCSS instead of Sass — Sass source and mixins/functions emit unprefixed `--name` custom properties throughout
- RFS (Responsive Font Sizes) system replaced with CSS `clamp()`

**JavaScript**

- JavaScript is now ESM-only — the UMD build, `js/index.umd.js`, and all `jQuery` interop (`jQueryInterface()`, `defineJQueryPlugin()`) have been removed; `js/index.esm.js` is now the single entry point at `js/index.js`
- Dropped jQuery support
- Dropdown component replaced with the new Menu component, which adds submenu support
- Offcanvas renamed to Drawer, built on the native `<dialog>` element
- Modal and Alert rebuilt on the native `<dialog>` element (`.modal-window`/`.modal-container`/`.modal-backdrop` markup removed; `.modal` now applies directly to `<dialog>`)
- Popper.js (`@popperjs/core`) replaced with Floating UI (`@floating-ui/dom`) for Menu, Tooltip, and Popover positioning, via a new shared `FloatingBase` class; adds a responsive placement syntax (e.g. `placement="bottom small:top large:right"`) tied to CSS breakpoints; `popperConfig` option renamed to `floatingConfig`; `[data-popper-placement]` attribute renamed to `[data-cx-placement]`
- Added Vanilla Calendar Pro (`vanilla-calendar-pro`) as a peer dependency for the new Datepicker component
- `tab.js` dropdown handling rebuilt around the new Menu component; `scrollspy.js` menu-item activation updated to match

**Components**

- Card groups now use container queries
- List group horizontal variants now use container queries; `.list-group` renamed to `.list` (`.list.outline`, `.list.numbered`, `.list.flush`, `.list.plain`)
- Accordion: `.indicator-end` renamed `.caret-end`; Safari/WebKit Tab-focus loss after a pointer click on `<summary>` fixed by switching `display: flex` to `list-item` and moving flex layout into a new `.accordion-title` wrapper
- Avatar: `.avatar-group` renamed `.avatar-stack`
- Badge: `.round` renamed `.circle`
- Breadcrumb: `.breadcrumb-page` renamed `.breadcrumb-item`
- Card: `.card-content` renamed `.card-body` (flex column with gap)
- Image: `.img-fluid`/`.img-thumbnail` renamed `.image.fluid`/`.image.thumbnail`; new `.figure`/`.figure-caption`
- Type: `.text-initials`/`.text-monospace` renamed `.font-initials`/`.font-monospace`; heading-extension classes (`.h1`–`.h6`) and the old `.font-{size}` utilities removed from `_type.scss` in favor of the new `_text.scss` utility scale
- Button/Button-group: `.dropdown-toggle`/`.dropdown-toggle-split` renamed `.menu-toggle`/`.menu-toggle-split`
- Navbar: offcanvas integration switched to Drawer classes; `navbar-expand` now driven by container queries instead of viewport media queries; new `.navbar.translucent`
- Toast: new `.toast-footer`, `.toast.translucent`

**Forms**

- Consolidated `.form-select` into `.form-input` (`select.form-input`); `_form-select.scss` removed
- Form validation icons now require a `.validation-icons` class on any ancestor (previously controlled only by a Sass flag with no markup opt-in)
- Validation state trigger model changed from `.was-validated` + `:valid`/`:invalid` to `[data-cx-validate]` + `:user-valid`/`:user-invalid` combined with `.is-valid`/`.is-invalid`, extended to Combobox, OTP Input, and both checkbox styles
- `_form-check.scss` split into `_check-legacy.scss` (native-input, background-image icons) and `_check-modern.scss` (wrapper-div, `:has()` + masked pseudo-element icons); size/gap/font variants consolidated into a single map-driven mixin
- `.col-form-label-large`/`.col-form-label-small` replaced by `.col-form-label.large`/`.col-form-label.small`
- `.icon-addon` replaced by `.input-help` (icon/button inside `.form-input`) and `.input-addon` (prepend/append inside `.input-group`)
- Floating labels rewritten to use `:has()` instead of adjacent-sibling selectors, making label-floating robust to intervening elements like `.input-help`

**Utilities**

- Utility breakpoint variants use `{breakpoint}:` prefix (Tailwind-style) exclusively; the legacy infix form and its `breakpoint-infix()` alias are fully removed in favor of `breakpoint-prefix()`
- Media queries switched from `min-width`/`max-width` (with a 0.02px Safari rounding offset) to CSS range syntax (`width >= Xpx`)
- The utilities-API map format gained `property` maps (emit a CSS variable and a consuming property together), `selector` (`class`/`attr-starts`/`attr-includes`), `child-selector`, `variables`, `group` (deduplicated shared-property output), `print`, and `dark` media variants; the legacy `rfs`, `css-var`, `local-vars`, and `rtl` utility-map keys are no longer supported
- `border-*-radius` mixins and utilities switched from physical to logical CSS properties (RTL/vertical-writing-mode aware)
- Negative margin utilities now gated behind `$enable-negative-margins` and renamed with a `-m`/`-mt`/etc. prefix

**Build & tooling**

- Focus ring rendering switched from `box-shadow` to `outline` (new `focus-ring()` mixin)
- `gradient-bg()` mixin renamed to `gradient()`; no longer sets `background-color` itself
- The prebuilt RTL CSS build (`css:rtl`, the `rtlcss` PostCSS plugin, `.rtl.css`/`.rtl.min.css` output) has been dropped in favor of logical properties handling RTL directly
- Rollup now emits a single ESM bundle (UMD format and globals mapping removed); external deps swapped `@popperjs/core` → `@floating-ui/dom` + `vanilla-calendar-pro`
- `package.json` gained an `exports` map and `sideEffects` array in place of the `main`/`module` fields

### Removed

- jQuery peer dependency and all jQuery interop code and tests
- UMD build output and build scripts (`js:compile:umd`, `js:minify:umd`, `js/index.umd.js`)
- `@popperjs/core` dependency
- Dropdown and Offcanvas components (JS and SCSS) — replaced by Menu and Drawer
- `scss/functions/_math.scss` (`add()`, `subtract()`, custom `divide()`) and `scss/functions/_rfs.scss` (`responsive-scale()`/`rscale()`) — superseded by native Sass math and the new `clamp()`-based RFS system
- `scss/mixins/_button.scss` (`solid-button()`, `outline-button()`, `smooth-button()`) — button color-variant logic now generated from tokens directly
- `scss/helpers/_context.scss`, `_links.scss`, `_ratio.scss` — equivalent classes now generated through the utilities API (`fg-color`/`bg-color`/`link-{context}`) and the new `_stretched-link.scss`/aspect-ratio utilities
- `.lightbox` and `.centered` Modal variants
- `.navbar-nav-scroll`
- `$negative-spacers`, `$basic-opacities`, and `$bg-opacities` Sass maps

### Fixed

- Toast `hide()` now clears the autohide timeout immediately instead of after checking `defaultPrevented`, preventing a stale autohide from firing after a manual `hide()`
- Notification link-emphasis selector now excludes `.button`/`.close-button` children, preventing unwanted bold styling on those elements
- `svg-icon()` now escapes already-formed `data:image/svg+xml` URIs, fixing malformed `background-image` URLs in some code paths
- Accordion constructor now guards against malformed markup before creating its `MutationObserver`; data-API click handler now only initializes the clicked accordion and its same-`name` siblings instead of every accordion on the page

## [0.2.3] - 2026-05-03

### Changed

- `$enable-responsive-gradients` default value changed to `false`

### Fixed

- Added `scss-docs` start/end markers to `opacity-var()`, `to-color()`, and `to-opacity()` in `_color.scss` for documentation extraction
- Fixed `cleanPublicDirectory()` to delete directory contents rather than the directory itself, preventing `ENOTEMPTY` errors on macOS and Windows caused by OS-managed metadata files
- Fixed misplaced parenthesis in `copyStaticRecursively()` that caused `{ recursive: true }` to be ignored in `mkdirSync`
- Fixed documentation issues in Sass customization, background, colors, and focus-ring pages
- Removed unused shortcode components (`CSSOnly`, `DeprecatedIn`, `InFigma`)

## [0.2.2] - 2026-05-03

### Fixed

- Fixed `publish-release.yml` GitHub Actions workflow

## [0.2.1] - 2026-05-03

### Fixed

- Added `publishConfig` to `package.json` for correct npm registry targeting
- Removed `pnpm-workspace.yaml` (not needed for single-package repo)
- Fixed deployment configuration issues

## [0.2.0] - 2026-05-03

### Added

- `to-color()` SCSS function: converts any Sass color to a rounded `oklch()` value with preserved alpha
- `to-opacity()` SCSS function: generates a CSS relative color expression using `oklch(from … / opacity)` syntax, replacing `rgba()` for dynamic opacity on CSS custom properties
- `opacity-var()` SCSS function: replaces `rgba-css-var()` — generates `oklch(from var(--cx-{identifier}) l c h / var(--cx-{target}-opacity, 1))` for component color utilities
- Breakpoint prefix support for utility classes: responsive variants now use `{breakpoint}:` prefix convention (e.g. `sm:icon-md`, `lg:list-horizontal`)
- Breakpoint prefix support for `.navbar-expand` — expanded to use the new prefix convention instead of infix
- GitHub Actions workflow (`publish-release.yml`) that detects version bumps on `main` and auto-publishes releases

### Changed

- Renamed `$enable-responsive-utilities` to `$enable-adaptive-font-sizes` for clarity; controls breakpoint-based responsive font and icon size utilities
- Replaced all `rgba()` calls in SCSS variables and component styles with `to-opacity()` / `to-color()` — migrated ~76 occurrences across `_variables.scss`, `_reboot.scss`, `_button.scss`, `_forms.scss`, `_navbar.scss`, `_toast.scss`, and more
- `rgba-css-var()` function renamed to `opacity-var()` and updated to use CSS relative color syntax instead of `rgba(var(--rgb), opacity)` — no longer requires separate `-rgb` custom properties
- Removed legacy `-rgb` variable aliases (`$fg-main-rgb`, `$bg-main-rgb`, `$border-main-rgb`, etc.) from `_variables.scss` — color opacity is now applied directly via `opacity-var()` and `to-opacity()`
- Navbar `container` selector generation refactored to use escaped breakpoint strings with proper handling for numeric breakpoints
- Cleaned up `_navbar.scss` comment block and removed unused `&#{$infix}` pattern in favor of explicit `breakpoint-prefix` loop
- Container selector syntax changed from `.container-{breakpoint|fluid}` to `.container.{breakpoint|fluid}` (compound class), with CSS escaping for numeric breakpoint names (e.g. `.container.2xlarge` → `.container.\32 xlarge`)
- Image class selectors changed from `.image-fluid` / `.image-thumbnail` to compound classes `.image.fluid` / `.image.thumbnail`
- List variant selectors changed from `.list-numbered` / `.list-flush` / `.list-plain` to compound classes `.list-group.numbered` / `.list-group.flush` / `.list-group.plain`
- List horizontal variant renamed from `.list-horizontal` to `.list-group.horizontal`; responsive variant changed from `.list-horizontal-{breakpoint}` to `.list-group.{breakpoint}:horizontal` (e.g. `.list-group.large:horizontal`)
- Utility breakpoint infix convention replaced with prefix across all utilities — infix pattern `{utility}-{breakpoint}-{value}` is now `{breakpoint}:{utility}-{value}` (e.g. `p-large-xlarge` → `large:p-xlarge`)
- Offcanvas responsive class renamed from `.offcanvas-{breakpoint}` to `.{breakpoint}:offcanvas` (e.g. `offcanvas-large` → `large:offcanvas`)
- Table responsive class renamed from `.table-responsive-{breakpoint}` to `.{breakpoint}:table-responsive` (e.g. `table-responsive-large` → `large:table-responsive`)
- Modal fullscreen breakpoint class renamed from `.fullscreen-{breakpoint}-down` to `.{breakpoint}:down:fullscreen` (e.g. `fullscreen-large-down` → `large:down:fullscreen`)
- SCSS source files across all components updated with standardized JSDoc-style block comments describing component purpose, variants, and dependencies
- JS source across all components cleaned up: standardized JSDoc block comments (`Constants`, `Class definition`, `Data API implementation`, `jQuery`), removed inline workaround comments
- `eslint.config.js` minor update

### Fixed

- Form label color: now set via `--cx-fg-color` CSS custom property for proper theming support

## [0.1.2] - 2026-04-14

### Added

- Responsive icon utilities for icon positioning
- `$enable-bts` setting renamed to ``$enable-responsive-utilities`
- `_vendor.scss` file for centralized Chassis Tokens import
- Icon documentation with responsive utility examples

### Changed

- Changed `box-padding` setting to `exclude-strokes` for better Figma alignment
- Updated component mixins to use `exclude-strokes` instead of `box-padding`
- Reorganized homepage components into `homepage/` subdirectory
- Updated Chassis Tokens vendor submodule

### Fixed

- Icon positioning and sizing utilities now support responsive variants

## [0.1.1] - 2026-04-08

### Added

- Breakpoint Type Scale (BTS) utilities for responsive font sizing
- Enable/disable BTS feature via `$enable-bts` variable
- Responsive font size classes following mobile-first approach
- Circle option to border radius map

### Changed

- Updated home page documentation
- Renamed opacity levels for better clarity
- Updated internal path references

### Documentation

- Improved typography documentation with BTS examples
- Updated README.md with correct package installation and usage examples
- Fixed broken URLs and import paths in documentation

## [0.1.0] - 2025-10-28

### Added

- Major framework refactor with improved architecture
- Comprehensive documentation site built with Astro
- Design token system integration
- Context-aware color system with re-declaration approach
- Complete component library with tokenized styles
- Multi-brand and theme support
- RFS (Responsive Font Sizing) customization
- Icon positioning and inner padding utilities
- Network accessible development server

### Changed

- Migrated from Hugo to Astro for documentation
- Transferred project ownership to chassis-ui organization
- Improved build scripts and configuration
- Updated ESLint and Stylelint configurations
- Moved content folder structure for better organization
- Enhanced package.json configuration
- Updated to ES module format

### Fixed

- Icon-only button styling issues
- Code component rendering in documentation
- Transfer ownership related path issues
- Package.json configuration errors

### Documentation

- Complete rewrite of all component documentation
- New documentation for:
  - Accordion components with tokens
  - Button and Notification components
  - Modal components
  - Navigation and Navbar
  - Nav and Tabs
  - Forms (complete 8-part documentation)
  - List components
  - Card components
  - Icons
- Added docsref system and aliases
- Comprehensive core concepts documentation
- Getting started guide

## [0.0.1] - 2025-02-27

### Added

- Initial project setup
- Core SCSS architecture from Bootstrap foundation
- Basic component structure
- Grid system
- Utility classes
- Build tooling setup
- Development environment configuration

### Documentation

- Initial README
- License files (MIT and Bootstrap attribution)
- Basic project structure documentation

## Changed Ownership - 2025-10-13

The project was transferred to the chassis-ui organization, establishing it as an independent framework separate from Bootstrap.

---

## Development Timeline

### 2026 Q1-Q2

- Added breakpoint type scales
- Updated opacity system
- Enhanced border radius utilities
- Improved documentation

### 2025 Q4

- Major framework refactor
- Ownership transfer to chassis-ui
- Documentation improvements
- Build system enhancements

### 2025 Q3

- Astro migration completed
- Build script improvements
- Package configuration updates
- Submodule integration

### 2025 Q2

- Comprehensive component documentation
- Forms documentation series
- Navigation components
- RFS customization
- Card and icon improvements
- Link color namespace addition

### 2025 Q1-Q2

- Astro documentation migration (19 parts)
- Foundation work and architecture
- Initial component implementations

### 2025 Q1

- Project initialization
- Core framework setup
- Development environment

---

[0.3.4]: https://github.com/chassis-ui/css/compare/v0.3.3...v0.3.4
[0.3.5]: https://github.com/chassis-ui/css/compare/v0.3.4...v0.3.5
[0.2.3]: https://github.com/chassis-ui/css/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/chassis-ui/css/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/chassis-ui/css/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/chassis-ui/css/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/chassis-ui/css/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/chassis-ui/css/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/chassis-ui/css/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/chassis-ui/css/releases/tag/v0.0.1
