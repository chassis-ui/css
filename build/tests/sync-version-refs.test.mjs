/*!
 * sync-version-refs.test.mjs — the version step, after `changeset version`.
 *
 * build/sync-version-refs.js runs in `pnpm changeset:version` only. It writes the
 * version into the files that show it, moves the hand-written Unreleased section of the
 * CHANGELOG into the first Changesets entry, and rebuilds the output when a banner names
 * another version. Run via `pnpm build:test`.
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'
import {
  createFixture,
  readFile,
  removeFixture,
  runScript,
  stubPnpm,
  writeFiles
} from './helpers.mjs'

const SCRIPT = 'build/sync-version-refs.js'

const MARKER =
  'The changes listed in the Unreleased section of CHANGELOG.md before the move to Changesets.'

const SITE_CONFIG = 'packages/site/config.yml'
const BASE_COMPONENT = 'packages/css/js/src/base-component.ts'
const BANNER = 'packages/css/scss/mixins/_banner.scss'
const CHANGELOG = 'packages/css/CHANGELOG.md'

const siteConfig = (version) => `currentVersion:         "${version}"
repo:                   "https://github.com/chassis-ui/css"

download:
  source:               "https://github.com/chassis-ui/css/archive/v${version}.zip"
  dist:                 "https://github.com/chassis-ui/css/releases/download/v${version}/chassis-css-${version}-dist.zip"

cdn:
  css:                  "https://cdn.jsdelivr.net/npm/@chassis-ui/css@${version}/dist/css/chassis.min.css"
  cssHash:              "sha384-PawGlnA"
  js:                   "https://cdn.jsdelivr.net/npm/@chassis-ui/css@${version}/dist/js/chassis.min.js"
  floatingUi:           "https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.7.6/dist/floating-ui.dom.esm.min.js"
  vanillaCalendarPro:   "https://cdn.jsdelivr.net/npm/vanilla-calendar-pro@3.1.0/index.mjs"
`

const RELEASED = `## [0.5.2] - 2026-09-25

### Fixed

- An old fix

---

[0.5.2]: https://github.com/chassis-ui/css/compare/v0.5.1...v0.5.2
`

const UNRELEASED = `## [Unreleased]

### Added

- A new class

### Fixed

- A new fix
`

/**
 * The files the script reads
 * @param {object} versions
 * @param {string} versions.version - The version of package.json
 * @param {string} [versions.references] - The version the other files name
 * @param {string} [versions.banners] - The version the banners of the output name
 * @param {string} [versions.changelog] - The CHANGELOG
 */
function files({ version, references = version, banners = references, changelog = RELEASED }) {
  return {
    'packages/css/package.json': `${JSON.stringify({ name: '@chassis-ui/css', version })}\n`,
    [CHANGELOG]: `# Changelog\n\n${changelog}`,
    [SITE_CONFIG]: siteConfig(references),
    [BASE_COMPONENT]: `import Data from './dom/data.js'\n\nconst VERSION = '${references}'\n`,
    [BANNER]: `/*!\n  * Chassis CSS#{$-file-suffix} v${references} (https://chassis-ui.com/)\n  */\n`,
    'packages/css/dist/css/chassis.css': `@charset "UTF-8";\n/*!\n  * Chassis CSS -  v${banners} (https://chassis-ui.com/)\n  */\n`,
    'packages/css/dist/js/chassis.js': `/*!\n* Chassis v${banners} (https://chassis-ui.com)\n*/\n`,
    'packages/css/js/dist/base-component.js': `/*!\n* Chassis base-component.js v${banners} (https://chassis-ui.com)\n*/\n`
  }
}

