/*!
 * Chassis CSS — PostCSS Preset
 *
 * The `--cx-` custom-property prefix (see scss/config/_settings.scss) is
 * applied by PostCSS, not Sass — every component writes plain `--foo`
 * literals in its source, and the prefix is added once, here, rather than
 * baked into every declaration by hand. Chassis's own build
 * (build/postcss.config.js, build/tailwind/postcss.tailwind.config.js) imports this
 * preset instead of duplicating it; a project compiling Chassis from source
 * — with or without the Tailwind entry point — needs the same step, so it's
 * published as `@chassis-ui/css/postcss`.
 *
 * Without this step, the JS plugins that read prefixed custom properties at
 * runtime (js/src/carousel.ts's `--cx-carousel-interval`,
 * js/src/nav-overflow.ts's `--cx-breakpoint-*`, js/src/strength.ts's
 * `--cx-strength-color`) silently read nothing. They resolve those names
 * through the `--chassis-prefix` marker this preset writes, so a custom
 * `prefix` needs no matching change on the JS side.
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import postcssPrefixCustomProperties from 'postcss-prefix-custom-properties'

// Merges consecutive (and non-consecutive) top-level `@layer` blocks that
// share the same name into a single block. The CSS cascade is unaffected —
// the spec already treats multiple same-named `@layer` blocks as one layer —
// this only makes the output cleaner and smaller. Harmless to include even
// when nothing needs it, so the Chassis build and the public preset share
// one instance rather than each defining their own.
export const mergeLayerBlocks = {
  postcssPlugin: 'postcss-merge-layer-blocks',
  OnceExit(root) {
    const seen = new Map()
    for (const node of [...root.nodes]) {
      if (node.type !== 'atrule' || node.name !== 'layer' || !node.nodes) continue
      const key = node.params
      if (seen.has(key)) {
        const first = seen.get(key)
        node.each((child) => first.append(child.clone()))
        node.remove()
      } else {
        seen.set(key, node)
      }
    }
  }
}

// `--breakpoint-*`/`--container-*` name a collision `ignore` can't resolve
// by pattern alone: Tailwind's OWN theme declares them (inside a source
// `@theme { ... }` at-rule, or — once Tailwind's compiler has run — inside
// a `:root, :host { ... }` rule) and must keep them unprefixed so Tailwind's
// compiler still recognizes them as theme keys; but scss/_root.scss ALSO
// emits a real, unrelated Chassis custom property of the SAME name (plain
// `:root { --breakpoint-<name>: ...; }`), read at runtime by
// js/src/nav-overflow.ts as `--cx-breakpoint-<name>` — which a plain
// property-name `ignore` pattern would leave un-prefixed too, silently
// breaking that read. Scoped to the two contexts Tailwind's own theme
// values actually appear in; Chassis's plain `:root { ... }` declaration
// doesn't match either, so it's prefixed normally like everything else.
function isTailwindThemeContext(parent) {
  if (!parent) return false
  if (parent.type === 'atrule' && parent.name === 'theme') return true
  return parent.type === 'rule' && parent.selector === ':root, :host'
}

const TAILWIND_THEME_PROP_NAMES = /^--(breakpoint|container)-/
// An already-ignored prefix (`--tw-*`), reused as the shield namespace so a
// single `ignore` pattern still does the real work; the shield/unshield
// pair here only needs to move a name in and out of that pattern's reach.
const SHIELD_PREFIX = '--tw-shield'

// Sits directly before `postcssPrefixCustomProperties` in the Tailwind
// plugin list: temporarily renames a same-named Tailwind theme declaration
// out of the way so the general-purpose prefixer's plain regex `ignore`
// can't tell it apart from Chassis's own `--breakpoint-*`/`--container-*` —
// there's currently no `var(--breakpoint-*)` / `var(--container-*)`
// REFERENCE anywhere in Chassis's own output (Tailwind resolves breakpoints
// into `@media` queries at compile time, not a runtime `var()` read), so
// only the declaration itself needs shielding today.
const shieldTailwindThemeNames = {
  postcssPlugin: 'chassis-shield-tailwind-theme-names',
  Once(root) {
    root.walkDecls(TAILWIND_THEME_PROP_NAMES, (decl) => {
      if (isTailwindThemeContext(decl.parent)) {
        decl.prop = decl.prop.replace('--', `${SHIELD_PREFIX}-`)
      }
    })
  }
}

// Sits directly after `postcssPrefixCustomProperties`: restores the real
// name once the general prefixer's pass (which skips anything under
// `--tw-*`) is safely behind it.
const unshieldTailwindThemeNames = {
  postcssPlugin: 'chassis-unshield-tailwind-theme-names',
  Once(root) {
    root.walkDecls(new RegExp(`^${SHIELD_PREFIX}-`), (decl) => {
      decl.prop = decl.prop.replace(`${SHIELD_PREFIX}-`, '--')
    })
  }
}

// The one custom property the prefixer never renames. `writePrefixMarker`
// adds it to the stylesheet's first plain `:root` rule, set to this preset's
// own `prefix` — the Sass source never declares it, so the prefix lives in
// exactly one place. The JS plugins read it at runtime
// (js/src/util/index.ts's `cssVar()`), so they find
// `--<prefix>carousel-interval` and friends under whatever prefix this preset
// was given — including prebuilt `dist/js` paired with a custom-prefix CSS
// build, which can't be rebuilt to match.
const PREFIX_MARKER = '--chassis-prefix'

// A custom-property name segment: a letter, then letters, digits, `-` or `_`.
// Checked up front because the prefix is also interpolated into a RegExp and
// written verbatim as a CSS value.
const VALID_PREFIX = /^[a-z][\w-]*$/i

// Stylesheets without a plain `:root` rule (e.g. a component-only file) get
// no marker; the runtime properties the JS reads all live in one that does.
// An existing marker is updated in place, so a second pass never duplicates it.
function writePrefixMarker(prefix) {
  return {
    postcssPlugin: 'chassis-prefix-marker',
    Once(root, { Declaration }) {
      let found = false
      root.walkDecls(PREFIX_MARKER, (decl) => {
        decl.value = prefix
        found = true
      })
      if (found) return

      root.walkRules((rule) => {
        if (rule.selector.trim() !== ':root') return
        rule.prepend(new Declaration({ prop: PREFIX_MARKER, value: prefix }))
        return false
      })
    }
  }
}

// `prefix` renames the namespace (default `cx-`, so `--primary` becomes
// `--cx-primary`). `prefix: ''` keeps Sass's plain names and writes no marker
// (removing any stale one), so the JS plugins read the plain names too — the
// same result as skipping this preset. Not allowed with `tailwind: true`:
// Chassis's plain `--breakpoint-*`/`--container-*`/`--color-*` would share
// names with Tailwind's own theme keys.
//
// `tailwind: true` also protects Tailwind's own theme namespaces —
// `@theme { --*: initial; --breakpoint-*; --container-*; }`, `--tw-*`
// runtime variables, and (for the opt-in token bridge,
// scss/tailwind/bridge.scss) the `--color-*` theme keys it declares — from
// being renamed to `--cx-*`, which would stop Tailwind's compiler from
// recognizing them as theme keys. Values that reference a Chassis token
// (`var(--primary)`) are never exempted, prefixed the same way either way.
// Verified empirically to work whether this preset runs before or after
// Tailwind's own compiler (see the Tailwind docs guide's "Build" step);
// prefer running it BEFORE, matching how Chassis's own prebuilt
// `dist/tailwind/*.css` is produced.
export function chassisPrefix({ prefix = 'cx-', tailwind = false } = {}) {
  if (prefix === '') {
    if (tailwind) {
      throw new Error(
        "chassisPrefix: `prefix: ''` can't be used with `tailwind: true` — Chassis's plain " +
          "--breakpoint-*, --container-* and --color-* names collide with Tailwind's theme keys"
      )
    }
    return {
      postcssPlugin: 'chassis-prefix',
      plugins: [
        {
          postcssPlugin: 'chassis-prefix-marker-remove',
          Once(root) {
            root.walkDecls(PREFIX_MARKER, (decl) => {
              decl.remove()
            })
          }
        }
      ]
    }
  }
  if (typeof prefix !== 'string' || !VALID_PREFIX.test(prefix)) {
    throw new TypeError(
      `chassisPrefix: invalid prefix ${JSON.stringify(prefix)} — use letters, digits, "-" or "_", ` +
        'starting with a letter (e.g. "cx-")'
    )
  }
  // Names already carrying the prefix are skipped, so running the preset
  // twice over the same CSS is a no-op.
  const ownPrefix = new RegExp(`^--${prefix}`)
  const marker = new RegExp(`^${PREFIX_MARKER}$`)

  if (!tailwind) {
    // A "plugin pack" (postcssPlugin + a plugins array) so this composes as
    // a single array entry wherever chassisPrefix() is used.
    return {
      postcssPlugin: 'chassis-prefix',
      plugins: [
        postcssPrefixCustomProperties({ prefix, ignore: [ownPrefix, marker] }),
        writePrefixMarker(prefix)
      ]
    }
  }
  // `breakpoint`/`container` are deliberately NOT in this ignore list: the
  // shield above already renamed the two real Tailwind-theme instances out
  // of reach, so a blanket ignore here would otherwise also spare Chassis's
  // own same-named `:root` declaration (the bug this preset exists to fix).
  const prefixer = postcssPrefixCustomProperties({
    prefix,
    ignore: [ownPrefix, marker, /^--(tw|color)-/, /^--\*$/]
  })
  return {
    postcssPlugin: 'chassis-prefix-tailwind',
    plugins: [
      shieldTailwindThemeNames,
      prefixer,
      unshieldTailwindThemeNames,
      writePrefixMarker(prefix)
    ]
  }
}

// The full plugin list for a project's own PostCSS config (a plain
// `postcss.config.js`/`postcss.config.mjs`, or a bundler's PostCSS loader
// options) — pass `tailwind: true` when compiling the Tailwind entry point.
// No autoprefixer here: a project's own build already runs one (or, for the
// Tailwind entry, Lightning CSS handles vendor prefixes in the consumer's
// own build) — see build/postcss.config.js for where Chassis's own
// non-Tailwind build adds it.
export function chassisPostcss({ prefix, tailwind = false } = {}) {
  return [chassisPrefix({ prefix, tailwind }), mergeLayerBlocks]
}
