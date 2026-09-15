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

// Tailwind reads theme keys by their exact names, so every custom property
// declared directly inside a source `@theme { ... }` at-rule has to reach its
// compiler unprefixed: Chassis's own `--*: initial` reset and
// `--breakpoint-*`/`--container-*` (scss/tailwind/theme.scss), the opt-in
// bridge's `--color-*`, and any `--font-*`, `--spacing`, ... a project adds to
// its own `@theme`. A plain property-name `ignore` pattern can't express that:
// `--breakpoint-*`/`--container-*` ALSO name a real, unrelated Chassis custom
// property (scss/_root.scss's plain `:root { --breakpoint-<name>: ...; }`,
// read at runtime through js/src/util/index.ts's `cssVar()`), which must still
// be prefixed. So theme keys are shielded by context instead.
function isThemeAtRule(parent) {
  return parent?.type === 'atrule' && parent.name === 'theme'
}

// Once Tailwind's compiler has run, the resolved theme sits in a
// `:root, :host { ... }` rule. Only the two names that collide with Chassis's
// own are shielded there; any other theme variable is prefixed together with
// its `var()` references, which keeps a preset that runs after Tailwind
// consistent.
function isCompiledThemeRule(parent) {
  return parent?.type === 'rule' && parent.selector === ':root, :host'
}

