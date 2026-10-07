---
'@chassis-ui/css': minor
---

Container-query variants of the grid classes and the layout utilities, and a grid whose gutter follows its container.

- **`@md:` variants.** Every placement class of `.grid` has a variant per container width under the `@` prefix, Tailwind's container variant: `.@md:col-span-4`, `.@lg:col-start-3`, `.@md:col-start-auto`, `.@md:row-span-2`. It applies when the nearest query container (`.contains-inline`, `set-container()`, a `.navbar`) is at least as wide as the breakpoint, where `.md:col-span-4` follows the viewport. The prefixes are `@sm:` to `@2xl:`; an unprefixed class is the layout below `sm` and of an element with no query container above it. Where a breakpoint class and a container class both apply to an element, the container class wins
- **The layout utilities have the same variants:** `d-*`, `flex-*`, `order-*`, `justify-content-*`, `align-items-*`, `align-content-*`, `align-self-*`, `gap-*`, `row-gap-*`, `column-gap-*`, `grid-cols-*`, `grid-auto-flow-*`, `space-x-*`, `space-y-*`, `divide-x`, `divide-y`, `w-{n}/12`, `w-100`, `w-auto`, `text-start` / `text-center` / `text-end`, `float-*` and `object-fit-*` (`.@md:d-flex`, `.@md:flex-row`, `.@md:w-6/12`)
- **`.grid.contained` and `.grid-fill.contained`** take `--cx-grid-gutter` and `--cx-grid-columns` from the breakpoint of the query container, not of the viewport: a grid in a narrow column of a wide page has the gutter of a narrow page. `--cx-grid-gap`, a gap utility and `grid-cols-*` still override them, and without a query container the grid keeps the values of the first breakpoint. Plain `.grid` is unchanged
- **Utilities API:** a `container` key, boolean. `container: true` generates the `@` variants of a utility, after its responsive ones. The utilities above set it; margin, padding, font size and icon size set `container: false`, and a `map.merge` of `$utilities` turns it on for them
- **Sass:** the option `$enable-container-queries` (`true` by default) governs the `@` variants and the modifier. New: `container-breakpoint-prefix()`, `make-cssgrid-container()` and `grid-container-vars()`
- **Tailwind entry:** nothing new to import. `@md:col-span-4` and `@md:d-flex` are Tailwind's own container variants there, at the Chassis breakpoints, for every utility; `.grid.contained` is plain CSS of the entry
- `chassis.min.css` is 665 KB, from 608 KB (81.4 KB gzipped, from 76.1 KB), with the `grid-rows-*` utilities of this release: five container widths of 41 placement rules and 178 utility rules. The grid bundle is 174 KB, from 136 KB (18.0 KB gzipped, from 14.3 KB)
