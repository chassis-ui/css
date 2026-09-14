#!/usr/bin/env node

/*!
 * check-component-stack.js — keeps scss/tailwind/_components-list.scss in
 * sync with scss/chassis.scss's import stack.
 *
 * scss/chassis.scss can't forward a shared partial for its component list:
 * the docs site renders that exact block verbatim via
 * <ScssDocs name="import-stack" file="scss/chassis.scss" /> (see
 * site/content/docs/customize/optimize.mdx) so users can see and remove
 * individual component imports, which a single collapsed @forward would
 * break. So the two lists are physically separate files kept honest by this
 * check instead of a shared partial.
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(fileURLToPath(import.meta.url), '../..')

const FORWARD_RE = /^@forward\s+["']\.{1,2}\/([^"']+)["']/

function extractForwards(text) {
  return text
    .split('\n')
    .map((line) => line.match(FORWARD_RE))
    .filter(Boolean)
    .map((match) => match[1])
}

const chassisSource = readFileSync(path.join(root, 'scss/chassis.scss'), 'utf8')
const startMarker = '// scss-docs-start import-stack'
const endMarker = '// scss-docs-end import-stack'
const startIndex = chassisSource.indexOf(startMarker)
const endIndex = chassisSource.indexOf(endMarker)
if (startIndex === -1 || endIndex === -1) {
  console.error(`Could not find ${startMarker} / ${endMarker} markers in scss/chassis.scss`)
  process.exit(1)
}
const chassisBlock = chassisSource.slice(startIndex, endIndex)

const EXCLUDED = new Set(['root', 'reboot', 'utilities-api'])
const expected = extractForwards(chassisBlock).filter((name) => !EXCLUDED.has(name))

const tailwindSource = readFileSync(path.join(root, 'scss/tailwind/_components-list.scss'), 'utf8')
const actual = extractForwards(tailwindSource)

let ok = true
const maxLength = Math.max(expected.length, actual.length)
for (let i = 0; i < maxLength; i++) {
  if (expected[i] !== actual[i]) {
    ok = false
    console.error(
      `Mismatch at position ${i}: scss/chassis.scss has ${JSON.stringify(expected[i] ?? '(end)')}, ` +
        `scss/tailwind/_components-list.scss has ${JSON.stringify(actual[i] ?? '(end)')}`
    )
  }
}

if (!ok) {
  console.error(
    '\nscss/tailwind/_components-list.scss has drifted from scss/chassis.scss\'s import stack ' +
      '(excluding root, reboot, utilities-api). Update scss/tailwind/_components-list.scss to match.'
  )
  process.exit(1)
}

console.log(`scss/tailwind/_components-list.scss matches scss/chassis.scss (${actual.length} entries).`)
