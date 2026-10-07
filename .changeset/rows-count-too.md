---
'@chassis-ui/css': minor
---

`grid-rows-{1…6}`: the number of explicit rows of a grid as a class, with the declaration of Tailwind's utility of the same name (`grid-template-rows: repeat(n, minmax(0, 1fr))`).

- `.grid-rows-2` sets the rows of one grid, where `--cx-grid-rows` is inherited by every grid nested in it. The classes are generated up to `$grid-rows` and have a variant per breakpoint (`.md:grid-rows-3`) and per container width (`.@md:grid-rows-3`), as `grid-cols-*` has. The grid bundle has them too
- **Tailwind entry:** `grid-rows-{1…6}` are Chassis utilities equal to Tailwind's own, so nothing changes for a project that used Tailwind's; `tailwind/merge.js` has a `grid-row-counts` group
- 4 KB of `chassis.min.css` (0.3 KB gzipped), counted in the sizes of the container-query changeset
