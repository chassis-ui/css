/*!
 * bundlewatch-fix.test.mjs — the limits packages/css/build/bundlewatch-fix.mjs writes for the
 * files bundlewatch reports over their limit. The tests give it bundlewatch output of their own;
 * bundlewatch does not run. Run via `pnpm build:test`.
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { fixLimits, formatSize, raiseLimit } from '../../packages/css/build/bundlewatch-fix.mjs'

const config = (...files) => ({
  files: files.map(([path, maxSize]) => ({ path, maxSize, compression: 'gzip' }))
})

describe('raiseLimit()', () => {
  test('raises the limit to the quarter above the size', () => {
    assert.equal(raiseLimit(41.8, 41.75), 42)
    assert.equal(raiseLimit(90.81, 90.5), 91)
  })

  test('raises a limit the printed size rounds to, to the quarter above it', () => {
    // A file of 41.7512 kB prints as `41.75KB > 41.75KB`
    assert.equal(raiseLimit(41.75, 41.75), 42)
    assert.equal(raiseLimit(11, 11), 11.25)
  })

  test('raises a limit that is not a quarter to the quarter above it', () => {
    assert.equal(raiseLimit(41.8, 41.8), 42)
  })
})

describe('formatSize()', () => {
  test('writes a whole or half kilobyte with one decimal, the rest with two', () => {
    assert.equal(formatSize(42), '42.0 kB')
    assert.equal(formatSize(21.5), '21.5 kB')
    assert.equal(formatSize(41.75), '41.75 kB')
  })
})

describe('fixLimits()', () => {
  test('changes the limit of each file reported over it and leaves the others', () => {
    const watched = config(
      ['./dist/css/chassis-utilities.min.css', '41.75 kB'],
      ['./dist/css/chassis.min.css', '82.25 kB'],
      ['./dist/js/chassis.js', '44.25 kB']
    )
    const output = [
      'PASS ./dist/js/chassis.js: 42.53KB < 44.25KB (gzip)',
      'FAIL ./dist/css/chassis-utilities.min.css: 41.75KB > 41.75KB (gzip)',
      'FAIL ./dist/css/chassis.min.css: 82.31KB > 82.25KB (gzip)',
      'bundlewatch FAIL'
    ].join('\n')

    const messages = fixLimits(output, watched)

    assert.deepEqual(
      watched.files.map((f) => f.maxSize),
      ['42.0 kB', '82.5 kB', '44.25 kB']
    )
    assert.deepEqual(messages, [
      'Updated ./dist/css/chassis-utilities.min.css: 41.75 kB -> 42.0 kB',
      'Updated ./dist/css/chassis.min.css: 82.25 kB -> 82.5 kB'
    ])
  })

  test('changes nothing when every file passes', () => {
    const watched = config(['./dist/css/chassis.css', '91.0 kB'])

    assert.deepEqual(fixLimits('PASS ./dist/css/chassis.css: 90.81KB < 91KB (gzip)', watched), [])
    assert.equal(watched.files[0].maxSize, '91.0 kB')
  })
})
