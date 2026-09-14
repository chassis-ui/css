#!/usr/bin/env node

/*!
 * test-build.mjs — Node-only (no browser) regression test for the Tailwind
 * build (`dist/tailwind/`). Compiles `fixture/app.css` — exactly what a
 * Tailwind CSS v4 consumer of @chassis-ui/css writes — against the
 * candidates extracted from `fixture/page.html`, using the real
 * `@tailwindcss/node` compiler, then asserts on the output text: the
 * Chassis/Tailwind layer order, the theme reset surviving the `--cx-`
 * prefixer untouched, representative utilities and variants, the Phase 4
 * component-clash exclusions, and the Phase 5 utility-name clash remedies.
 *
 * Run via `pnpm css:test:tailwind` (wired into `pnpm test`).
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import { compile } from '@tailwindcss/node'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { before, describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import * as sass from 'sass'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../..')
const fixtureDir = path.join(here, 'fixture')

function extractClasses(html) {
  const found = new Set()
  const re = /class="([^"]+)"/g
  let m
  while ((m = re.exec(html))) {
    for (const cls of m[1].split(/\s+/)) if (cls) found.add(cls)
  }
  return [...found].sort()
}

// Matches every top-level `.name { ... }` occurrence for a candidate,
// including variant-prefixed / @-prefixed forms (`dark:`, `lg:`, `@md:`
// escape to `\:` / `\@` in the compiled selector). The lookbehind requires
// the class token to open a new selector, not sit inside a larger one (a
// child-selector utility like `space-x-md` compiles to
// `:where(.space-x-md > ...) { ... }`, which correctly does NOT match here —
// see `findChildSelectorRule` below for that shape instead). Tailwind can
// serialize a same-name merge as either one rule with multiple declarations
// or two separate adjacent rules with the same selector (both observed
// empirically); callers that need the full effective declaration set must
// collect every match, not just the first.
function findAllRules(built, name) {
  const escaped = name
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:/g, '\\\\:')
    .replace(/@/g, '\\\\@')
  const re = new RegExp(`(?<=^|[{}])\\s*\\.${escaped}(?:[^\\n{]*)\\{([^}]*)\\}`, 'g')
  return [...built.matchAll(re)].map((m) => m[1])
}

// Asserts `selectorFragment` appears somewhere inside the named at-rule
// block, without requiring it to be the block's first rule (other
// candidates sharing the same breakpoint can legitimately land before it).
function assertWrapped(built, atRuleHeader, selectorFragment) {
  // Bounded lazy match: other candidates sharing the same breakpoint can
  // legitimately land before the target rule, but the window is capped so a
  // removed/renamed rule can't accidentally match some unrelated later block.
  const re = new RegExp(`${atRuleHeader}\\s*\\{[\\s\\S]{0,300}?${selectorFragment}`)
  assert.match(built, re, `expected ${selectorFragment} inside ${atRuleHeader} { ... }`)
}

// Like findAllRules, but excludes compound matches (`.lg\:font-xl.font-display`
// would otherwise also match a `findAllRules(built, 'lg:font-xl')` search,
// since dotted-compound suffixes fall inside its `[^\n{]*` prefix span) --
// use this where a compound sibling rule could shadow the exact class's own
// winning value.
function findExactRule(built, name) {
  const escaped = name
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:/g, '\\\\:')
    .replace(/@/g, '\\\\@')
  const re = new RegExp(`(?<=^|[{}])\\s*\\.${escaped}\\s*\\{([^}]*)\\}`, 'g')
  return [...built.matchAll(re)].map((m) => m[1])
}

function findChildSelectorRule(built, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // The `:not(:last-child))`-shaped tail has its own parens, so match
  // anything up to the rule's opening brace rather than trying to balance
  // parens by hand.
  const re = new RegExp(`:where\\(\\.${escaped}[^{]*\\{([^}]*)\\}`)
  return built.match(re)?.[1] ?? null
}

function parseDecls(body) {
  const decls = []
  for (const decl of (body ?? '').split(';')) {
    const t = decl.trim()
    if (!t) continue
    const colon = t.indexOf(':')
    if (colon === -1) continue
    decls.push([t.slice(0, colon).trim(), t.slice(colon + 1).trim()])
  }
  return decls
}

// Cascade winner per property across every rule body passed in, in order;
// an `!important` declaration beats a later plain one for the same
// property, matching real browser behavior for same-specificity rules.
function winningValues(bodies) {
  const state = new Map()
  for (const body of bodies) {
    for (const [prop, rawValue] of parseDecls(body)) {
      const important = /!important\s*$/i.test(rawValue.trim())
      const value = rawValue.replace(/!important\s*$/i, '').trim()
      const existing = state.get(prop)
      if (existing?.important && !important) continue
      state.set(prop, { value, important })
    }
  }
  const flat = new Map()
  for (const [prop, { value }] of state) flat.set(prop, value)
  return flat
}

let built

before(async () => {
  const appCss = readFileSync(path.join(fixtureDir, 'app.css'), 'utf8')
  const pageHtml = readFileSync(path.join(fixtureDir, 'page.html'), 'utf8')
  const candidates = extractClasses(pageHtml)
  const compiler = await compile(appCss, { base: fixtureDir, onDependency: () => {} })
  built = compiler.build(candidates)
})

describe('tailwind fixture build', () => {
  test('the Chassis layer statement is first, in order, ahead of any generated rule', () => {
    const chassisLayerStatement =
      '@layer theme, colors, config, root, base, reboot, layout, content, components, custom, helpers, utilities;'
    const layerIndex = built.indexOf(chassisLayerStatement)
    assert.ok(layerIndex > 0, 'expected the Chassis layer-order statement in the output')
    // Tailwind may prepend its own version banner and append an unrelated
    // `@layer properties;` line (registration for `@property` fallbacks) --
    // neither reorders anything, so only generated rule content is checked
    // against, not literal first-line position.
    const firstUtilityRuleIndex = built.indexOf('.button {')
    assert.ok(
      firstUtilityRuleIndex > 0,
      'expected to find a generated component rule to compare against'
    )
    assert.ok(
      layerIndex < firstUtilityRuleIndex,
      'the layer statement must precede generated rules'
    )
  })

  test('a direct Sass compile of the Tailwind entry starts with the layer order (custom-token consumer path)', () => {
    // Consumers with their own chassis-tokens compile `scss/tailwind/index.scss`
    // themselves, without build-tailwind.mjs. Sass hoists any `@import` above
    // the `@layer` statement, so the entry must not contain one.
    const { css } = sass.compile(path.join(root, 'scss/tailwind/index.scss'), {
      loadPaths: [path.join(root, 'scss/vendor'), path.join(root, 'node_modules')]
    })
    assert.doesNotMatch(
      css,
      /@import\b/,
      'the Sass-compiled Tailwind entry must not contain @import'
    )
    const firstStatement = css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*@charset "[^"]*";/, '')
      .trim()
      .split(';')[0]
    assert.equal(
      `${firstStatement};`,
      '@layer theme, colors, config, root, base, reboot, layout, content, components, custom, helpers, utilities;'
    )
  })

  test("the Tailwind layer order keeps Chassis's own layers in their regular-build order", () => {
    const layerList = (css) => css.match(/@layer ([\w-]+(?:\s*,\s*[\w-]+)+);/)?.[1].split(/\s*,\s*/)
    const tailwindLayers = layerList(
      readFileSync(path.join(root, 'dist/tailwind/layers.css'), 'utf8')
    )
    const chassisLayers = layerList(readFileSync(path.join(root, 'dist/css/chassis.css'), 'utf8'))
    assert.ok(tailwindLayers && chassisLayers, 'expected a layer-order statement in both builds')
    // `theme` is shared with Tailwind's own theme layer, which the Tailwind
    // build places first; `base` is Tailwind-only.
    const shared = (layers) =>
      layers.filter((name) => name !== 'theme' && chassisLayers.includes(name))
    assert.deepEqual(shared(tailwindLayers), shared(chassisLayers))
    assert.equal(tailwindLayers.at(-1), 'utilities')
  })

  test('theme variables are emitted inside the theme layer, not unlayered', () => {
    // Unlayered custom properties would outrank every Chassis layer. Tailwind
    // only emits the theme variables the candidates use.
    assert.match(built, /@layer theme\s*\{\s*:root, :host\s*\{[^}]*--container-[a-z0-9]+:/)
    assert.doesNotMatch(built, /^:root, :host\s*\{/m)
  })

  test('the theme reset survives the --cx- custom-property prefixer untouched', () => {
    // `--*: initial` is a build-time instruction to Tailwind's theme
    // resolver -- it does not appear in the compiled OUTPUT (Tailwind only
    // emits the specific `--container-*` etc. keys actually referenced by
    // generated utilities), so this checks the intermediate build artifact
    // (`dist/tailwind/theme.css`) that `compile()` consumes, not `built`.
    const themeCss = readFileSync(path.join(root, 'dist/tailwind/theme.css'), 'utf8')
    assert.match(themeCss, /--\*:\s*initial/, 'expected the literal `--*: initial` theme reset')
    assert.match(themeCss, /--breakpoint-sm:\s*36rem/, 'expected unprefixed --breakpoint-sm')
    assert.doesNotMatch(themeCss, /--cx-breakpoint-/, 'the prefixer must not touch --breakpoint-*')
    assert.doesNotMatch(
      themeCss,
      /--cx-\\?\*/,
      'the prefixer must not touch the --*: initial reset'
    )
  })

  test('a plain utility carries its Chassis token value', () => {
    const decls = winningValues(findAllRules(built, 'fg-primary'))
    assert.equal(decls.get('color'), 'var(--cx-fg-color)')
  })

  test('the dark: variant covers self-attribute, descendant, and media-query branches', () => {
    const rules = findAllRules(built, 'dark:fg-primary')
    assert.equal(rules.length, 3, 'expected the self / nearest-descendant / media branches')
    for (const body of rules) {
      assert.equal(winningValues([body]).get('color'), 'var(--cx-fg-color)')
    }
  })

  test('a responsive variant resolves to the Chassis breakpoint and carries the right value', () => {
    assertWrapped(built, String.raw`@media \(width >= 64rem\)`, String.raw`\.lg\\:font-xl \{`)
    const decls = winningValues(findExactRule(built, 'lg:font-xl'))
    assert.equal(
      decls.get('font-size'),
      'var(--cx-font-size-xl)',
      "lg: should use the Chassis breakpoint (64rem), not Tailwind's 80rem default"
    )
  })

  test('a negative-value responsive utility resolves correctly', () => {
    assertWrapped(built, String.raw`@media \(width >= 48rem\)`, String.raw`\.md\\:-mt-md \{`)
    const decls = winningValues(findAllRules(built, 'md:-mt-md'))
    assert.equal(decls.get('margin-block-start'), 'calc(-1 * var(--cx-space-md))')
  })

  test("hover: uses Tailwind's default @media (hover: hover) wrapping (D3)", () => {
    assertWrapped(
      built,
      String.raw`@media \(hover: hover\)`,
      String.raw`\.hover\\:shadow-lg:hover \{`
    )
  })

  test('print: needs no Chassis-side variant code', () => {
    const decls = winningValues(findAllRules(built, 'print:d-none'))
    assert.equal(decls.get('display'), 'none')
  })

  test('the @md: container variant resolves to the Chassis container breakpoint', () => {
    assertWrapped(built, String.raw`@container \(width >= 48rem\)`, String.raw`\.\\@md\\:d-flex \{`)
    const decls = winningValues(findAllRules(built, '@md:d-flex'))
    assert.equal(decls.get('display'), 'flex')
  })

  test('a child-selector utility compiles to :where(.name > ...), not a plain class rule', () => {
    assert.equal(findAllRules(built, 'space-x-md').length, 0)
    const body = findChildSelectorRule(built, 'space-x-md')
    assert.ok(body, 'expected a :where(.space-x-md > ...) rule')
    assert.match(body, /margin-inline-end/)
    assertWrapped(
      built,
      String.raw`@media \(width >= 64rem\)`,
      String.raw`:where\(\.lg\\:space-x-md > `
    )
  })

  test("a dotted-compound utility merges into the base name's @utility (fact 5)", () => {
    const rules = findAllRules(built, 'font-5xl')
    assert.ok(rules.some((body) => /font-size:\s*var\(--cx-font-size-5xl\)/.test(body)))
    const compound = findAllRules(built, 'font-5xl.font-display')
    assert.ok(compound.length > 0)
    assert.match(compound[0], /font-size:\s*var\(--cx-font-size-display-5xl\)/)
  })

  test('component/reboot names excluded from Tailwind core have no core declarations (Phase 4)', () => {
    assert.doesNotMatch(
      built,
      /outline-style/,
      '"outline" must not pick up Tailwind\'s core outline utility'
    )
    assert.doesNotMatch(
      built,
      /visibility: collapse/,
      '"collapse" must not pick up Tailwind\'s core visibility utility'
    )
    const col6 = winningValues(findAllRules(built, 'col-6'))
    assert.equal(
      col6.get('flex'),
      '0 0 auto',
      '"col-6" must stay Chassis\'s flex grid, not Tailwind\'s CSS grid-column'
    )
    const containerRules = findAllRules(built, 'container').join(' ')
    for (const tailwindDefault of ['16rem', '20rem', '24rem', '28rem', '56rem', '72rem']) {
      assert.ok(
        !containerRules.includes(tailwindDefault),
        `Tailwind's default container scale (${tailwindDefault}) must not appear`
      )
    }
  })

  test("Phase 5 !important-remedied utilities keep Chassis's value as the cascade winner", () => {
    const policy = JSON.parse(
      readFileSync(path.join(root, 'build/tailwind-utility-clashes.json'), 'utf8')
    )
    const sample = policy.differs.filter((entry) => entry.remedy === 'important')
    assert.ok(sample.length > 0, 'expected at least one !important-remedied policy entry to check')
    for (const { name, properties } of sample) {
      if (
        ![
          'opacity-10',
          'grid-cols-2',
          'w-lg',
          'rounded-full',
          'order-first',
          'bg-transparent',
          'underline-offset-1'
        ].includes(name)
      ) {
        continue // only the names present in fixture/page.html
      }
      const rules = findAllRules(built, name)
      assert.ok(rules.length > 0, `expected @utility ${name} to generate`)
      const winners = winningValues(rules)
      for (const property of properties) {
        const importantDecl = rules.some((body) =>
          new RegExp(`${property}\\s*:[^;]*!important`).test(body)
        )
        assert.ok(importantDecl, `expected an !important declaration for "${property}" on ${name}`)
        assert.ok(winners.get(property), `expected a winning value for "${property}" on ${name}`)
      }
    }
  })

  test('a documented-only utility keeps its harmless leaked property (Phase 5)', () => {
    const border = winningValues(findAllRules(built, 'border'))
    assert.equal(
      border.get('border'),
      'var(--cx-border-width) var(--cx-border-style) var(--cx-border-color)'
    )
  })

  test('the dist/tailwind/utility-clashes.json build report matches the committed policy', () => {
    const policy = JSON.parse(
      readFileSync(path.join(root, 'build/tailwind-utility-clashes.json'), 'utf8')
    )
    const report = JSON.parse(
      readFileSync(path.join(root, 'dist/tailwind/utility-clashes.json'), 'utf8')
    )
    assert.equal(report.equal, policy.equal.length)
    assert.equal(report.sameNameClashesChecked, policy.equal.length + policy.differs.length)
    assert.deepEqual(
      report.differs.map((d) => d.name).sort(),
      policy.differs.map((d) => d.name).sort(),
      'dist/tailwind/utility-clashes.json is stale — re-run `pnpm css:tailwind` (or `pnpm dist`)'
    )
  })
})
