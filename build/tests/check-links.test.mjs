/*!
 * check-links.test.mjs — the link check of the Markdown files and of the built site.
 *
 * build/check-links.mjs passes when it finds nothing, so a link it does not see looks the same
 * as a link that resolves. These tests give it links that are broken, and links that look
 * broken and are not. Run via `pnpm build:test`.
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import assert from 'node:assert/strict'
import http from 'node:http'
import { after, afterEach, before, beforeEach, describe, test } from 'node:test'
import { createFixture, removeFixture, runScript, writeFiles } from './helpers.mjs'

const SCRIPT = 'build/check-links.mjs'

// The files the script reads: MARKDOWN_FILES of build/check-links.mjs
const MARKDOWN_FILES = [
  'README.md',
  'AGENTS.md',
  'WRITING.md',
  'VERSIONING.md',
  'packages/css/README.md',
  'packages/css/js/tests/README.md',
  '.changeset/README.md',
  '.github/CONTRIBUTING.md',
  '.github/SECURITY.md',
  '.github/CODE_OF_CONDUCT.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.github/ISSUE_TEMPLATE/bug_report.md',
  '.github/ISSUE_TEMPLATE/feature_request.md'
]

const brokenLinks = (stderr) =>
  stderr
    .split('\n')
    .filter((line) => line.startsWith('  '))
    .map((line) => line.trim())

describe('check-links.mjs', () => {
  let dir

  const check = (...args) => runScript(SCRIPT, ['--root', dir, ...args])

  afterEach(() => removeFixture(dir))

  describe('Markdown files', () => {
    beforeEach(() => {
      dir = createFixture(Object.fromEntries(MARKDOWN_FILES.map((file) => [file, '# Title\n'])))
    })

    test('pass when every link resolves', async () => {
      writeFiles(dir, {
        'README.md': [
          '# Chassis CSS',
          '## Quick start',
          '## Quick start',
          '## The [docs](https://chassis-ui.com/css/) `site`',
          '[File](AGENTS.md), [directory](packages/css), [from a directory](.github/SECURITY.md)',
          '[Heading](#quick-start), [the second of its name](#quick-start-1)',
          '[Heading with a link](#the-docs-site)',
          '[Heading of another file](VERSIONING.md#public-api)',
          '[With a title](AGENTS.md "Guidance"), [in brackets](<AGENTS.md>)',
          '[Reference][agents], [mail](mailto:o.gunes@example.com)',
          '',
          '[agents]: AGENTS.md'
        ].join('\n\n'),
        'VERSIONING.md': '# Versioning\n\n## Public API\n',
        '.github/CONTRIBUTING.md': '[Up](../AGENTS.md), [beside](SECURITY.md)\n'
      })

      const { status, stdout, stderr } = await check('--offline')

      assert.equal(stderr, '')
      assert.equal(status, 0)
      assert.match(stdout, /^All links of README\.md, AGENTS\.md/)
    })

    test('fail on a file that does not exist', async () => {
      writeFiles(dir, {
        'README.md': '[Gone](docs/setup.md)\n',
        '.github/CONTRIBUTING.md': '[From the root, not from here](AGENTS.md)\n'
      })

      const { status, stderr } = await check('--offline')

      assert.equal(status, 1)
      assert.match(stderr, /^2 broken links:/)
      assert.deepEqual(brokenLinks(stderr), [
        '.github/CONTRIBUTING.md: AGENTS.md (no such file)',
        'README.md: docs/setup.md (no such file)'
      ])
    })

    test('fail on a heading that does not exist', async () => {
      writeFiles(dir, {
        'README.md': '# Chassis CSS\n\n[Here](#setup), [there](AGENTS.md#commands)\n',
        'AGENTS.md': '# Agents\n\n```md\n## Commands\n```\n'
      })

      const { status, stderr } = await check('--offline')

      assert.equal(status, 1)
      assert.deepEqual(brokenLinks(stderr), [
        'README.md: #setup (no such heading)',
        'README.md: AGENTS.md#commands (no such heading)'
      ])
    })

    test('fail on a reference definition that is broken', async () => {
      writeFiles(dir, { 'README.md': '[Setup][setup]\n\n[setup]: docs/setup.md\n' })

      const { status, stderr } = await check('--offline')

      assert.equal(status, 1)
      assert.deepEqual(brokenLinks(stderr), ['README.md: docs/setup.md (no such file)'])
    })

    test('leave out the links inside code', async () => {
      writeFiles(dir, {
        'README.md': [
          'Write `[Setup](docs/setup.md)` for a link.',
          '```md\n[Setup](docs/setup.md)\n```',
          '~~~md\n[Setup](docs/setup.md)\n~~~'
        ].join('\n\n')
      })

      const { status } = await check('--offline')

      assert.equal(status, 0)
    })

    test('check a file of this repository on GitHub in the working tree', async () => {
      writeFiles(dir, {
        'packages/css/README.md': [
          '[License](https://github.com/chassis-ui/css/blob/main/LICENSE)',
          '[Sass](https://github.com/chassis-ui/css/tree/main/packages/css/scss)',
          '[Tests](https://github.com/chassis-ui/css/blob/main/packages/css/js/tests/README.md#unit)'
        ].join('\n\n'),
        LICENSE: 'MIT\n'
      })

      const { status, stderr } = await check('--offline')

      assert.equal(status, 1)
      assert.deepEqual(brokenLinks(stderr), [
        'packages/css/README.md: https://github.com/chassis-ui/css/tree/main/packages/css/scss (no such file)'
      ])
    })

    test('fail when a file of the list is gone', async () => {
      writeFiles(dir, { 'VERSIONING.md': null })

      const { status, stderr } = await check('--offline')

      assert.notEqual(status, 0)
      assert.match(stderr, /VERSIONING\.md/)
    })

    describe('external URLs', () => {
      let server
      let origin
      let requests

      before(async () => {
        server = http.createServer((request, response) => {
          requests.push(`${request.method} ${request.url}`)

          const found =
            request.url === '/page' || (request.url === '/no-head' && request.method === 'GET')
          response.writeHead(found ? 200 : request.url === '/no-head' ? 405 : 404)
          response.end()
        })

        await new Promise((resolve) => {
          server.listen(0, '127.0.0.1', resolve)
        })
        origin = `http://127.0.0.1:${server.address().port}`
      })

      beforeEach(() => {
        requests = []
      })

      after(() => server.close())

      test('pass when the server has the page', async () => {
        writeFiles(dir, { 'README.md': `[Page](${origin}/page)\n` })

        const { status } = await check()

        assert.equal(status, 0)
        assert.deepEqual(requests, ['HEAD /page'])
      })

      test('pass when the server refuses HEAD and answers GET', async () => {
        writeFiles(dir, { 'README.md': `[Page](${origin}/no-head)\n` })

        const { status } = await check()

        assert.equal(status, 0)
        assert.deepEqual(requests, ['HEAD /no-head', 'GET /no-head'])
      })

      test('fail on a page that is gone, in every file that names it', async () => {
        writeFiles(dir, {
          'README.md': `[Page](${origin}/gone)\n`,
          'AGENTS.md': `[Page](${origin}/gone), [again](${origin}/gone)\n`
        })

        const { status, stderr } = await check()

        assert.equal(status, 1)
        assert.deepEqual(brokenLinks(stderr), [
          `AGENTS.md: ${origin}/gone (404)`,
          `README.md: ${origin}/gone (404)`
        ])
        assert.deepEqual(requests, ['HEAD /gone'])
      })

      test('are not requested with --offline', async () => {
        writeFiles(dir, { 'README.md': `[Page](${origin}/gone)\n` })

        const { status } = await check('--offline')

        assert.equal(status, 0)
        assert.deepEqual(requests, [])
      })
    })
  })

  describe('the built site', () => {
    const page = (body) => `<!doctype html><html><body>${body}</body></html>\n`

    beforeEach(() => {
      dir = createFixture({
        '_site/css/index.html': page('<h1 id="chassis">Chassis</h1>'),
        '_site/css/docs/components/button/index.html': page('<h2 id="sizes">Sizes</h2>'),
        '_site/css/docs/legacy.html': page('<a name="old">Old</a>'),
        '_site/css/docs/docs.css': 'body {}\n',
        // The files of the build are requested under /css/static/astro and served from
        // /static/astro
        '_site/static/astro/docs.js': 'export {}\n'
      })
    })

    const checkPage = (body) => {
      writeFiles(dir, { '_site/css/docs/index.html': page(body) })
      return check('--site')
    }

    test('passes when every link resolves', async () => {
      const { status, stdout, stderr } = await checkPage(`
        <link href="/css/docs/docs.css" rel="stylesheet">
        <link href="/static/docs.css" rel="stylesheet">
        <script type="module" src="/css/static/astro/docs.js"></script>
        <a href="/css">Home</a> <a href="/css/">Home</a> <a href="/css/#chassis">Chassis</a>
        <a href="/css/docs/components/button/">Button</a>
        <a href="/css/docs/components/button">Button</a>
        <a href="/css/docs/components/button/#sizes">Sizes</a>
        <a href="components/button/#sizes">Relative</a> <a href="../">Up</a>
        <a href="/css/docs/legacy">Without the extension</a>
        <a href="/css/docs/legacy.html#old">A named anchor</a>
        <a href="/css/docs/components/button/?a=1&amp;b=2#sizes">With a query</a>
        <a href="#top-of-this-page" id="top-of-this-page">Here</a>
      `)

      assert.equal(stderr, '')
      assert.equal(status, 0)
      assert.match(stdout, /All links of _site\/css\/ resolve/)
    })

    test('fails on a page or a file that does not exist', async () => {
      const { status, stderr } = await checkPage(`
        <a href="/css/docs/components/badge/">Badge</a>
        <script src="/css/docs/docs.js"></script>
        <script type="module" src="/css/static/astro/missing.js"></script>
      `)

      assert.equal(status, 1)
      assert.deepEqual(brokenLinks(stderr), [
        '_site/css/docs/index.html: /css/docs/components/badge/ (no such page or file)',
        '_site/css/docs/index.html: /css/docs/docs.js (no such page or file)',
        '_site/css/docs/index.html: /css/static/astro/missing.js (no such page or file)'
      ])
    })

    test('fails on an anchor that does not exist', async () => {
      const { status, stderr } = await checkPage(`
        <a href="/css/docs/components/button/#variants">Variants</a>
        <a href="#missing">Here</a>
      `)

      assert.equal(status, 1)
      assert.deepEqual(brokenLinks(stderr), [
        '_site/css/docs/index.html: #missing (no such anchor)',
        '_site/css/docs/index.html: /css/docs/components/button/#variants (no such anchor)'
      ])
    })

    test('leaves out the links to other sites and to the rest of the domain', async () => {
      const { status } = await checkPage(`
        <a href="https://github.com/chassis-ui/css">GitHub</a>
        <a href="//cdn.jsdelivr.net/npm/@chassis-ui/css">CDN</a>
        <a href="mailto:o.gunes@example.com">Mail</a>
        <a href="/tokens/docs/">Tokens</a> <a href="/">Chassis</a>
      `)

      assert.equal(status, 0)
    })

    test('fails when the site is not built', async () => {
      removeFixture(dir)
      dir = createFixture()

      const { status, stderr } = await check('--site')

      assert.equal(status, 1)
      assert.match(stderr, /_site\/css\/ does not exist\. Run `pnpm site:build` first/)
    })
  })
})
