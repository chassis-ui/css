#!/usr/bin/env node

/*!
 * Dist Verification Script
 *
 * `npm publish` ships dist/ and js/dist/ as committed, with no build step of its own. This
 * script rebuilds them and fails when the result differs from what is committed, so a release
 * cannot hold output that is older than its source. It also fails when js/dist/ holds a file
 * that no longer has a source module, which a rebuild does not remove.
 *
 * Source maps are left out of the comparison by default: they follow the output, and a
 * difference in a map alone changes nothing a project runs.
 *
 * Usage:
 *   node build/verify-dist.js [--skip-build] [--maps]
 *
 *   --skip-build  Compare the output that is on disk, without building
 *   --maps        Compare the source maps too
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT
 */

import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import picocolors from 'picocolors'

// The committed output, as listed in `files` of package.json
const OUTPUT_DIRS = ['dist/css', 'dist/tailwind', 'dist/js', 'js/dist']

// Where the modules in js/dist/ come from, one source file per module
const PLUGIN_DIST_DIR = 'js/dist'
const PLUGIN_SRC_DIR = 'js/src'
const PLUGIN_OUTPUT_RE = /\.(?:d\.ts\.map|d\.ts|js\.map|js)$/

const STATUS_LABELS = {
  '?': 'not committed',
  A: 'not committed',
  D: 'missing',
  M: 'differs'
}

const { values: options } = parseArgs({
  options: {
    'skip-build': { type: 'boolean', default: false },
    maps: { type: 'boolean', default: false }
  }
})

function build() {
  console.log(picocolors.cyan('Building dist/ and js/dist/…'))

  const { status } = spawnSync('pnpm', ['dist'], { stdio: 'inherit' })

  if (status !== 0) {
    console.error(picocolors.red('The build failed, nothing was compared'))
    process.exit(1)
  }
}

/**
 * The files of the output directories that differ from the last commit
 * @returns {{ file: string, label: string }[]} One entry per file, with what is wrong with it
 */
function changedFiles() {
  const output = execFileSync(
    'git',
    ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--', ...OUTPUT_DIRS],
    { encoding: 'utf8' }
  )
  const entries = output.split('\0').filter(Boolean)
  const files = []

  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index]
    const status = entry.slice(0, 2)
    const file = entry.slice(3)

    // A rename or copy is followed by the path it came from
    if (status.includes('R') || status.includes('C')) {
      index++
    }

    const code = status.trim().at(-1)

    files.push({ file, label: STATUS_LABELS[code] ?? `status ${status.trim()}` })
  }

  return files
}

/**
 * The files of js/dist/ whose source module is gone
 * @returns {{ file: string, label: string }[]} One entry per file
 */
function orphanedFiles() {
  if (!fs.existsSync(PLUGIN_DIST_DIR)) {
    return []
  }

  return fs
    .readdirSync(PLUGIN_DIST_DIR, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && PLUGIN_OUTPUT_RE.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .filter((file) => {
      const module = path.relative(PLUGIN_DIST_DIR, file).replace(PLUGIN_OUTPUT_RE, '')

      return !fs.existsSync(path.join(PLUGIN_SRC_DIR, `${module}.ts`))
    })
    .map((file) => ({ file: file.split(path.sep).join('/'), label: 'has no source module' }))
}

if (!options['skip-build']) {
  build()
}

// One entry per file: a file without a source module is often not committed either
const labels = new Map()

for (const { file, label } of [...changedFiles(), ...orphanedFiles()]) {
  if (options.maps || !file.endsWith('.map')) {
    labels.set(file, labels.has(file) ? `${labels.get(file)}, ${label}` : label)
  }
}

const problems = [...labels]
  .map(([file, label]) => ({ file, label }))
  .sort((a, b) => a.file.localeCompare(b.file))

if (problems.length === 0) {
  console.log(picocolors.green(`✅ ${OUTPUT_DIRS.join(', ')} match a fresh build`))
  process.exit(0)
}

console.error(picocolors.red(`❌ ${problems.length} committed output files are out of date:`))

for (const { file, label } of problems) {
  console.error(`  ${file} ${picocolors.dim(`(${label})`)}`)
}

console.error('\nRun `pnpm dist`, review the changes and commit them with the source change.')
process.exit(1)
