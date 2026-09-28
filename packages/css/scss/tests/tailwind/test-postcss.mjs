#!/usr/bin/env node

/*!
 * test-postcss.mjs — Node-only regression test for the public
 * `@chassis-ui/css/postcss` preset (postcss/index.js), independent of any
 * Sass compile.
 *
 * Covers the `--breakpoint-*`/`--container-*` name collision (Phase 10d):
 * Tailwind's own `@theme` values must stay unprefixed so its compiler still
 * recognizes them, but scss/_root.scss emits a REAL, unrelated Chassis
 * custom property of the same name, read at runtime by
 * js/src/nav-overflow.ts as `--cx-breakpoint-<name>` — a plain
 * property-name `ignore` pattern can't tell the two apart, so this asserts
 * the context-aware shield in postcss/index.js does.
 *
 * Run via `pnpm css:test:tailwind` (wired into `pnpm test`).
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import postcss from 'postcss'
import { chassisPostcss, chassisPrefix, mergeLayerBlocks } from '../../../postcss/index.js'

async function run(css, { tailwind, prefix } = {}) {
  const result = await postcss([chassisPrefix({ tailwind, prefix }), mergeLayerBlocks]).process(
    css,
    {
      from: undefined
    }
  )
  return result.css
}

describe('chassisPrefix()', () => {
  test('prefixes a plain custom property and its var() reference', async () => {
    const out = await run(':root { --primary: #06c; } .button { color: var(--primary); }')
    assert.match(out, /--cx-primary: #06c/)
    assert.match(out, /color: var\(--cx-primary\)/)
  })

  test('{ tailwind: true } leaves Tailwind theme values (@theme, --tw-*, --*) untouched', async () => {
    const out = await run(
      '@theme { --*: initial; --breakpoint-lg: 64rem; } @property --tw-scale-x { syntax: "*"; }',
      { tailwind: true }
    )
    assert.match(out, /--\*: initial/)
    assert.match(out, /--breakpoint-lg: 64rem/)
    assert.doesNotMatch(out, /--cx-breakpoint-lg/)
    assert.match(out, /@property --tw-scale-x/)
  })

  test("{ tailwind: true } still prefixes Chassis's own --breakpoint-*/--container-* in a plain :root block", async () => {
    // scss/_root.scss emits these as real, runtime Chassis custom
    // properties (js/src/nav-overflow.ts reads --cx-breakpoint-<name>) —
    // distinct from Tailwind's own same-named theme keys below.
    const out = await run(':root { --breakpoint-sm: 36rem; --container-sm: 36rem; }', {
      tailwind: true
    })
    assert.match(out, /--cx-breakpoint-sm: 36rem/)
    assert.match(out, /--cx-container-sm: 36rem/)
  })

  test('{ tailwind: true } does not prefix the SAME names inside a source @theme at-rule', async () => {
    const out = await run('@theme { --breakpoint-sm: 36rem; --container-sm: 36rem; }', {
      tailwind: true
    })
    assert.doesNotMatch(out, /--cx-breakpoint-sm/)
    assert.doesNotMatch(out, /--cx-container-sm/)
  })

  test('{ tailwind: true } does not prefix the SAME names inside a compiled :root, :host rule', async () => {
    // The shape Tailwind's own compiled output uses once `@theme` has been
    // resolved (see fact 18/21) — distinct from a plain `:root { ... }`.
    const out = await run(':root, :host { --breakpoint-sm: 36rem; --container-sm: 36rem; }', {
      tailwind: true
    })
    assert.doesNotMatch(out, /--cx-breakpoint-sm/)
    assert.doesNotMatch(out, /--cx-container-sm/)
  })

  test('{ tailwind: true } handles both contexts in the same stylesheet without cross-contamination', async () => {
    const out = await run(
      `@theme { --breakpoint-lg: 64rem; }
       :root, :host { --container-lg: 64rem; }
       :root { --breakpoint-sm: 36rem; --primary: #06c; }`,
      { tailwind: true }
    )
    assert.match(out, /@theme \{\s*--breakpoint-lg: 64rem;/)
    assert.match(out, /:root, :host \{\s*--container-lg: 64rem;/)
    assert.match(out, /--cx-breakpoint-sm: 36rem/)
    assert.match(out, /--cx-primary: #06c/)
    // No leftover shield names in the final output.
    assert.doesNotMatch(out, /--tw-shield/)
  })

  test("the opt-in bridge's --color-* theme keys stay unprefixed, their var() values do not", async () => {
    const out = await run('@theme { --color-primary: var(--primary); }', { tailwind: true })
    assert.match(out, /--color-primary: var\(--cx-primary\)/)
  })

  test("{ tailwind: true } leaves a project's own @theme keys and references to them unprefixed", async () => {
    const out = await run(
      `@theme { --font-*: initial; --font-sans: Inter; --radius-lg: 8px; --radius-card: var(--radius-lg); }
       .card { border-radius: var(--radius-card); color: var(--primary); }`,
      { tailwind: true }
    )
    assert.match(out, /--font-\*: initial/)
    assert.match(out, /--font-sans: Inter/)
    assert.match(out, /--radius-card: var\(--radius-lg\)/)
    assert.match(out, /border-radius: var\(--radius-card\)/)
    assert.match(out, /color: var\(--cx-primary\)/)
    assert.doesNotMatch(out, /--tw-shield/)
  })

  test('{ tailwind: true } still prefixes references to a name declared both in @theme and outside it', async () => {
    const out = await run(
      `@theme { --shadow-lg: 0 0 1px black; --breakpoint-sm: 36rem; }
       :root { --shadow-lg: 0 0 2px black; --breakpoint-sm: 36rem; }
       .a { box-shadow: var(--shadow-lg); min-width: var(--breakpoint-sm); }`,
      { tailwind: true }
    )
    assert.match(out, /@theme \{\s*--shadow-lg: 0 0 1px black;\s*--breakpoint-sm: 36rem;/)
    assert.match(out, /box-shadow: var\(--cx-shadow-lg\)/)
    assert.match(out, /min-width: var\(--cx-breakpoint-sm\)/)
  })
})

describe('chassisPrefix({ prefix })', () => {
  for (const tailwind of [false, true]) {
    test(`{ tailwind: ${tailwind} } renames the namespace, including var() references`, async () => {
      const out = await run(':root { --primary: #06c; } .button { color: var(--primary); }', {
        tailwind,
        prefix: 'acme-'
      })
      assert.match(out, /--acme-primary: #06c/)
      assert.match(out, /color: var\(--acme-primary\)/)
      assert.doesNotMatch(out, /--cx-/)
    })

    test(`{ tailwind: ${tailwind} } adds --chassis-prefix to the first plain :root rule`, async () => {
      const out = await run(':root { --primary: #06c; } :root { --secondary: #333; }', {
        tailwind,
        prefix: 'acme-'
      })
      assert.match(out, /^:root \{\s*--chassis-prefix: acme-;\s*--acme-primary: #06c;/)
      assert.equal((out.match(/--chassis-prefix/g) ?? []).length, 1)
    })
  }

  test('defaults the marker to cx-', async () => {
    const out = await run(':root { --primary: #06c; }')
    assert.match(out, /--chassis-prefix: cx-/)
    assert.match(out, /--cx-primary: #06c/)
  })

  test('adds no marker to a stylesheet without prefixed names', async () => {
    const out = await run('.button { color: red; } :root, :host { --tw-x: 1; }', { tailwind: true })
    assert.doesNotMatch(out, /--chassis-prefix/)
  })

  test('appends a :root rule for the marker when a prefixed stylesheet has none', async () => {
    const out = await run('.button { color: var(--primary); } :root, :host { --tw-x: 1; }')
    assert.match(out, /:root \{\s*--chassis-prefix: cx-;?\s*\}\s*$/)
    assert.equal((out.match(/--chassis-prefix/g) ?? []).length, 1)
  })

  test('skips a :root rule nested in @media, but accepts one nested in @layer', async () => {
    const out = await run(
      `@media (prefers-reduced-motion: no-preference) { :root { scroll-behavior: smooth; } }
       @layer root { :root { --primary: #06c; } }`
    )
    assert.match(out, /@media [^{]+\{\s*:root \{\s*scroll-behavior: smooth;\s*\}/)
    assert.match(out, /@layer root \{\s*:root \{\s*--chassis-prefix: cx-;\s*--cx-primary: #06c;/)
  })

  test('moves a stale marker out of a conditional :root rule', async () => {
    const out = await run(
      '@media print { :root { --chassis-prefix: cx-; color: black; } } :root { --primary: #06c; }'
    )
    assert.match(out, /@media print \{ :root \{ color: black; \} \}/)
    assert.match(out, /:root \{\s*--chassis-prefix: cx-;\s*--cx-primary: #06c;/)
  })

  test('skips names already carrying the custom prefix, so a second pass is a no-op', async () => {
    const once = await run(':root { --primary: #06c; }', { prefix: 'acme-' })
    const twice = await run(once, { prefix: 'acme-' })
    assert.equal(twice, once)
  })

  test('rejects a prefix that is not a valid custom-property name segment', () => {
    for (const prefix of ['1cx-', 'a b', 'cx.', '--cx-', 42, 'cx', 'acme', 'b']) {
      assert.throws(() => chassisPrefix({ prefix }), TypeError)
    }
  })
})

describe("chassisPrefix({ prefix: '' })", () => {
  test('keeps plain names and var() references, and writes no marker', async () => {
    const css = ':root { --primary: #06c; } .button { color: var(--primary); }'
    const out = await run(css, { prefix: '' })
    assert.equal(out, css)
    assert.doesNotMatch(out, /--chassis-prefix/)
  })

  test('removes a stale marker left by an earlier prefixed pass', async () => {
    const out = await run(':root { --chassis-prefix: cx-; --primary: #06c; }', { prefix: '' })
    assert.doesNotMatch(out, /--chassis-prefix/)
    assert.match(out, /--primary: #06c/)
  })

  test('chassisPostcss() still merges @layer blocks', async () => {
    const out = (
      await postcss(chassisPostcss({ prefix: '' })).process(
        '@layer components { .a { color: red; } } @layer components { .b { color: blue; } }',
        { from: undefined }
      )
    ).css
    assert.equal((out.match(/@layer components/g) ?? []).length, 1)
  })

  test('throws with { tailwind: true }, whose theme keys would collide with plain Chassis names', () => {
    assert.throws(() => chassisPrefix({ prefix: '', tailwind: true }), /Tailwind/)
  })
})

describe('chassisPostcss()', () => {
  test('returns a plugin list usable directly in a plugins array, running both the prefixer and the layer merge', async () => {
    const out = (
      await postcss(chassisPostcss({ tailwind: true })).process(
        `:root { --breakpoint-sm: 36rem; }
         @layer components { .a { color: red; } }
         @layer components { .b { color: blue; } }`,
        { from: undefined }
      )
    ).css
    assert.match(out, /--cx-breakpoint-sm/)
    assert.equal((out.match(/@layer components/g) ?? []).length, 1)
    assert.match(out, /\.a\s*\{[^}]*color: red/)
    assert.match(out, /\.b\s*\{[^}]*color: blue/)
  })
})
