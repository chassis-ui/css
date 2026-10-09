/*!
 * package.test.mjs — what a project gets when it installs @chassis-ui/css.
 *
 * Packs the package as `npm publish` would, unpacks it into the node_modules/ of an empty
 * project, and checks it from there: what each documented import resolves to, that the
 * JavaScript entry links, and that a strict TypeScript project can use the types. The tests
 * of this repository read the source tree, where a file that `files` or `exports` of
 * package.json leaves out is still on disk.
 *
 * Run via `pnpm js:test:integration:package`. Reads dist/ and js/dist/ as they are on disk;
 * run `pnpm dist` first after a source change.
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { after, before, describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

// What the package imports, or its types do, and a project has installed next to it
const INSTALLED_WITH_IT = [
  '@floating-ui/dom',
  'vanilla-calendar-pro',
  'postcss',
  'postcss-prefix-custom-properties'
]

// The import a project writes, and the file of the package it must get
const RESOLVES_TO = {
  '@chassis-ui/css': 'js/dist/index.js',
  '@chassis-ui/css/js/dist/tooltip.js': 'js/dist/tooltip.js',
  '@chassis-ui/css/js/dist/util/sanitizer.js': 'js/dist/util/sanitizer.js',
  '@chassis-ui/css/dist/js/chassis.js': 'dist/js/chassis.js',
  '@chassis-ui/css/dist/js/chassis.bundle.min.js': 'dist/js/chassis.bundle.min.js',
  '@chassis-ui/css/dist/css/chassis.min.css': 'dist/css/chassis.min.css',
  '@chassis-ui/css/scss/chassis.scss': 'scss/chassis.scss',
  '@chassis-ui/css/scss/tailwind/index.scss': 'scss/tailwind/index.scss',
  '@chassis-ui/css/postcss': 'postcss/index.js',
  '@chassis-ui/css/tailwind': 'dist/tailwind/index.css',
  '@chassis-ui/css/tailwind/merge.js': 'dist/tailwind/merge.js',
  '@chassis-ui/css/tailwind/bridge.css': 'dist/tailwind/bridge.css',
  '@chassis-ui/css/tailwind/safelist.css': 'dist/tailwind/safelist.css',
  '@chassis-ui/css/package.json': 'package.json'
}

// Not part of the package's interface: the TypeScript source ships for the source maps only
const NOT_EXPORTED = ['@chassis-ui/css/js/src/tooltip.ts', '@chassis-ui/css/js/src/index.ts']

// The globals of a browser. The plugins read them when their module runs, so Node.js stops
// there; by then it has resolved and parsed every module, and matched every import to an
// export.
const BROWSER_GLOBAL_RE = /^(document|window|navigator|HTMLElement|Element|Node) is not defined$/

let project
let packageDir

/**
 * Runs a module in the project, as a file of the project would run
 * @param {string} code - The module's source
 * @returns {{ status: number | null, stdout: string, stderr: string }} The result of the process
 */
function runInProject(code) {
  const { status, stdout, stderr } = spawnSync(
    process.execPath,
    ['--input-type=module', '--eval', code],
    { cwd: project, encoding: 'utf8' }
  )

  return { status, stdout: stdout.trim(), stderr: stderr.trim() }
}

before(() => {
  project = fs.mkdtempSync(path.join(os.tmpdir(), 'chassis-css-package-'))
  packageDir = path.join(project, 'node_modules/@chassis-ui/css')

  const [{ filename }] = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--pack-destination', project], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    })
  )

  fs.mkdirSync(packageDir, { recursive: true })
  execFileSync('tar', [
    '-xzf',
    path.join(project, filename),
    '-C',
    packageDir,
    '--strip-components=1'
  ])

  for (const name of INSTALLED_WITH_IT) {
    const link = path.join(project, 'node_modules', name)

    fs.mkdirSync(path.dirname(link), { recursive: true })
    // The real path, so that the package finds its own dependencies in pnpm's store
    fs.symlinkSync(fs.realpathSync(path.join(root, 'node_modules', name)), link, 'dir')
  }

  fs.writeFileSync(
    path.join(project, 'package.json'),
    JSON.stringify({ name: 'chassis-css-consumer', private: true, type: 'module' })
  )
})

after(() => {
  fs.rmSync(project, { recursive: true, force: true })
})

