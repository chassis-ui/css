/*!
 * verify-dist.test.mjs — the comparison of the committed output with a fresh build.
 *
 * packages/css/build/verify-dist.js is what stops a release whose dist/ or js/dist/ is older
 * than its source. Each test commits an output to a repository of its own, changes it the way
 * a build would, and runs the script there. Run via `pnpm build:test`.
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, test } from 'node:test'
import { createFixture, git, removeFixture, runScript, stubPnpm, writeFiles } from './helpers.mjs'

const SCRIPT = 'packages/css/build/verify-dist.js'

// A package as it is committed: the four output directories and the source of the modules
const COMMITTED = {
  'dist/css/chassis.css': '.button {}\n',
  'dist/css/chassis.css.map': '{"version":3}\n',
  'dist/tailwind/index.css': '@layer theme;\n',
  'dist/js/chassis.js': 'export {}\n',
  'js/dist/button.js': 'export default class Button {}\n',
  'js/dist/button.js.map': '{"version":3}\n',
  'js/dist/button.d.ts': 'export default class Button {}\n',
  'js/dist/button.d.ts.map': '{"version":3}\n',
  'js/dist/dom/data.js': 'export default {}\n',
  'js/src/button.ts': 'export default class Button {}\n',
  'js/src/dom/data.ts': 'export default {}\n',
  'scss/_button.scss': '.button {}\n'
}

describe('verify-dist.js', () => {
  let dir

  const verify = (args = ['--skip-build'], env = {}) => runScript(SCRIPT, args, { cwd: dir, env })

  beforeEach(() => {
    dir = createFixture(COMMITTED)
    git(dir, 'init', '--quiet')
    git(dir, 'add', '--all')
    git(dir, 'commit', '--quiet', '--message', 'build: the output')
  })

  afterEach(() => removeFixture(dir))

  describe('with the output that is on disk', () => {
    test('passes when it is the committed one', async () => {
      const { status, stdout } = await verify()

      assert.equal(status, 0)
      assert.match(stdout, /dist\/css, dist\/tailwind, dist\/js, js\/dist match a fresh build/)
    })

    test('ignores a change outside the output', async () => {
      writeFiles(dir, { 'scss/_button.scss': '.button { color: red }\n', 'notes.md': 'New\n' })

      const { status } = await verify()

      assert.equal(status, 0)
    })

    test('fails on a file that differs', async () => {
      writeFiles(dir, { 'dist/css/chassis.css': '.button { color: red }\n' })

      const { status, stderr } = await verify()

      assert.equal(status, 1)
      assert.match(stderr, /1 committed output files are out of date/)
      assert.match(stderr, /dist\/css\/chassis\.css \(differs\)/)
    })

    test('fails on a file that differs and is staged', async () => {
      writeFiles(dir, { 'dist/tailwind/index.css': '@layer theme, base;\n' })
      git(dir, 'add', '--all')

      const { status, stderr } = await verify()

      assert.equal(status, 1)
      assert.match(stderr, /dist\/tailwind\/index\.css \(differs\)/)
    })

    test('fails on a file the build adds', async () => {
      writeFiles(dir, {
        'dist/js/chassis.bundle.js': 'export {}\n',
        'js/dist/chip.js': 'export default class Chip {}\n',
        'js/src/chip.ts': 'export default class Chip {}\n'
      })

      const { status, stderr } = await verify()

      assert.equal(status, 1)
      assert.match(stderr, /2 committed output files are out of date/)
      assert.match(stderr, /dist\/js\/chassis\.bundle\.js \(not committed\)/)
      assert.match(stderr, /js\/dist\/chip\.js \(not committed\)/)
    })

    test('fails on a file the build no longer writes', async () => {
      writeFiles(dir, { 'dist/js/chassis.js': null })

      const { status, stderr } = await verify()

      assert.equal(status, 1)
      assert.match(stderr, /dist\/js\/chassis\.js \(missing\)/)
    })

    test('lists every file, in order', async () => {
      writeFiles(dir, {
        'js/dist/button.js': 'export default class {}\n',
        'dist/css/chassis.css': '.button { color: red }\n',
        'dist/js/chassis.js': null
      })

      const { stderr } = await verify()
      const files = stderr.match(/^ {2}\S+/gm).map((line) => line.trim())

      assert.deepEqual(files, ['dist/css/chassis.css', 'dist/js/chassis.js', 'js/dist/button.js'])
    })
  })

  describe('source maps', () => {
    beforeEach(() => {
      writeFiles(dir, {
        'dist/css/chassis.css.map': '{"version":3,"sources":[]}\n',
        'js/dist/button.d.ts.map': '{"version":3,"sources":[]}\n'
      })
    })

    test('are left out of the comparison', async () => {
      const { status } = await verify()

      assert.equal(status, 0)
    })

    test('are compared with --maps', async () => {
      const { status, stderr } = await verify(['--skip-build', '--maps'])

      assert.equal(status, 1)
      assert.match(stderr, /dist\/css\/chassis\.css\.map \(differs\)/)
      assert.match(stderr, /js\/dist\/button\.d\.ts\.map \(differs\)/)
    })
  })

  describe('a module of js/dist/ without a source module', () => {
    test('fails, with every file of the module, when it is committed', async () => {
      writeFiles(dir, { 'js/src/button.ts': null })
      git(dir, 'add', '--all')
      git(dir, 'commit', '--quiet', '--message', 'refactor: remove the button')

      const { status, stderr } = await verify()

      assert.equal(status, 1)
      assert.match(stderr, /2 committed output files are out of date/)
      assert.match(stderr, /js\/dist\/button\.js \(has no source module\)/)
      assert.match(stderr, /js\/dist\/button\.d\.ts \(has no source module\)/)
    })

    test('fails in a directory of js/dist/', async () => {
      writeFiles(dir, { 'js/src/dom/data.ts': null })

      const { status, stderr } = await verify()

      assert.equal(status, 1)
      assert.match(stderr, /js\/dist\/dom\/data\.js \(has no source module\)/)
    })

    test('names both what is wrong with a file that is not committed either', async () => {
      writeFiles(dir, { 'js/dist/alert.js': 'export default class Alert {}\n' })

      const { status, stderr } = await verify()

      assert.equal(status, 1)
      assert.match(stderr, /js\/dist\/alert\.js \(not committed, has no source module\)/)
    })
  })

  describe('with a build', () => {
    test('runs `pnpm dist` and passes when it writes the committed output', async () => {
      const pnpm = stubPnpm(dir)

      const { status } = await verify([], pnpm.env)

      assert.equal(status, 0)
      assert.deepEqual(pnpm.calls(), ['dist'])
    })

    test('fails when the build writes another output', async () => {
      const pnpm = stubPnpm(dir, 'echo ".chip {}" >> dist/css/chassis.css')

      const { status, stderr } = await verify([], pnpm.env)

      assert.equal(status, 1)
      assert.match(stderr, /dist\/css\/chassis\.css \(differs\)/)
    })

    test('fails when the build fails, and compares nothing', async () => {
      const pnpm = stubPnpm(dir, 'exit 2')

      const { status, stderr } = await verify([], pnpm.env)

      assert.equal(status, 1)
      assert.match(stderr, /The build failed, nothing was compared/)
      assert.doesNotMatch(stderr, /out of date/)
    })
  })
})
