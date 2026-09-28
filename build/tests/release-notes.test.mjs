/*!
 * release-notes.test.mjs — the body of the GitHub release, from the CHANGELOG.
 *
 * publish-release.yml runs build/release-notes.js on `main` only, so an error in it shows when
 * a version is being released. Run via `pnpm build:test`.
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import { createFixture, removeFixture, runScript } from './helpers.mjs'

const SCRIPT = 'build/release-notes.js'

const CHANGELOG = `# Changelog

## [Unreleased]

### Added

- Not released yet

## 0.6.0

### Minor Changes

- abc1234: **Breaking:** the entry is compiled JavaScript

\`\`\`md
## A heading inside a code block
\`\`\`

### Patch Changes

- def5678: A fix

## 0.6.0-beta.1

### Patch Changes

- A prerelease

## [0.5.20] - 2026-09-26

### Fixed

- The twentieth patch

## [0.5.2] - 2026-09-25

### Fixed

- The second patch

## [0.5.1] - 2026-09-23

## [0.5.0] - 2026-09-20

### Added

- The last entry

---

[0.5.0]: https://github.com/chassis-ui/css/compare/v0.4.0...v0.5.0
[0.5.1]: https://github.com/chassis-ui/css/compare/v0.5.0...v0.5.1
`

describe('release-notes.js', () => {
  let dir

  const notes = (...args) => runScript(SCRIPT, args, { cwd: dir })

  before(() => {
    dir = createFixture({
      'packages/css/CHANGELOG.md': CHANGELOG,
      'packages/css/package.json': JSON.stringify({ version: '0.5.2' })
    })
  })

  after(() => removeFixture(dir))

  test('prints the entry of a hand-written heading, without the heading', async () => {
    const { status, stdout } = await notes('0.5.2')

    assert.equal(status, 0)
    assert.equal(stdout, '### Fixed\n\n- The second patch\n')
  })

  test('prints the entry of a Changesets heading', async () => {
    const { status, stdout } = await notes('0.6.0')

    assert.equal(status, 0)
    assert.match(stdout, /^### Minor Changes\n/)
    assert.match(stdout, /- def5678: A fix\n$/)
  })

  test('does not end the entry at a heading inside a code block', async () => {
    const { stdout } = await notes('0.6.0')

    assert.match(stdout, /## A heading inside a code block/)
    assert.match(stdout, /### Patch Changes/)
  })

  test('accepts the version as a tag', async () => {
    const { status, stdout } = await notes('v0.5.2')

    assert.equal(status, 0)
    assert.equal(stdout, '### Fixed\n\n- The second patch\n')
  })

  test('uses the version of package.json without an argument', async () => {
    const { status, stdout } = await notes()

    assert.equal(status, 0)
    assert.equal(stdout, '### Fixed\n\n- The second patch\n')
  })

  test('does not take a version for one that starts with it', async () => {
    const patch = await notes('0.5.20')
    const prerelease = await notes('0.6.0-beta.1')

    assert.equal(patch.stdout, '### Fixed\n\n- The twentieth patch\n')
    assert.equal(prerelease.stdout, '### Patch Changes\n\n- A prerelease\n')
  })

  test('ends the last entry before the link definitions', async () => {
    const { status, stdout } = await notes('0.5.0')

    assert.equal(status, 0)
    assert.match(stdout, /^### Added\n\n- The last entry\n/)
    assert.doesNotMatch(stdout, /compare/)
  })

  test('fails when the CHANGELOG has no entry for the version', async () => {
    const { status, stdout, stderr } = await notes('0.7.0')

    assert.equal(status, 1)
    assert.equal(stdout, '')
    assert.match(stderr, /has no entry for 0\.7\.0/)
  })

  test('fails when the entry is empty', async () => {
    const { status, stdout, stderr } = await notes('0.5.1')

    assert.equal(status, 1)
    assert.equal(stdout, '')
    assert.match(stderr, /entry for 0\.5\.1 is empty/)
  })
})
