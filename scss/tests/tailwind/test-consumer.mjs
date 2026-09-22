#!/usr/bin/env node

/*!
 * test-consumer.mjs — Node-only regression test proving the Tailwind entry
 * point works for a project with its OWN chassis-tokens, not only the
 * prebuilt `dist/tailwind/` (default `docs/chassis` tokens). Phase 10 exists
 * because compiling `scss/tailwind/index.scss` directly used to skip every
 * fix `build/tailwind/build-tailwind.mjs`/`build/tailwind/tailwind-clashes.mjs` used to apply
 * after the fact (fact 19); this is the end-to-end proof that no longer
 * happens.
 *
 * `scss/tests/tailwind/consumer/` stands in for a real project:
 * `_chassis-tokens.scss` on an earlier `loadPaths` entry than
 * `scss/vendor/` (see scss/config/_vendor.scss's "Token sources" comment)
 * overrides the brand primary color; `styles.scss` configures a custom
 * `$breakpoints` map before using the Tailwind entry — both via the exact
 * `@use ... with (...)` pattern the Sass customization docs recommend.
 * Compiled with the real `sass` package, prefixed with the real, published
 * `@chassis-ui/css/postcss` preset (postcss/index.js), then compiled with
 * the real `@tailwindcss/node` compiler — no shortcuts at any step.
 *
 * Run via `pnpm css:test:tailwind` (wired into `pnpm test`).
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import { compile } from '@tailwindcss/node'
import assert from 'node:assert/strict'
import path from 'node:path'
import { before, describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import * as sass from 'sass'
import { chassisPostcss } from '../../../postcss/index.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../..')
const consumerDir = path.join(here, 'consumer')

let built

before(async () => {
  // Consumer's own token source resolves ahead of Chassis's default —
  // exactly the precedence scss/config/_vendor.scss documents.
  const { css: sassCss } = sass.compile(path.join(consumerDir, 'styles.scss'), {
    loadPaths: [consumerDir, path.join(root, 'scss/vendor'), path.join(root, 'node_modules')],
    style: 'expanded'
  })

  const { css: prefixed } = await postcss(chassisPostcss({ tailwind: true })).process(sassCss, {
    from: undefined
  })

  const candidates = [
    'container',
    'lg:container',
    'outline',
    'col-6',
    'lg:col-6',
    'opacity-50',
    'fg-primary',
    'lg:fg-primary',
    'dark:fg-primary'
  ]
  const compiler = await compile(prefixed + '\n@source not ".";\n', {
    base: consumerDir,
    onDependency: () => {}
  })
  built = compiler.build(candidates)
})

describe('a consumer with their own chassis-tokens and $breakpoints', () => {
  test('the brand primary color reaches :root, not the docs-site default', () => {
    // #ff6b35 (the brand override in consumer/_chassis-tokens.scss), not
    // Chassis's own docs-site default primary (#00A4CC, which compiles to
    // oklch(66.72% 0.125 223.3deg) — that exact string legitimately still
    // appears elsewhere in this build, as an UNRELATED shade-ramp token
    // (--cx-primary-50) this fixture never overrides, so the check below is
    // scoped to the --cx-primary: declaration itself, not the whole file.
    const declaration = built.match(/--cx-primary: [^;]+;/)
    assert.ok(declaration, 'expected a --cx-primary declaration')
    assert.match(declaration[0], /oklch\(70\.4\d% 0\.19\d 39\.2\ddeg\)/)
    assert.doesNotMatch(declaration[0], /oklch\(66\.72% 0\.125 223\.3deg\)/)
  })

  test('a quoted font family keeps its quotes in --cx-font-family-text', () => {
    // Unquoted, `Source Serif 4` isn't a valid font-family name (`4` isn't
    // an identifier), so the browser drops the whole declaration and falls
    // back to its default font. Interpolating the token list with `#{}`
    // used to strip the quotes (scss/_root.scss's font-family loop).
    const declaration = built.match(/--cx-font-family-text: [^;]+;/)
    assert.ok(declaration, 'expected a --cx-font-family-text declaration')
    assert.equal(
      declaration[0],
      '--cx-font-family-text: "Source Serif 4", "Source Serif Pro", ui-serif, serif;'
    )
  })

  test("lg: reads the brand breakpoint (72rem), not Chassis's stock 64rem", () => {
    assert.match(built, /@media \(width >= 72rem\)/)
    assert.doesNotMatch(built, /@media \(width >= 64rem\)/)
  })

  test('the outline component-clash exclusion holds', () => {
    assert.doesNotMatch(built, /outline-style/)
  })

  test("Tailwind core's own container/col-* stay excluded at the brand-only breakpoint (container, col-*)", () => {
    // Chassis authors its OWN `.container`/`.col-6` too (see scss/_containers.scss,
    // scss/_grid.scss) — the exclusion's job is only to keep TAILWIND's core
    // utility of the same name from ALSO generating and merging in, not to
    // remove Chassis's own rule, so this checks for Tailwind's specific
    // shape rather than the class name's mere presence:
    //  - core `container` nests `@media` INSIDE the `.container` rule
    //    itself (CSS nesting) and reads `--container-lg` — this brand's
    //    72rem — where Chassis's own container uses separate, sibling
    //    `@media` blocks and its own fixed (never 72rem) width scale.
    //  - core `col-<n>` sets a bare `grid-column: <n>`, a different
    //    property than Chassis's flex grid's `flex`/`width`.
    // If the exclusion's breakpoint-prefix group were hard-coded to
    // Chassis's own default breakpoint keys instead of built from this
    // project's $breakpoints (fact 18/Phase 10b), either shape would leak
    // in at "lg", a differently-valued key here than Chassis's default one.
    assert.doesNotMatch(built, /\.container\s*\{[^}]*max-width: 72rem/s)
    assert.doesNotMatch(built, /\.lg\\:container\s*\{[^}]*max-width: 72rem/s)
    assert.doesNotMatch(built, /\.(lg\\:)?col-6\s*\{[^}]*grid-column: 6\b/s)
  })

  test('a Group 1 !important remedy (opacity-50) still wins the same-name merge', () => {
    assert.match(built, /\.opacity-50\s*\{[^}]*!important/)
  })

  test('--cx-breakpoint-* resolves at :root — the runtime property js/src/nav-overflow.ts reads (fact 20)', () => {
    // Chassis's own runtime breakpoint custom property (scss/_root.scss),
    // prefixed like everything else — the postcss/index.js shield/unshield
    // pair (see test-postcss.mjs) means this survives even though the same
    // literal name is ALSO Tailwind's own theme key elsewhere.
    assert.match(built, /--cx-breakpoint-sm: 30rem/)
    assert.match(built, /--cx-breakpoint-lg: 72rem/)
  })

  test('--chassis-prefix survives Sass, the preset, and Tailwind with the real prefix — the marker js/src/util/index.ts cssVar() reads', () => {
    assert.match(built, /--chassis-prefix: cx-/)
  })

  test('the Chassis + Tailwind layer order is first, ahead of any generated rule', () => {
    const chassisLayerStatement =
      '@layer theme, colors, config, root, base, reboot, layout, content, components, custom, helpers, utilities;'
    const layerIndex = built.indexOf(chassisLayerStatement)
    assert.ok(layerIndex > 0, 'expected the Chassis layer-order statement in the output')
    const firstUtilityRuleIndex = built.indexOf('.fg-primary')
    assert.ok(
      firstUtilityRuleIndex > layerIndex,
      'the layer statement must precede generated rules'
    )
  })
})
