---
'@chassis-ui/css': minor
---

The rest of the grid vocabulary, under Tailwind's names and with its declarations, each with a variant per breakpoint and per container width.

- **End lines:** `.col-end-{1…13}` and `.col-end-auto` (`grid-column-end`), `.row-end-{1…7}` and `.row-end-auto`. `.col-span-3 .col-end-13` places three tracks against the end edge of the grid. They are generated one line past `$grid-columns` and `$grid-rows`
- **`.col-auto` and `.row-auto`** (`grid-column: auto`, `grid-row: auto`) take a span and a line off an item at a breakpoint: `.col-span-full .md:col-auto`. `.col-auto` was a class of the flexbox grid until this release; markup that still carries it gets an item of one track
- **Tracks:** `.grid-cols-none`, `.grid-rows-none` and `.grid-rows-subgrid`, and `.auto-cols-{auto,min,max,fr}` and `.auto-rows-{auto,min,max,fr}` for the size of the tracks a grid adds beyond its template (`grid-auto-columns`, `grid-auto-rows`)
- **Alignment:** `.justify-items-{start,end,center,stretch}`, `.justify-self-{auto,start,end,center,stretch}`, `.place-self-{auto,start,end,center,stretch}` and `.place-content-{start,end,center,between,around,evenly,stretch}`
- **Sass:** `$fill-min` in `scss/tokens/_grid.scss`, the minimum column width of `.grid-fill` (12rem), a placeholder until `@chassis-ui/tokens` has the token; `$grid-fill-min` reads it
- **Tailwind entry:** nothing changes for a project that used Tailwind's utilities of these names. The end lines and the `auto` resets are Tailwind's own; the track and alignment utilities are Chassis utilities equal to Tailwind's, in the groups of tailwind-merge of the same names (`grid-flow`, `auto-cols`, `auto-rows`, `justify-items`, `justify-self`, `place-content`, `place-self`)
- The grid bundle (`chassis-grid.css`) has all of them
