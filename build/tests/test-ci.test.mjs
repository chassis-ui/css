/*!
 * test-ci.test.mjs — `pnpm test:ci` runs what CI runs.
 *
 * A check that is added to .github/workflows/ci.yml and not to the `test:ci` script makes a
 * local pass say less than it claims. Run via `pnpm build:test`.
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { describe, test } from 'node:test'
import { root } from './helpers.mjs'

// What CI runs and `test:ci` does not, with the reason
const NOT_LOCAL = {
  install: 'the dependencies are installed',
  audit: 'reports only; `check:pnpm` is the audit that fails the job'
}

// What CI runs under another name
const LOCAL_NAMES = {
  // `pnpm verify` builds before it compares
  css: 'verify',
  dist: 'verify',
  // CI sets the variable that adds Firefox and WebKit
  'js:test:unit': 'js:test:unit:all-browsers'
}

const { scripts } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const workflow = fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8')

// The scripts of the steps that are one command: `run: pnpm css:lint`
const ciScripts = [...workflow.matchAll(/^\s+run: pnpm ([a-z][\w:-]*)/gm)].map((match) => match[1])
const localScripts = scripts['test:ci'].split(' && ').map((command) => command.replace('pnpm ', ''))

describe('pnpm test:ci', () => {
  test('finds the steps of the workflow', () => {
    assert.ok(ciScripts.includes('verify'))
    assert.ok(ciScripts.length >= 15, `${ciScripts.length} steps found`)
  })

  test('runs every script the workflow runs', () => {
    const missing = ciScripts
      .filter((script) => !(script in NOT_LOCAL))
      .map((script) => LOCAL_NAMES[script] ?? script)
      .filter((script) => !localScripts.includes(script))

    assert.deepEqual([...new Set(missing)], [])
  })

  test('runs scripts that exist, once', () => {
    assert.deepEqual(
      localScripts.filter((script) => !(script in scripts)),
      []
    )
    assert.equal(new Set(localScripts).size, localScripts.length)
  })
})
