---
'@chassis-ui/css': minor
---

Fixes from a review of the grid system.

- **`.grid-fill` wraps without a minimum set.** Its columns are at least `12rem` wide (`$grid-fill-min`, the fallback of `--cx-grid-min`), where the minimum of `0` put every child in one row, whatever their number. `--cx-grid-min` still sets the width of one grid
- **`place-items-*` has a variant per breakpoint and per container width** (`.md:place-items-center`, `.@md:place-items-center`), which its documentation described and the build did not generate
- **The grid bundle** (`chassis-grid.css`) has `.contains-inline`, without which its `.contained` modifier and `@md:` classes had no query container to read, and the fraction widths (`.w-6/12`) with their variants. Its utility list named a `justify-items` key that does not exist; `map-get-multiple()` now warns about a key the map lacks
- **`grid-root-vars()` and `grid-container-vars()` check their maps.** A map with no value for the first breakpoint (`$grid-gutters: (md: 1.5rem)`) stops the compile, where it left `--cx-grid-gutter` undefined below `md`; a key that is no breakpoint is reported with a warning and ignored, as before
- **`tailwind/merge.js` exports `overrideClassGroups`.** tailwind-merge lists `grid`, `table`, `inline`, `list-item`, `collapse` and `static` in its display, visibility and position groups, and in the Tailwind entry they are Chassis classes, so `twMerge('grid gap-md', 'd-flex')` dropped `.grid`. Pass `override: { classGroups: overrideClassGroups }` beside `extend: { classGroups }` to `extendTailwindMerge`, and the Chassis class stays
- `Navbar`: the rule of a container inside a `.navbar` listed `.sm\:container` to `.2xl\:container`, classes that do not exist (the variants are `.container.sm`, which `.navbar > .container` matches). The selectors are removed
- **Tailwind entry:** with those selectors gone, `sm:container` to `2xl:container` are no longer names of Chassis classes, and the entry no longer excludes them from Tailwind: `lg:container` is Tailwind's own `container` utility under its `lg:` variant, where it generated nothing. `container` alone stays the Chassis class
