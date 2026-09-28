#!/usr/bin/env node

/*!
 * check-isolation.mjs — keeps native Chassis Sass independent of the
 * Tailwind entry.
 *
 * Tailwind code (scss/tailwind/, scss/tests/tailwind/) may load native
 * modules, but nothing else may load a module from scss/tailwind/: a native
 * build that pulls in Tailwind mixins or partials would carry Tailwind-only
 * code into dist/css. Fails on any `@use`/`@forward`/`@import` outside the
 * Tailwind folders that resolves into scss/tailwind/.
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(fileURLToPath(import.meta.url), '../../..')
const tailwindDir = path.join(root, 'scss/tailwind')
// The Sass of the package, and that of the docs site in packages/site
const scanDirs = ['scss', '../site/src/scss'].map((dir) => path.join(root, dir))
const allowedDirs = [tailwindDir, path.join(root, 'scss/tests/tailwind')]

const LOAD_RE = /^\s*@(?:use|forward|import)\s+["']([^"']+)["']/gm

function isInside(file, dir) {
  const relative = path.relative(dir, file)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function* scssFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* scssFiles(entryPath)
    else if (entry.name.endsWith('.scss')) yield entryPath
  }
}

const violations = []
for (const dir of scanDirs) {
  for (const file of scssFiles(dir)) {
    if (allowedDirs.some((allowed) => isInside(file, allowed))) continue
    for (const [, url] of readFileSync(file, 'utf8').matchAll(LOAD_RE)) {
      if (url.startsWith('sass:')) continue
      const loadsTailwind = url.startsWith('.')
        ? isInside(path.resolve(path.dirname(file), url), tailwindDir)
        : /(^|\/)scss\/tailwind(\/|$)/.test(url)
      if (loadsTailwind) violations.push(`${path.relative(root, file)}: loads "${url}"`)
    }
  }
}

if (violations.length > 0) {
  console.error(
    `Native Chassis Sass must not load modules from scss/tailwind/:\n  ${violations.join('\n  ')}`
  )
  process.exit(1)
}

console.log('Native Chassis Sass loads nothing from scss/tailwind/.')
