#!/usr/bin/env node

/*!
 * Version Reference Sync Script
 *
 * Copies the version of @chassis-ui/css from package.json into the places that show it but that
 * `changeset version` does not update:
 *
 * - site/config.yml: `current_version` and the download links
 * - js/src/base-component.ts: `BaseComponent.VERSION`
 * - scss/mixins/_banner.scss: the banner of the compiled CSS
 * - dist/ and js/dist/: rebuilt when a banner names another version, and the SRI hashes of the
 *   CDN files in site/config.yml written again for the rebuilt files
 *
 * It also moves the hand-written `## [Unreleased]` section of CHANGELOG.md, from before the move
 * to Changesets, into the entry `changeset version` wrote, and removes the bullet of the changeset
 * that asked for it (UNRELEASED_MARKER). A version step that bumps nothing (only empty changesets)
 * changes nothing.
 *
 * Runs as part of `pnpm changeset:version`, after `changeset version` has bumped package.json,
 * which is the source of the version.
 *
 * Copyright 2025-2026 Ozgur Gunes
 * Licensed under MIT
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'

const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?$/

// The summary of .changeset/unreleased-changelog.md. The bullet that `changeset version` writes
// for it is replaced by the Unreleased section.
const UNRELEASED_MARKER =
  'The changes listed in the Unreleased section of CHANGELOG.md before the move to Changesets.'

// Files that name the version, with the pattern that finds it. The first group is the version.
const VERSION_REFS = [
  { file: 'site/config.yml', pattern: /^current_version:\s*"([^"]+)"/m },
  { file: 'js/src/base-component.ts', pattern: /^const VERSION = '([^']+)'/m },
  { file: 'scss/mixins/_banner.scss', pattern: /Chassis CSS#\{\$-file-suffix\} v(\S+) \(/ }
]

// Files whose banner names the version the build wrote into them
const BANNER_FILES = ['dist/css/chassis.css', 'dist/js/chassis.js', 'js/dist/base-component.js']
const BANNER_RE = /Chassis(?: [\w.-]+)?(?: -)? {1,2}v(\S+) \(/

function regExpQuote(string) {
  return string.replace(/[$()*+-.?[\\\]^{|}]/g, '\\$&')
}

async function readVersion() {
  const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'))

  if (!pkg.version || !SEMVER_RE.test(pkg.version)) {
    console.error(`❌ Invalid or missing version in package.json: "${pkg.version}"`)
    process.exit(1)
  }

  return pkg.version
}

/**
 * Replaces the version a file names with `version`
 * @returns {Promise<boolean>} True if the file changed
 */
async function syncFile({ file, pattern }, version) {
  const original = await fs.readFile(file, 'utf8')
  const match = pattern.exec(original)

  if (!match) {
    console.error(`❌ No version reference found in ${file}`)
    process.exit(1)
  }

  const oldVersion = match[1]
  if (oldVersion === version) {
    return false
  }

  let updated = original.replace(match[0], match[0].replace(oldVersion, version))

  // The download links of site/config.yml name the version too
  if (file === 'site/config.yml') {
    updated = updated.replace(
      new RegExp(`^(\\s+(?:source|dist):\\s+".*)${regExpQuote(oldVersion)}(.*")$`, 'gm'),
      (line) => line.replaceAll(oldVersion, version)
    )
  }

  await fs.writeFile(file, updated, 'utf8')
  console.log(`📄 ${file}: ${oldVersion} → ${version}`)
  return true
}

/**
 * Returns the start and end line of the section that begins with a `## ` line matching
 * `heading`. It ends before the next `## ` heading or the link definitions at the end.
 */
function findSection(lines, heading) {
  const start = lines.findIndex((line) => heading.test(line))
  if (start === -1) {
    return null
  }

  let end = start + 1
  while (end < lines.length && !/^## /.test(lines[end]) && !/^\[[^\]]+\]: /.test(lines[end])) {
    end++
  }

  return { start, end }
}

/**
 * Moves the `## [Unreleased]` section into the entry of `version`
 * @returns {Promise<boolean>} True if CHANGELOG.md changed
 */
async function foldUnreleased(version) {
  const file = 'CHANGELOG.md'
  const lines = (await fs.readFile(file, 'utf8')).split('\n')

  const unreleased = findSection(lines, /^## \[Unreleased\]/)
  // Only the entry `changeset version` writes (`## 0.6.0`), never a hand-written one
  // (`## [0.5.2] - 2026-09-25`) of a version that is already released
  const entry = findSection(lines, new RegExp(`^## ${regExpQuote(version)}$`))
  if (!unreleased || !entry) {
    return false
  }

  const unreleasedBody = lines
    .slice(unreleased.start + 1, unreleased.end)
    .join('\n')
    .trim()

  // The entry without the marker's bullet, and without a `### … Changes` heading it leaves empty
  const markerBullet = new RegExp(`^- (?:[0-9a-f]+: )?${regExpQuote(UNRELEASED_MARKER)}$`)
  const entryLines = lines
    .slice(entry.start + 1, entry.end)
    .filter((line) => !markerBullet.test(line))
  const entryBody = entryLines
    .filter((line, index) => {
      if (!line.startsWith('### ')) {
        return true
      }

      const next = entryLines.slice(index + 1).find((later) => later.trim() !== '')
      return next !== undefined && !next.startsWith('### ')
    })
    .join('\n')
    .trim()

  const merged = [lines[entry.start], '', unreleasedBody, ...(entryBody ? ['', entryBody] : []), '']

  // Replace the later section first, so the line numbers of the other stay valid
  const [first, second] = [unreleased, entry].sort((a, b) => a.start - b.start)
  const replacements = new Map([
    [unreleased, []],
    [entry, merged]
  ])
  lines.splice(second.start, second.end - second.start, ...replacements.get(second))
  lines.splice(first.start, first.end - first.start, ...replacements.get(first))

  const updated = `${lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()}\n`
  await fs.writeFile(file, updated, 'utf8')
  console.log(`📄 ${file}: moved the Unreleased section into ${version}`)
  return true
}

/**
 * Rebuilds dist/ and js/dist/ when a banner names another version, then writes the SRI hashes
 * of the rebuilt CDN files into site/config.yml
 * @returns {Promise<boolean>} True if the output was rebuilt
 */
async function syncBuild(version) {
  let stale = 0

  for (const file of BANNER_FILES) {
    const match = BANNER_RE.exec(await fs.readFile(file, 'utf8'))
    if (!match) {
      console.error(`❌ No version banner found in ${file}`)
      process.exit(1)
    }

    if (match[1] !== version) {
      stale++
    }
  }

  if (stale === 0) {
    return false
  }

  console.log(`🔨 ${stale} banners name another version, rebuilding dist/ and js/dist/`)
  execFileSync('pnpm', ['dist'], { stdio: 'inherit' })
  execFileSync('pnpm', ['release:sri'], { stdio: 'inherit' })
  return true
}

async function main() {
  const version = await readVersion()
  console.log(`🔄 Syncing version references to v${version}`)

  const results = []
  for (const ref of VERSION_REFS) {
    results.push(await syncFile(ref, version))
  }

  results.push(await foldUnreleased(version), await syncBuild(version))
  const updatedCount = results.filter(Boolean).length

  console.log(
    updatedCount > 0
      ? `✅ Synced ${updatedCount} of ${results.length} references`
      : 'ℹ️  Already in sync, nothing to update'
  )
}

main().catch((error) => {
  console.error(`❌ Unexpected error: ${error.message}`)
  process.exit(1)
})
