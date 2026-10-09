/*!
 * tailwind-clashes.test.mjs — the generated scss/tailwind/_source-exclusions.scss, and the class
 * names it is made from.
 *
 * packages/css/build/tailwind/clashes.mjs writes the file and reads it back on every
 * `pnpm css:tailwind`. A list with no member has to be valid for stylelint, which lints the file
 * with the rest of scss/. The names it checks against Tailwind core are the class names of the
 * compiled CSS, whatever version the banner of the file has. Run via `pnpm build:test`.
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  extractClassNames,
  formatSourceExclusionsFile,
  parseSassStringList
} from '../../packages/css/build/tailwind/clashes.mjs'

const banner = (version) => `/*!
  * Chassis CSS - Tailwind Components v${version} (https://chassis-ui.com/)
  */
`

describe('extractClassNames()', () => {
  test('finds the classes of a selector, unescaped', () => {
    const names = extractClassNames(`
      .button.outline:hover, .nav > .nav-link { color: red; }
      .md\\:navbar-expand .w-6\\/12 { width: 50%; }
      .\\32 xl\\:d-flex, .\\@md\\:col-span-4 { display: flex; }
    `)

    assert.deepEqual(
      [...names].sort(),
      [
        '2xl:d-flex',
        '@md:col-span-4',
        'button',
        'md:navbar-expand',
        'nav',
        'nav-link',
        'outline',
        'w-6/12'
      ].sort()
    )
  })

  test('leaves out the fraction of a number, which no class can be', () => {
    const names = extractClassNames(`
      .card { padding: .25rem 1.5rem; margin: -.5em; transition: opacity .2s; line-height: 1.75; }
      .icon { background: url("data:image/svg+xml,%3cpath d='M12 16c-.3 0-.5-.1-.7-.3l-6-6'/%3e"); }
    `)

    assert.deepEqual([...names].sort(), ['card', 'icon'])
  })

  test('takes no name from the version in the banner', () => {
    // Any version: its numbers are fractions to the pattern (`.2.3`), and the names in
    // dist/tailwind/clashes.json changed with a release when they counted.
    for (const version of ['1.2.3', '10.20.30', '1.2.3-beta.4']) {
      const names = extractClassNames(`${banner(version)}.card { padding: .25rem; }`)
      assert.deepEqual([...names].sort(), ['card', 'com'])
    }
  })
})

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