describe('the installed package', () => {
  test('holds no test, build or site file', () => {
    const unexpected = fs
      .readdirSync(packageDir, { recursive: true })
      .map((file) => file.split(path.sep).join('/'))
      .filter((file) => /(^|\/)(tests?|build|site|node_modules|coverage)\//.test(file))

    assert.deepEqual(unexpected, [])
  })

  test('every source map names files that are in the package, or come from a dependency', () => {
    const unresolved = []

    for (const file of fs.readdirSync(packageDir, { recursive: true })) {
      if (!file.endsWith('.map')) {
        continue
      }

      const map = JSON.parse(fs.readFileSync(path.join(packageDir, file), 'utf8'))

      assert.equal(map.sourcesContent, undefined, `${file} holds a copy of its sources`)

      for (const source of map.sources) {
        const isGenerated = source === '<no source>' || source === path.basename(file, '.map')
        const isDependency = source.includes('node_modules/')
        const target = path.join(packageDir, path.dirname(file), map.sourceRoot ?? '', source)

        if (!isGenerated && !isDependency && !fs.existsSync(target)) {
          unresolved.push(`${file} -> ${source}`)
        }
      }
    }

    assert.deepEqual(unresolved, [])
  })
})

describe('imports from a project', () => {
  for (const [specifier, file] of Object.entries(RESOLVES_TO)) {
    test(`${specifier} resolves to ${file}`, () => {
      const { status, stdout, stderr } = runInProject(
        `console.log(import.meta.resolve(${JSON.stringify(specifier)}))`
      )

      assert.equal(status, 0, stderr)

      const resolved = fs.realpathSync(fileURLToPath(stdout))

      assert.equal(resolved, fs.realpathSync(path.join(packageDir, file)))
    })
  }

  for (const specifier of NOT_EXPORTED) {
    test(`${specifier} is not importable`, () => {
      const { status, stderr } = runInProject(
        `console.log(import.meta.resolve(${JSON.stringify(specifier)}))`
      )

      assert.notEqual(status, 0)
      assert.match(stderr, /ERR_PACKAGE_PATH_NOT_EXPORTED/)
    })
  }

  test('the JavaScript entry links: every import of every module finds its export', () => {
    const { stdout, stderr } = runInProject(`
      try {
        const chassis = await import('@chassis-ui/css')
        console.log('ran: ' + Object.keys(chassis).join(','))
      } catch (error) {
        console.log(error.name + ': ' + error.message)
      }
    `)

    assert.equal(stderr, '')

    if (stdout.startsWith('ran: ')) {
      assert.ok(stdout.includes('Tooltip'))
      return
    }

    const [name, message] = stdout.split(': ')

    assert.equal(name, 'ReferenceError', stdout)
    assert.match(message, BROWSER_GLOBAL_RE, stdout)
  })

  test('the PostCSS preset runs', () => {
    const { status, stdout, stderr } = runInProject(`
      import postcss from 'postcss'
      import { chassisPostcss } from '@chassis-ui/css/postcss'

      const { css } = await postcss(chassisPostcss()).process(':root { --primary: red }', {
        from: undefined
      })

      console.log(css)
    `)

    assert.equal(status, 0, stderr)
    assert.match(stdout, /--cx-primary: red/)
  })
})

describe('types in a strict TypeScript project', () => {
  const source = `
    import { Dialog, Tooltip, type Carousel } from '@chassis-ui/css'
    import Menu from '@chassis-ui/css/js/dist/menu.js'
    import type { TooltipConfig } from '@chassis-ui/css/js/dist/tooltip.js'
    import { chassisPostcss, type ChassisPrefixOptions } from '@chassis-ui/css/postcss'

    declare const element: HTMLElement
    declare const carousel: Carousel

    const config: Partial<TooltipConfig> = { animation: false }
    const tooltip: Tooltip = new Tooltip(element, config)
    const dialog: Dialog | null = Dialog.getInstance(element)
    const menu: Menu = Menu.getOrCreateInstance(element)
    const options: ChassisPrefixOptions = { prefix: 'acme-' }

    tooltip.show()
    dialog?.hide()
    menu.toggle()
    carousel.next()
    chassisPostcss(options)

    // @ts-expect-error - a type error, to prove that the types are not \`any\`
    tooltip.show(1, 2, 3)
  `

  for (const [module, moduleResolution] of [
    ['nodenext', 'nodenext'],
    ['esnext', 'bundler']
  ]) {
    test(`with moduleResolution ${moduleResolution}`, () => {
      const dir = path.join(project, moduleResolution)

      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(path.join(dir, 'consumer.ts'), source)
      fs.writeFileSync(
        path.join(dir, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            target: 'es2022',
            module,
            moduleResolution,
            lib: ['es2022', 'dom', 'dom.iterable'],
            types: [],
            noEmit: true,
            strict: true,
            // Settings that are stricter than those of this repository, and check the
            // declaration files of the package too
            skipLibCheck: false,
            exactOptionalPropertyTypes: true,
            noUncheckedIndexedAccess: true,
            noImplicitOverride: true,
            noPropertyAccessFromIndexSignature: true
          },
          files: ['consumer.ts']
        })
      )

      const { status, stdout } = spawnSync(
        process.execPath,
        [path.join(root, 'node_modules/typescript/bin/tsc'), '--project', dir, '--pretty', 'false'],
        { cwd: dir, encoding: 'utf8' }
      )

      assert.equal(status, 0, stdout)
    })
  }
})
