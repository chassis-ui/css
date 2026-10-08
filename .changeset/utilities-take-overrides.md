---
'@chassis-ui/css': patch
---

`$utilities-overrides` changes the default utilities of a build that loads the complete framework. It is a map of `scss/utilities`, empty by default and merged over `$utilities`:

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

- `null` removes a utility; removing a name the map does not have compiles with a warning
- a map under the name of a utility is merged into its definition, option by option, so `(responsive: true)` is a complete override. A changed utility keeps its place in the `utilities` layer
- `values` is merged with the default values when the override gives a map: a new key adds a class, the key of a default value changes it, and `null` removes the class. A list replaces the values
- a map under a new name adds a utility after the default ones. It needs `property` and `values`, and the compile stops without them, which also catches a misspelled name
- the rule goes before `@use "@chassis-ui/css/scss/chassis"` and after a `@use "@chassis-ui/css/scss/config" with (…)`; in another place Sass stops with an error
- the overrides are merged over a configured `$utilities` map too, and reach `scss/tailwind` compiled with Sass. The prebuilt `dist/tailwind/` files and `tailwind/merge.js` are built from the default map

Nothing changes for a build without the variable: `dist/css/` and `dist/tailwind/` are the same files.