const TAILWIND_THEME_PROP_NAMES = /^--(breakpoint|container)-/
// An already-ignored prefix (`--tw-*`), reused as the shield namespace so a
// single `ignore` pattern still does the real work; the shield/unshield
// pair here only needs to move a name in and out of that pattern's reach.
const SHIELD_PREFIX = '--tw-shield'
const shield = (name) => name.replace(/^--/, `${SHIELD_PREFIX}-`)
const VAR_REFERENCE = /var\(\s*(--[\w-]+)/g

// Sits directly before `postcssPrefixCustomProperties` in the Tailwind
// plugin list: renames theme keys (and `var()` references to them, e.g. a
// project's `--radius-card: var(--radius-lg)`) out of the prefixer's reach.
// A reference is left alone when its name is also declared outside `@theme`
// in the same stylesheet, or is one of the `--breakpoint-*`/`--container-*`
// names: those references point at Chassis's own tokens.
const shieldTailwindThemeNames = {
  postcssPlugin: 'chassis-shield-tailwind-theme-names',
  Once(root) {
    const themeKeys = new Set()
    const plainNames = new Set()
    root.walkDecls(/^--/, (decl) => {
      if (isThemeAtRule(decl.parent)) {
        themeKeys.add(decl.prop)
        decl.prop = shield(decl.prop)
      } else if (isCompiledThemeRule(decl.parent) && TAILWIND_THEME_PROP_NAMES.test(decl.prop)) {
        decl.prop = shield(decl.prop)
      } else {
        plainNames.add(decl.prop)
      }
    })

    const shieldedReferences = [...themeKeys].filter(
      (name) => !plainNames.has(name) && !TAILWIND_THEME_PROP_NAMES.test(name)
    )
    if (shieldedReferences.length === 0) return

    const references = new Set(shieldedReferences)
    root.walkDecls((decl) => {
      if (!decl.value.includes('var(')) return
      decl.value = decl.value.replace(VAR_REFERENCE, (match, name) =>
        references.has(name) ? match.replace(name, shield(name)) : match
      )
    })
  }
}

// Sits directly after `postcssPrefixCustomProperties`: restores the real
// names once the general prefixer's pass (which skips anything under
// `--tw-*`) is safely behind it.
const unshieldTailwindThemeNames = {
  postcssPlugin: 'chassis-unshield-tailwind-theme-names',
  Once(root) {
    const shielded = new RegExp(`${SHIELD_PREFIX}-`, 'g')
    root.walkDecls((decl) => {
      if (decl.prop.startsWith(`${SHIELD_PREFIX}-`)) {
        decl.prop = decl.prop.replace(shielded, '--')
      }
      if (decl.value.includes(SHIELD_PREFIX)) {
        decl.value = decl.value.replace(shielded, '--')
      }
    })
  }
}

// The one custom property the prefixer never renames. `writePrefixMarker`
// adds it to every stylesheet the preset prefixes, set to this preset's own
// `prefix` — the Sass source never declares it, so the prefix lives in
// exactly one place. The JS plugins read it at runtime
// (js/src/util/index.ts's `cssVar()`), so they find
// `--<prefix>carousel-interval` and friends under whatever prefix this preset
// was given — including prebuilt `dist/js` paired with a custom-prefix CSS
// build, which can't be rebuilt to match.
const PREFIX_MARKER = '--chassis-prefix'

// A custom-property name segment ending in a separator: a letter, then
// letters, digits, `-` or `_`, ending in `-` or `_`. Without the trailing
// separator the prefix fuses with the name (`acme` + `--primary` gives
// `--acmeprimary`), and the already-prefixed check in `chassisPrefix()` would
// skip unrelated names (`b` would skip every `--bg-*`). Checked up front
// because the prefix is also interpolated into a RegExp and written verbatim
// as a CSS value.
const VALID_PREFIX = /^[a-z][\w-]*[-_]$/i

// A `:root` rule nested only in `@layer` blocks always applies; one inside
// `@media` or `@supports` (reboot's `prefers-reduced-motion` block) doesn't,
// so a marker there would vanish for some visitors.
function isUnconditional(rule) {
  for (let parent = rule.parent; parent && parent.type !== 'root'; parent = parent.parent) {
    if (parent.type !== 'atrule' || parent.name !== 'layer') return false
  }
  return true
}

// Writes the marker into the stylesheet's first unconditional `:root` rule.
// A stylesheet without one (e.g. a component-only file) that still uses
// prefixed names gets a `:root` rule appended for it, so the JS never pairs
// prefixed CSS with plain names. A stylesheet with no prefixed names gets no
// marker. An existing marker is updated in place, so a second pass never
// duplicates it; one left in a conditional block is moved.
function writePrefixMarker(prefix) {
  const prefixed = `--${prefix}`
  return {
    postcssPlugin: 'chassis-prefix-marker',
    Once(root, { Declaration, Rule }) {
      let found = false
      root.walkDecls(PREFIX_MARKER, (decl) => {
        if (!found && decl.parent.type === 'rule' && isUnconditional(decl.parent)) {
          decl.value = prefix
          found = true
        } else {
          decl.remove()
        }
      })
      if (found) return

      let target
      root.walkRules((rule) => {
        if (rule.selector.trim() !== ':root' || !isUnconditional(rule)) return
        target = rule
        return false
      })

      if (!target) {
        let usesPrefix = false
        root.walkDecls((decl) => {
          if (decl.prop.startsWith(prefixed) || decl.value.includes(`var(${prefixed}`)) {
            usesPrefix = true
            return false
          }
        })
        if (!usesPrefix) return
        target = new Rule({ selector: ':root', raws: { between: ' ' } })
        root.append(target)
      }

      target.prepend(new Declaration({ prop: PREFIX_MARKER, value: prefix }))
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
// `tailwind: true` also protects Tailwind's own names from being renamed:
// every key declared in an `@theme` block (and references to it), `--tw-*`
// runtime variables, and `--color-*`, which Tailwind utilities reference by
// name. Values that reference a Chassis token (`var(--primary)`) are prefixed
// the same way either way. Every other custom property in the processed CSS
// is prefixed, a project's own included. Run it BEFORE Tailwind's own
// compiler, matching how Chassis's own prebuilt `dist/tailwind/*.css` is
// produced: afterwards, theme variables a project reads by name
// (`var(--spacing)`) would be prefixed too.
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
        'starting with a letter and ending in "-" or "_" (e.g. "cx-")'
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
  // shield above already renamed the Tailwind-theme instances out of reach,
  // so a blanket ignore here would otherwise also spare Chassis's own
  // same-named `:root` declaration.
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
