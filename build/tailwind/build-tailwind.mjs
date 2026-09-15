#!/usr/bin/env node

/*!
 * build-tailwind.mjs — compiles scss/tailwind/ into dist/tailwind/.
 *
 * The combined Chassis + Tailwind layer order comes from Sass
 * (`scss/tailwind/_layer-order.scss`): a `@layer` statement followed by
 * `@layer utilities { @tailwind utilities; }`, with no `@import`. Dart Sass
 * hoists plain `@import` rules above any `@layer` statement, so an import
 * there would put Tailwind's `utilities` layer ahead of Chassis's own layers.
 * Keeping it import-free means a project compiling `scss/tailwind/index.scss`
 * with its own chassis-tokens gets the same preamble as this build.
 *
 * The `--cx-` prefixing / `@layer` merge pass runs through the `postcss` API
 * directly (`build/tailwind/postcss.tailwind.config.js`), not the `postcss-cli`
 * `--config` flag: postcss-cli resolves a `--config` path via `lilconfig`,
 * which treats it as a search-start directory rather than a literal file, so
 * pointing it at a custom-named file in `build/` silently loads the sibling
 * `build/postcss.config.js` instead.
 *
 * Finally, four checks run against the final compiled output, in order:
 *  1. `tailwind-clashes.mjs`'s `run()` re-detects Chassis component/reboot
 *     class names that clash with Tailwind core and fails loudly if that
 *     set has drifted from the committed
 *     `scss/tailwind/_source-exclusions.scss` — the `@source not
 *     inline(...)` exclusions themselves are emitted by `theme.scss` at
 *     Sass-compile time, not written here.
 *  2. `tailwind-clashes.mjs`'s `checkClashPolicy()` re-derives
 *     `scss/tailwind/_clash-policy.scss` from `build/tailwind/tailwind-utility-clashes.json`
 *     and `build/tailwind/tailwind-bridge-clashes.json` and fails loudly if it has
 *     drifted — a pure JSON→Sass re-derivation, not a live Tailwind-compile
 *     probe, since those two JSON files stay the reviewed source of truth.
 *  3. `tailwind-clashes.mjs`'s `checkUtilityNameClashes()` finds Chassis
 *     utility names Tailwind core ALSO generates even after the theme reset
 *     (a same-name `@utility` merge, not an exclusion candidate —
 *     `@source not inline()` would drop Chassis's own utility too), and
 *     fails loudly if the live clash set drifts from
 *     `build/tailwind/tailwind-utility-clashes.json`. The `!important` remedy itself
 *     is applied by the Sass emitter (`scss/tailwind/_clash-policy.scss`),
 *     not written here — this only verifies it actually made Chassis's
 *     declared value win the real compiled merge.
 *  4. `tailwind-bridge-clashes.mjs`'s `checkBridgeClashes()` reruns the same
 *     analysis with the opt-in `bridge.scss` token bridge's `--color-*`
 *     theme keys loaded, since bridging Chassis's palette re-enables native
 *     Tailwind color utilities (`bg-*`, `border-*`, ...) that clash with
 *     Chassis's own same-named ones. Its remedy is unconditional in
 *     `_clash-policy.scss` too, so it's a no-op for consumers who never
 *     import bridge.css and a real fix for the ones who do.
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import * as sass from 'sass'
import tailwindConfig from './postcss.tailwind.config.js'
import { checkBridgeClashes } from './tailwind-bridge-clashes.mjs'
import {
  checkClashPolicy,
  checkUtilityNameClashes,
  run as checkSourceExclusions
} from './tailwind-clashes.mjs'

const root = path.resolve(fileURLToPath(import.meta.url), '../../..')
const srcDir = path.join(root, 'scss/tailwind')
const outDir = path.join(root, 'dist/tailwind')

const entries = [
  'layers.scss',
  'theme.scss',
  'root.scss',
  'reboot.scss',
  'components.scss',
  'utilities.scss',
  'index.scss',
  'bridge.scss'
]

// The Sass + prefix compile pass, exported so
// `update-tailwind-source-exclusions.mjs` can produce a fresh
// `dist/tailwind/` build without running the checks below (which would
// throw on the very drift that script exists to resolve).
export async function compileTailwindDist() {
  mkdirSync(outDir, { recursive: true })

  for (const entry of entries) {
    const result = sass.compile(path.join(srcDir, entry), {
      loadPaths: [path.join(root, 'scss/vendor'), path.join(root, 'node_modules')],
      style: 'expanded'
    })
    const outFile = path.join(outDir, entry.replace(/\.scss$/, '.css'))
    writeFileSync(outFile, result.css)
  }

  const { plugins } = tailwindConfig({})
  const processor = postcss(plugins)

  for (const file of readdirSync(outDir)) {
    if (!file.endsWith('.css')) continue
    const filePath = path.join(outDir, file)
    const result = await processor.process(readFileSync(filePath, 'utf8'), {
      from: filePath,
      to: filePath,
      map: false
    })
    writeFileSync(filePath, result.css)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await compileTailwindDist()
  await checkSourceExclusions()
  checkClashPolicy()
  await checkUtilityNameClashes()
  await checkBridgeClashes()
}
