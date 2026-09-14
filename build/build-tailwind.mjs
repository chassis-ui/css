#!/usr/bin/env node

/*!
 * build-tailwind.mjs — compiles scss/tailwind/ into dist/tailwind/.
 *
 * `scss/tailwind/layers.css` is a static CSS file, not Sass. Dart Sass hoists
 * plain `@import` rules to the very top of its compiled output, ahead of any
 * `@layer` statement that precedes them in source — which would reorder
 * Tailwind's `utilities` layer ahead of Chassis's own layers instead of after
 * them. Compiling `layers.css` through Sass at all reproduces the bug even as
 * a lone `@forward`, so it is copied verbatim and prepended to `index.css` by
 * hand instead. (An earlier draft wrapped the imports in `url(...)` to dodge
 * this — that keeps Sass from touching them, but `@tailwindcss/node` then
 * treats them as opaque browser imports and never resolves Tailwind's theme
 * or utilities at all. Making the file fully static removes the need for
 * that workaround, so it uses Tailwind's own plain import syntax.)
 *
 * The `--cx-` prefixing / `@layer` merge pass runs through the `postcss` API
 * directly (`build/postcss.tailwind.config.js`), not the `postcss-cli`
 * `--config` flag: postcss-cli resolves a `--config` path via `lilconfig`,
 * which treats it as a search-start directory rather than a literal file, so
 * pointing it at a custom-named file in `build/` silently loads the sibling
 * `build/postcss.config.js` instead.
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import * as sass from 'sass'
import tailwindConfig from './postcss.tailwind.config.js'

const root = path.resolve(fileURLToPath(import.meta.url), '../..')
const srcDir = path.join(root, 'scss/tailwind')
const outDir = path.join(root, 'dist/tailwind')

const entries = ['theme.scss', 'root.scss', 'reboot.scss', 'components.scss', 'utilities.scss', 'index.scss']

mkdirSync(outDir, { recursive: true })

for (const entry of entries) {
  const result = sass.compile(path.join(srcDir, entry), {
    loadPaths: [path.join(root, 'scss/vendor'), path.join(root, 'node_modules')],
    style: 'expanded'
  })
  const outFile = path.join(outDir, entry.replace(/\.scss$/, '.css'))
  writeFileSync(outFile, result.css)
}

copyFileSync(path.join(srcDir, 'layers.css'), path.join(outDir, 'layers.css'))

const layers = readFileSync(path.join(outDir, 'layers.css'), 'utf8')
const index = readFileSync(path.join(outDir, 'index.css'), 'utf8')
writeFileSync(path.join(outDir, 'index.css'), `${layers}\n${index}`)

const { plugins } = tailwindConfig({})
const processor = postcss(plugins)

for (const file of readdirSync(outDir)) {
  if (!file.endsWith('.css')) continue
  const filePath = path.join(outDir, file)
  const result = await processor.process(readFileSync(filePath, 'utf8'), { from: filePath, to: filePath, map: false })
  writeFileSync(filePath, result.css)
}
