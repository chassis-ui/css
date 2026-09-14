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

async function run(css, { tailwind } = {}) {
  const result = await postcss([chassisPrefix({ tailwind }), mergeLayerBlocks]).process(css, {
    from: undefined
  })
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
