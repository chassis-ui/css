---
'@chassis-ui/css': patch
---

The Tailwind entry has an opt-in safelist for class names built at runtime: `@chassis-ui/css/tailwind/safelist.css`, or `@use "@chassis-ui/css/scss/tailwind/safelist"` in a Sass build, loaded after the entry.

Tailwind generates a class only where its scanner finds the whole name in a source file, so a name that JavaScript joins from parts (`` `col-span-${span}` ``, the responsive props of `@chassis-ui/react`) had no rule, with no warning. The safelist is a list of `@source inline()` rules for the responsive layout classes: the placement classes of `.grid`, and `grid-cols-*`, `grid-rows-*`, `grid-flow-*`, `gap-*`, `row-gap-*`, `column-gap-*`, the flex directions and wraps, `flex-fill`, `justify-content-*`, `align-items-*`, `align-content-*` and the `w-*` fractions. Each is listed without a prefix, with the `sm:`–`2xl:` prefixes and with the `@sm:`–`@2xl:` prefixes. Compiled from Sass it follows `$breakpoints`, `$grid-columns`, `$grid-rows`, `$utilities-overrides`, `$enable-grid-system` and `$enable-container-queries`, and `$safelist-utilities-extra` adds the keys of more utilities to the ones of `$safelist-utilities`.

The default entry is unchanged and still generates a class only where a project writes it, as every utility outside the list is. With the default settings the safelist adds about 80 KB to the minified CSS of a project (9 KB gzipped).
