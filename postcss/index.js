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
 * Without this step, the JS plugins that read `--cx-*` custom properties at
 * runtime (js/src/carousel.ts's `--cx-carousel-interval`,
 * js/src/nav-overflow.ts's `--cx-breakpoint-*`, js/src/strength.ts's
 * `--cx-strength-color`) silently read nothing.
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
export function chassisPrefix({ tailwind = false } = {}) {
  if (!tailwind) {
    return postcssPrefixCustomProperties({ prefix: 'cx-', ignore: [/^--cx-/] })
  }
  // `breakpoint`/`container` are deliberately NOT in this ignore list: the
  // shield above already renamed the two real Tailwind-theme instances out
  // of reach, so a blanket ignore here would otherwise also spare Chassis's
  // own same-named `:root` declaration (the bug this preset exists to fix).
  const prefixer = postcssPrefixCustomProperties({
    prefix: 'cx-',
    ignore: [/^--cx-/, /^--(tw|color)-/, /^--\*$/]
  })
  // A "plugin pack" (postcssPlugin + a plugins array) so this composes as a
  // single array entry wherever chassisPrefix() is used, the same as the
  // non-Tailwind branch's single plugin.
  return {
    postcssPlugin: 'chassis-prefix-tailwind',
    plugins: [shieldTailwindThemeNames, prefixer, unshieldTailwindThemeNames]
  }
}

// The full plugin list for a project's own PostCSS config (a plain
// `postcss.config.js`/`postcss.config.mjs`, or a bundler's PostCSS loader
// options) — pass `tailwind: true` when compiling the Tailwind entry point.
// No autoprefixer here: a project's own build already runs one (or, for the
// Tailwind entry, Lightning CSS handles vendor prefixes in the consumer's
// own build) — see build/postcss.config.js for where Chassis's own
// non-Tailwind build adds it.
export function chassisPostcss({ tailwind = false } = {}) {
  return [chassisPrefix({ tailwind }), mergeLayerBlocks]
}
