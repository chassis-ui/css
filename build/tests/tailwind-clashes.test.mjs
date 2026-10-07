/*!
 * tailwind-clashes.test.mjs — the generated scss/tailwind/_source-exclusions.scss.
 *
 * packages/css/build/tailwind/clashes.mjs writes the file and reads it back on every
 * `pnpm css:tailwind`. A list with no member has to be valid for stylelint, which lints the file
 * with the rest of scss/. Run via `pnpm build:test`.
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  formatSourceExclusionsFile,
  parseSassStringList
} from '../../packages/css/build/tailwind/clashes.mjs'

describe('formatSourceExclusionsFile()', () => {
  test('writes each list one name a line, and reads it back', () => {
    const source = formatSourceExclusionsFile({
      bare: ['grid', 'table'],
      responsive: ['container']
    })

    assert.match(source, /\$bare-clashes: \(\n {2}"grid",\n {2}"table"\n\) !default;\n/)
    assert.match(source, /\$breakpoint-clashes: \(\n {2}"container"\n\) !default;\n$/)
    assert.deepEqual(parseSassStringList(source, 'bare-clashes'), ['grid', 'table'])
    assert.deepEqual(parseSassStringList(source, 'breakpoint-clashes'), ['container'])
  })

  test('writes a list with no member as () on one line', () => {
    const source = formatSourceExclusionsFile({ bare: ['grid'], responsive: [] })

    assert.match(source, /\$breakpoint-clashes: \(\) !default;\n$/)
    assert.doesNotMatch(source, /\(\n\n/)
    assert.deepEqual(parseSassStringList(source, 'bare-clashes'), ['grid'])
    assert.deepEqual(parseSassStringList(source, 'breakpoint-clashes'), [])
  })
})
