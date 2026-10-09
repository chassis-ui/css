#!/usr/bin/env node

/*!
 * test-safelist.mjs — Node-only regression test for the opt-in safelist of
 * the Tailwind entry (dist/tailwind/safelist.css): the `@source inline()`
 * rules for the responsive layout classes, for a project whose class names
 * are built at runtime.
 *
 * Compiles the real dist/tailwind/index.css with and without the safelist,
 * using the real `@tailwindcss/node` compiler and no candidate at all, and
 * compares the names of the safelist with the classes dist/css/chassis.css
 * has at a breakpoint: markup that a JavaScript layer renders carries the
 * class names of the regular build, so a name the regular build has not is a
 * mistake, and so is a placement class of `.grid` the safelist has not.
 *
 * Run via `pnpm css:test:tailwind` (wired into `pnpm test`).
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import { compile } from '@tailwindcss/node'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { before, describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../..')
const fixtureDir = path.join(here, 'fixture')

const safelistCss = readFileSync(path.join(root, 'dist/tailwind/safelist.css'), 'utf8')

// The breakpoint and container-query prefixes of the default `$breakpoints`.
const PREFIX = /^@?(?:sm|md|lg|xl|2xl):/

// Expands the brace groups of an `@source inline()` pattern as Tailwind does,
// for the two forms the safelist writes: a list (`{a,b}`, with an empty item
// for the unprefixed name) and a range (`{1..12}`).
function expand(pattern) {
  const group = /\{([^{}]*)\}/.exec(pattern)
  if (!group) return [pattern]

  const range = /^(\d+)\.\.(\d+)$/.exec(group[1])
  const items = range
    ? Array.from({ length: range[2] - range[1] + 1 }, (_, i) => String(Number(range[1]) + i))
    : group[1].split(',')

  const head = pattern.slice(0, group.index)
  const tail = pattern.slice(group.index + group[0].length)
  return items.flatMap((item) => expand(head + item + tail))
}

// The class names in the selectors of `css`, unescaped (`.\32 xl\:w-6\/12` is
// `2xl:w-6/12`), that `filter` keeps, with the layer of each rule. Of a
// compound selector only the first class counts: the next one is the
// companion of a compound utility (`.font-5xl.font-display`), not a class the
// rule generates.
function classNames(css, filter) {
  const names = new Set()
  postcss.parse(css).walkRules((rule) => {
    let layer = null
    for (let node = rule.parent; node; node = node.parent) {
      if (node.type === 'atrule' && node.name === 'layer') layer = node.params
    }

    for (const match of rule.selector.matchAll(
      /(?<![\w)\]-])\.((?:\\[0-9a-f]{1,6} ?|\\.|[\w-])+)/g
    )) {
      const name = match[1]
        .replace(/\\([0-9a-f]{1,6}) ?/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/\\/g, '')
      if (filter(name, layer)) names.add(name)
    }
  })
  return names
}

async function buildWithoutCandidates(css) {
  const compiler = await compile(css, { base: fixtureDir, onDependency: () => {} })
  return compiler.build([])
}

const patterns = [...safelistCss.matchAll(/@source inline\("([^"]+)"\);/g)].map((m) => m[1])
const safelisted = new Set(patterns.flatMap(expand))

let withSafelist
let withoutSafelist

before(async () => {
  const entry = '@import "@chassis-ui/css/tailwind";\n@source not ".";\n'
  withoutSafelist = classNames(await buildWithoutCandidates(entry), () => true)
  withSafelist = classNames(
    await buildWithoutCandidates(`${entry}@import "@chassis-ui/css/tailwind/safelist.css";\n`),
    () => true
  )
})

describe('dist/tailwind/safelist.css', () => {
  test('holds nothing but @source inline() rules, under its banner', () => {
    const rest = safelistCss
      .replace(/^\/\*![\s\S]*?\*\/\n/, '')
      .replace(/@source inline\("[^"\s]+"\);\n?/g, '')
    assert.equal(rest, '')
    assert.equal(
      patterns.length,
      21,
      'the eight lines of the grid and the thirteen layout utilities'
    )
  })

  test('the default entry generates none of its classes at a breakpoint: the safelist is opt-in', () => {
    const generated = [...safelisted].filter(
      (name) => PREFIX.test(name) && withoutSafelist.has(name)
    )
    assert.deepEqual(generated, [])
  })

  test('every name generates a rule, at the viewport and at the container prefixes', () => {
    // Tailwind drops a candidate that is no utility without a word.
    const missing = [...safelisted].filter((name) => !withSafelist.has(name))
    assert.deepEqual(missing, [])

    for (const name of ['col-span-6', 'md:col-span-3', '@md:col-span-3', '2xl:col-end-13']) {
      assert.ok(withSafelist.has(name), `expected ${name}`)
    }
    for (const name of ['md:flex-column', '@2xl:gap-md', 'lg:w-6/12', 'sm:grid-cols-3']) {
      assert.ok(withSafelist.has(name), `expected ${name}`)
    }
  })

  test('adds nothing but its own names to the build', () => {
    const added = [...withSafelist].filter(
      (name) => !withoutSafelist.has(name) && !safelisted.has(name)
    )
    assert.deepEqual(added, [])
  })

  test('its names at a breakpoint are classes of the regular build, with every placement class of .grid', () => {
    const chassisCss = readFileSync(path.join(root, 'dist/css/chassis.css'), 'utf8')
    const isPlacement = (name) => /:(?:col|row)-/.test(name)
    const regular = classNames(
      chassisCss,
      (name, layer) =>
        PREFIX.test(name) && (layer === 'utilities' || (layer === 'layout' && isPlacement(name)))
    )
    const placement = [...regular].filter(isPlacement)
    const responsive = new Set([...safelisted].filter((name) => PREFIX.test(name)))

    assert.ok(placement.length > 600, `found ${placement.length} placement classes in dist/css`)
    assert.deepEqual(
      [...responsive].filter((name) => !regular.has(name)),
      [],
      'names of the safelist that dist/css/chassis.css has not'
    )
    assert.deepEqual(
      placement.filter((name) => !responsive.has(name)),
      [],
      'placement classes of dist/css/chassis.css that the safelist has not'
    )
  })

  test('the utilities no component builds stay on demand', () => {
    for (const name of ['md:p-md', 'md:-mx-md', 'md:d-flex', 'md:order-1', 'md:float-start']) {
      assert.ok(!safelisted.has(name), `${name} is listed`)
      assert.ok(!withSafelist.has(name), `${name} is generated`)
    }
  })

  test('the unprefixed class of every name is listed with it', () => {
    const bare = [...safelisted]
      .filter((name) => PREFIX.test(name))
      .map((name) => name.replace(PREFIX, ''))
    assert.deepEqual(
      bare.filter((name) => !safelisted.has(name)),
      []
    )
  })
})
