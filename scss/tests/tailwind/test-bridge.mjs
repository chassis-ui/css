#!/usr/bin/env node

/*!
 * test-bridge.mjs — Node-only (no browser) regression test for the opt-in
 * token bridge (dist/tailwind/bridge.css). Compiles the real
 * dist/tailwind/index.css together with dist/tailwind/bridge.css using the
 * real @tailwindcss/node compiler, then asserts: the bridge's new
 * capabilities actually work (ring-*, the shade ramp, the /<opacity>
 * modifier), the Phase 5-style same-name clash remedies from
 * build/tailwind-bridge-clashes.json make Chassis's own value keep winning
 * the cascade, and dist/tailwind/index.css is unaffected when the bridge is
 * NOT imported (the !important patch must be a no-op for consumers who
 * never load it).
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

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../..')
const outDir = path.join(root, 'dist/tailwind')

// Matches a top-level `.name { ... }` rule, allowing an optional trailing
// pseudo-element/pseudo-class (`.placeholder-primary::placeholder { ... }`)
// between the class token and the opening brace, but not a compound class
// (`.name.other { ... }`, which would indicate a dotted-compound sibling).
function findExactRule(built, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\//g, '\\\\/')
  const re = new RegExp(`(?<=^|[{}])\\s*\\.${escaped}(::?[a-zA-Z-]+)?\\s*\\{([^}]*)\\}`, 'g')
  return [...built.matchAll(re)].map((m) => m[2])
}

function parseDecls(body) {
  const decls = []
  for (const decl of (body ?? '').split(';')) {
    const t = decl.trim()
    if (!t) continue
    const colon = t.indexOf(':')
    if (colon === -1) continue
    decls.push([t.slice(0, colon).trim(), t.slice(colon + 1).trim()])
  }
  return decls
}

// Cascade winner per property across every rule body passed in, in order;
// an `!important` declaration beats a later plain one for the same
// property, matching real browser behavior for same-specificity rules.
function winningValues(bodies) {
  const state = new Map()
  for (const body of bodies) {
    for (const [prop, rawValue] of parseDecls(body)) {
      const important = /!important\s*$/i.test(rawValue.trim())
      const value = rawValue.replace(/!important\s*$/i, '').trim()
      const existing = state.get(prop)
      if (existing?.important && !important) continue
      state.set(prop, { value, important })
    }
  }
  const flat = new Map()
  for (const [prop, { value }] of state) flat.set(prop, value)
  return flat
}

const BRIDGED_CANDIDATES = [
  'ring-primary',
  'ring-primary/80',
  'outline-danger',
  'decoration-primary',
  'caret-primary',
  'accent-primary',
  'fill-primary',
  'stroke-primary',
  'placeholder-primary',
  'bg-primary-70',
  'bg-primary',
  'bg-primary/50',
  'border-primary',
  'shadow-primary'
]

let builtWithBridge
let builtWithoutBridge

before(async () => {
  const indexCss = readFileSync(path.join(outDir, 'index.css'), 'utf8')
  const bridgeCss = readFileSync(path.join(outDir, 'bridge.css'), 'utf8')

  const withBridgeCompiler = await compile(`${indexCss}\n${bridgeCss}`, {
    base: outDir,
    onDependency: () => {}
  })
  builtWithBridge = withBridgeCompiler.build(BRIDGED_CANDIDATES)

  const withoutBridgeCompiler = await compile(indexCss, { base: outDir, onDependency: () => {} })
  builtWithoutBridge = withoutBridgeCompiler.build(['bg-primary', 'border-primary'])
})

describe('dist/tailwind/bridge.css', () => {
  test('brings in Tailwind utility groups Chassis has no equivalent for', () => {
    for (const name of [
      'ring-primary',
      'outline-danger',
      'decoration-primary',
      'caret-primary',
      'accent-primary',
      'fill-primary',
      'stroke-primary',
      'placeholder-primary'
    ]) {
      const rules = findExactRule(builtWithBridge, name)
      assert.ok(rules.length > 0, `expected a generated rule for ${name}`)
    }
  })

  test('the /<opacity> modifier works on a bridged color', () => {
    const rules = findExactRule(builtWithBridge, 'ring-primary/80')
    assert.ok(rules.length > 0, 'expected ring-primary/80 to generate')
    assert.match(rules[0], /color-mix/)
  })

  test('the shade ramp is reachable and has no Chassis equivalent to clash with', () => {
    const rules = findExactRule(builtWithBridge, 'bg-primary-70')
    assert.equal(rules.length, 1, 'expected exactly one declaration (no same-name merge)')
    assert.match(rules[0], /--color-primary-70/)
  })

  test("Chassis's own bg-primary / border-primary keep winning the cascade (Phase 5-style remedy)", () => {
    for (const [name, property] of [
      ['bg-primary', 'background-color'],
      ['border-primary', 'border-color']
    ]) {
      const rules = findExactRule(builtWithBridge, name)
      assert.ok(rules.length > 0, `expected a rule for ${name}`)
      const winners = winningValues(rules)
      const winner = winners.get(property)
      assert.ok(
        winner?.startsWith('var(--cx-'),
        `expected ${name}'s ${property} to keep resolving to a --cx- token, got "${winner}"`
      )
    }
  })

  test("shadow-primary sets Tailwind's --tw-shadow-color and Chassis's --cx-shadow-color without either overriding the other", () => {
    const rules = findExactRule(builtWithBridge, 'shadow-primary')
    const winners = winningValues(rules)
    assert.ok(winners.has('--tw-shadow-color'))
    assert.ok(winners.has('--cx-shadow-color'))
  })

  test('without the bridge loaded, bg-primary / border-primary are unaffected', () => {
    for (const [name, property, expected] of [
      ['bg-primary', 'background-color', 'var(--cx-bg-color)'],
      ['border-primary', 'border-color', 'var(--cx-border-color)']
    ]) {
      const rules = findExactRule(builtWithoutBridge, name)
      const winners = winningValues(rules)
      assert.equal(winners.get(property), expected)
    }
  })

  test('the dist/tailwind/bridge-clashes.json build report matches the committed policy', () => {
    const report = JSON.parse(readFileSync(path.join(outDir, 'bridge-clashes.json'), 'utf8'))
    const policy = JSON.parse(
      readFileSync(path.join(root, 'build/tailwind-bridge-clashes.json'), 'utf8')
    )
    assert.equal(report.equal, policy.equal.length)
    assert.deepEqual(
      report.differs.map((d) => d.name).sort(),
      policy.differs.map((d) => d.name).sort()
    )
  })
})