describe('sync-version-refs.js', () => {
  let dir
  let pnpm

  function setup(versions) {
    dir = createFixture(files(versions))
    pnpm = stubPnpm(dir)
  }

  const sync = () => runScript(SCRIPT, [], { cwd: dir, env: pnpm.env })

  afterEach(() => removeFixture(dir))

  describe('version references', () => {
    test('writes the version of package.json into the files that name it', async () => {
      setup({ version: '0.6.0', references: '0.5.2' })

      const { status } = await sync()

      assert.equal(status, 0)
      assert.equal(readFile(dir, SITE_CONFIG), siteConfig('0.6.0'))
      assert.match(readFile(dir, BASE_COMPONENT), /^const VERSION = '0\.6\.0'$/m)
      assert.match(readFile(dir, BANNER), /Chassis CSS#\{\$-file-suffix\} v0\.6\.0 \(/)
    })

    test('leaves the versions of other packages', async () => {
      setup({ version: '1.7.6', references: '1.7.5' })
      writeFiles(dir, { [SITE_CONFIG]: siteConfig('1.7.5').replace('dom@1.7.6', 'dom@1.7.5') })

      await sync()

      assert.match(readFile(dir, SITE_CONFIG), /@floating-ui\/dom@1\.7\.5\//)
      assert.match(readFile(dir, SITE_CONFIG), /@chassis-ui\/css@1\.7\.6\/dist\/js/)
    })

    test('writes a prerelease version', async () => {
      setup({ version: '0.6.0-beta.1', references: '0.5.2' })

      const { status } = await sync()

      assert.equal(status, 0)
      assert.equal(readFile(dir, SITE_CONFIG), siteConfig('0.6.0-beta.1'))
    })

    test('changes nothing when every file names the version', async () => {
      setup({ version: '0.5.2' })
      const before = files({ version: '0.5.2' })

      const { status, stdout } = await sync()

      assert.equal(status, 0)
      assert.match(stdout, /Already in sync/)
      for (const [file, content] of Object.entries(before)) {
        assert.equal(readFile(dir, file), content, file)
      }

      assert.deepEqual(pnpm.calls(), [])
    })

    test('fails on a version that is not one', async () => {
      setup({ version: 'next', references: '0.5.2' })

      const { status, stderr } = await sync()

      assert.equal(status, 1)
      assert.match(stderr, /Invalid or missing version/)
      assert.equal(readFile(dir, SITE_CONFIG), siteConfig('0.5.2'))
    })

    test('fails when a file no longer names a version', async () => {
      setup({ version: '0.6.0', references: '0.5.2' })
      writeFiles(dir, { [BASE_COMPONENT]: "export const version = '0.5.2'\n" })

      const { status, stderr } = await sync()

      assert.equal(status, 1)
      assert.match(
        stderr,
        /No version reference found in packages\/css\/js\/src\/base-component\.ts/
      )
    })
  })

  describe('the output', () => {
    test('is rebuilt, with its SRI hashes, when a banner names another version', async () => {
      setup({ version: '0.6.0', references: '0.5.2' })

      const { status } = await sync()

      assert.equal(status, 0)
      assert.deepEqual(pnpm.calls(), ['dist', 'release:sri'])
    })

    test('is rebuilt when only the banners are behind', async () => {
      setup({ version: '0.6.0', references: '0.6.0', banners: '0.5.2' })

      await sync()

      assert.deepEqual(pnpm.calls(), ['dist', 'release:sri'])
    })

    test('is rebuilt when one banner is behind', async () => {
      setup({ version: '0.6.0' })
      writeFiles(dir, {
        'packages/css/js/dist/base-component.js':
          '/*!\n* Chassis base-component.js v0.5.2 (https://chassis-ui.com)\n*/\n'
      })

      await sync()

      assert.deepEqual(pnpm.calls(), ['dist', 'release:sri'])
    })

    test('fails when the build fails', async () => {
      setup({ version: '0.6.0', references: '0.5.2' })
      pnpm = stubPnpm(dir, 'exit 1')

      const { status } = await sync()

      assert.equal(status, 1)
      assert.deepEqual(pnpm.calls(), ['dist'])
    })

    test('fails when an output file has no banner', async () => {
      setup({ version: '0.6.0', references: '0.5.2' })
      writeFiles(dir, { 'packages/css/dist/js/chassis.js': 'export {}\n' })

      const { status, stderr } = await sync()

      assert.equal(status, 1)
      assert.match(stderr, /No version banner found in packages\/css\/dist\/js\/chassis\.js/)
    })
  })

  describe('the Unreleased section of the CHANGELOG', () => {
    const entry = (body) => `## 0.6.0\n\n${body}\n`

    test('moves into the entry of the version, in place of the bullet that asked for it', async () => {
      setup({
        version: '0.6.0',
        changelog: [
          entry(
            `### Minor Changes\n\n- abc1234: ${MARKER}\n\n### Patch Changes\n\n- def5678: A fix`
          ),
          UNRELEASED,
          RELEASED
        ].join('\n')
      })

      const { status } = await sync()

      assert.equal(status, 0)
      assert.equal(
        readFile(dir, CHANGELOG),
        `# Changelog

## 0.6.0

### Added

- A new class

### Fixed

- A new fix

### Patch Changes

- def5678: A fix

${RELEASED}`
      )
    })

    test('replaces an entry that holds the bullet alone', async () => {
      setup({
        version: '0.6.0',
        changelog: [entry(`### Minor Changes\n\n- ${MARKER}`), UNRELEASED, RELEASED].join('\n')
      })

      await sync()

      assert.equal(
        readFile(dir, CHANGELOG),
        `# Changelog\n\n## 0.6.0\n\n${UNRELEASED.replace('## [Unreleased]\n\n', '')}\n${RELEASED}`
      )
    })

    test('moves up when the section is above the entry', async () => {
      setup({
        version: '0.6.0',
        changelog: [UNRELEASED, entry(`### Minor Changes\n\n- abc1234: ${MARKER}`), RELEASED].join(
          '\n'
        )
      })

      await sync()

      assert.equal(
        readFile(dir, CHANGELOG),
        `# Changelog\n\n## 0.6.0\n\n${UNRELEASED.replace('## [Unreleased]\n\n', '')}\n${RELEASED}`
      )
    })

    test('stays when the entry of the version is a released, hand-written one', async () => {
      const changelog = [UNRELEASED, RELEASED].join('\n')
      setup({ version: '0.5.2', changelog })

      const { status, stdout } = await sync()

      assert.equal(status, 0)
      assert.match(stdout, /Already in sync/)
      assert.equal(readFile(dir, CHANGELOG), `# Changelog\n\n${changelog}`)
    })

    test('is moved once: a second run changes nothing', async () => {
      setup({
        version: '0.6.0',
        changelog: [entry(`### Minor Changes\n\n- abc1234: ${MARKER}`), UNRELEASED, RELEASED].join(
          '\n'
        )
      })

      await sync()
      const first = readFile(dir, CHANGELOG)
      const { stdout } = await sync()

      assert.match(stdout, /Already in sync/)
      assert.equal(readFile(dir, CHANGELOG), first)
    })

    test('leaves a CHANGELOG without the section as it is', async () => {
      const changelog = [entry('### Patch Changes\n\n- def5678: A fix'), RELEASED].join('\n')
      setup({ version: '0.6.0', changelog })

      await sync()

      assert.equal(readFile(dir, CHANGELOG), `# Changelog\n\n${changelog}`)
    })
  })
})
