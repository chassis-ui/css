# Versioning and deprecation

`@chassis-ui/css` follows [Semantic Versioning](https://semver.org/). This doc says what its public
API is, which version bump a change needs, and how a breaking change is prepared. The release steps
themselves are in [CONTRIBUTING.md](.github/CONTRIBUTING.md#releases).

## Public API

Projects depend on more than the JavaScript exports. All of these are public:

- **Class names**: component, modifier, utility and helper classes, and their prefixed forms
  (`md:d-none`, `lg:col-6`, `dark:d-none`, `print:d-none`).
- **Custom properties**: the `--cx-*` properties that `:root` and the components declare, and the
  ones a component reads so it can be restyled (`--cx-nav-link-gap`). The `cx-` prefix itself is
  an option of the PostCSS preset.
- **Sass**: the entry files (`scss/chassis.scss` and the other `chassis-*.scss`), the module paths
  a project can `@use` (`scss/config`, `scss/mixins`), every `!default` variable a project can
  configure with `@use … with (…)`, and the mixins, functions and maps the docs describe. Members
  that start with `-` or `_` are private to their module.
- **CSS layers**: the names and order of the layers declared in `scss/_root.scss`, since projects
  add their own rules to them.
- **Markup**: the structure the docs show for each component, the ARIA attributes the plugins
  set, and the `data-cx-*` attributes they read.
- **JavaScript**: the exports of `@chassis-ui/css` and `@chassis-ui/css/js/dist/*`, each plugin's
  options, methods, static members and event names, and the TypeScript declarations in
  `js/dist/*.d.ts`.
- **Package paths**: every path in the `exports` map of `packages/css/package.json`, the file
  names in `dist/`, the PostCSS preset (`@chassis-ui/css/postcss`), and the Tailwind entry
  (`@chassis-ui/css/tailwind`, its partials and `merge.js`).
- **Requirements**: the peer dependency ranges, `engines.node`, and the browsers in
  `.browserslistrc`.

Not public: the exact compiled CSS (selector order, how declarations are merged or minified), the
internal Sass placeholders (`%…`), undocumented classes and custom properties, the files in
`build/` and `packages/css/build/`, and where the package is in the repository: the paths above
are the ones inside the published package, which is `packages/css/` in the repository.

## Which bump

| Change                                                                                                                     | Bump  |
| -------------------------------------------------------------------------------------------------------------------------- | ----- |
| A fix that needs nothing from projects: a wrong value, a broken state, an accessibility fix that keeps the markup          | patch |
| Something new: a component, a variant, a utility, a custom property, a Sass variable, a plugin option or event             | minor |
| A renamed or removed class, custom property, Sass variable, mixin, function, layer, plugin option, method, event or export | major |
| Markup a component needs that it did not need before, or a changed default that alters how existing markup looks           | major |
| A narrower TypeScript type, a stricter peer dependency or `engines` range, a dropped browser version                       | major |
| A deprecation that keeps the old API working                                                                               | minor |

**While the version is `0.x`**, a change that would be major is released as a **minor**, and its
changeset starts with `**Breaking:**` and says what a project has to change. Other changes keep
their bump from the table. A `0.x` minor may therefore contain breaking changes, and the CHANGELOG
marks each one.

When unsure whether a change breaks, treat it as breaking. A needless `Breaking:` note costs a
line in the CHANGELOG; an unannounced one costs a project its build.

## Deprecation

A removal is announced before it happens, when the old and the new API can exist side by side:

1. **Deprecate in a minor release.** Keep the old name working next to the new one: a class as a
   second selector, a custom property as a fallback (`var(--cx-new, var(--cx-old))`), a Sass
   variable that feeds the new one and `@warn`s when a project configures it, a plugin option
   that is mapped to the new one. Mark it deprecated in the docs and, for JavaScript, with
   `@deprecated` in the TSDoc comment. The changeset names the replacement.
2. **Keep it for at least one minor release**, so projects see the notice before the removal.
3. **Remove it** in the next release that may break (a minor while `0.x`, a major after `1.0`),
   with a `**Breaking:**` changeset that restates what to use instead.

A change where both cannot coexist, such as new required markup, is released as breaking directly,
with the migration in its changeset.

## Prereleases

A prerelease is versioned with Changesets' pre mode on a branch that is merged into `main`:

```sh
pnpm changeset pre enter beta   # following version steps write 0.6.0-beta.0, 0.6.0-beta.1, …
pnpm changeset pre exit         # the next version step writes 0.6.0
```

The release workflow publishes a prerelease under the npm dist-tag of its identifier (`beta`), or
`next` when the identifier is a number, never `latest`. `npm install @chassis-ui/css` keeps
installing the last stable version.
