#!/usr/bin/env node

/*!
 * tailwind-clashes.mjs — finds Chassis component/reboot class names that
 * Tailwind core would also generate, and excludes them from Tailwind's own
 * generation via `@source not inline(...)` (fact 9). Without this, a
 * candidate like `outline` or `lg:container` would get BOTH Chassis's
 * component rule (`components`/`reboot` layer) and Tailwind's own utility
 * rule (`utilities` layer) — and the utilities layer always wins the
 * cascade, silently breaking the Chassis component.
 *
 * Runs inside `css:tailwind`, after `build-tailwind.mjs`'s Sass + prefix
 * pass, so `dist/tailwind/components.css` / `reboot.css` / `utilities.css`
 * already hold their final class names.
 *
 * Also writes the JS-toggled-class safelist (fact 15) from
 * `build/tailwind-safelist.json` as `@source inline(...)`, and a
 * `dist/tailwind/clashes.json` report.
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import { compile } from '@tailwindcss/node'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(fileURLToPath(import.meta.url), '../..')
const outDir = path.join(root, 'dist/tailwind')

const BREAKPOINT_PREFIXES = ['', 'sm:', 'md:', 'lg:', 'xl:', '2xl:']

// ---------------------------------------------------------------------------
// Class name extraction
// ---------------------------------------------------------------------------

// Matches one class-selector token after a `.`: CSS identifier escapes
// (`\XX ` hex form, or `\X` single-char form) or plain ident characters.
const CLASS_TOKEN_RE = /\.((?:\\[0-9a-fA-F]{1,6}\s?|\\.|[a-zA-Z0-9_-])+)/g

function unescapeCssIdent(token) {
  return token.replace(/\\([0-9a-fA-F]{1,6})\s?|\\(.)/g, (_match, hex, char) => {
    if (hex) return String.fromCodePoint(Number.parseInt(hex, 16))
    return char
  })
}

function extractClassNames(css) {
  const found = new Set()
  let match
  while ((match = CLASS_TOKEN_RE.exec(css))) {
    found.add(unescapeCssIdent(match[1]))
  }
  return found
}

function extractUtilityNames(utilitiesCss) {
  const found = new Set()
  for (const line of utilitiesCss.split('\n')) {
    const match = line.match(/^@utility\s+([^\s{]+)/)
    if (match) found.add(match[1])
  }
  return found
}

// ---------------------------------------------------------------------------
// Clash detection
// ---------------------------------------------------------------------------

// A fresh compiler per candidate: @tailwindcss/node's compiler accumulates
// candidates across repeated build() calls on the same instance, so reusing
// one would make every later candidate a false positive.
async function candidateClashesWithCore(themeAndLayersCss, candidate) {
  const compiler = await compile(themeAndLayersCss, { base: outDir, onDependency: () => {} })
  const css = compiler.build([candidate])
  return /@layer utilities\s*\{/.test(css)
}

async function findClashes(candidates, themeAndLayersCss) {
  const clashes = []
  for (const candidate of candidates) {
    if (await candidateClashesWithCore(themeAndLayersCss, candidate)) {
      clashes.push(candidate)
    }
  }
  return clashes
}

// ---------------------------------------------------------------------------
// Brace compression
// ---------------------------------------------------------------------------

// Groups clash candidates into `@source not inline("…")` strings, exploiting
// Tailwind's brace-expansion (fact 9) where it helps: same base name clashing
// under several breakpoint prefixes (`{,sm:,md:,lg:}container`), or several
// bare candidates sharing a `stem-<token>` shape (`col-{1,2,…,12,auto}`).
// Falls back to one plain string per candidate — always correct, just less
// compact. (Tailwind's `@source not inline()` does NOT support `{1..12}`
// numeric-range syntax, despite reading like it might; confirmed empirically
// against @tailwindcss/node — every value has to be spelled out.)
function compressCandidates(candidates) {
  const byBase = new Map()
  for (const candidate of candidates) {
    const prefixMatch = BREAKPOINT_PREFIXES.slice(1).find((p) => candidate.startsWith(p))
    const prefix = prefixMatch ?? ''
    const base = prefix ? candidate.slice(prefix.length) : candidate
    if (!byBase.has(base)) byBase.set(base, new Set())
    byBase.get(base).add(prefix)
  }

  const output = []
  const stemPool = []

  for (const [base, prefixes] of byBase) {
    if (prefixes.size > 1) {
      const ordered = BREAKPOINT_PREFIXES.filter((p) => prefixes.has(p))
      output.push(`{${ordered.join(',')}}${base}`)
    } else {
      const [prefix] = prefixes
      if (prefix === '') {
        stemPool.push(base)
      } else {
        output.push(`${prefix}${base}`)
      }
    }
  }

  const byStem = new Map()
  for (const base of stemPool) {
    const dashIndex = base.lastIndexOf('-')
    if (dashIndex === -1) {
      if (!byStem.has(base)) byStem.set(base, [])
      byStem.get(base).push('')
      continue
    }
    const stem = base.slice(0, dashIndex)
    const token = base.slice(dashIndex + 1)
    if (!byStem.has(stem)) byStem.set(stem, [])
    byStem.get(stem).push(token)
  }

  for (const [stem, tokens] of byStem) {
    if (tokens.length === 1 && tokens[0] !== '') {
      output.push(`${stem}-${tokens[0]}`)
    } else if (tokens.length === 1) {
      output.push(stem)
    } else {
      const numeric = tokens.filter((t) => /^\d+$/.test(t)).sort((a, b) => Number(a) - Number(b))
      const rest = tokens.filter((t) => !/^\d+$/.test(t)).sort()
      output.push(`${stem}-{${[...numeric, ...rest].join(',')}}`)
    }
  }

  return output.sort()
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export async function run() {
  const componentsCss = readFileSync(path.join(outDir, 'components.css'), 'utf8')
  const rebootCss = readFileSync(path.join(outDir, 'reboot.css'), 'utf8')
  const utilitiesCss = readFileSync(path.join(outDir, 'utilities.css'), 'utf8')
  const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')

  const candidateNames = [...new Set([...extractClassNames(componentsCss), ...extractClassNames(rebootCss)])].sort()
  const chassisUtilityNames = extractUtilityNames(utilitiesCss)

  // theme.css minus any exclusion block from a previous run (idempotent
  // re-runs: build-tailwind.mjs recompiles theme.css fresh from Sass before
  // this runs, so today there's nothing to strip, but strip defensively).
  const cleanThemeCss = themeCss.replace(/\n\/\* Generated by build\/tailwind-clashes\.mjs[\s\S]*$/, '')
  const probeCss = [
    '@import "tailwindcss/theme.css" layer(theme);',
    '@import "tailwindcss/utilities.css" layer(utilities);',
    cleanThemeCss,
    '@source not "..";'
  ].join('\n')

  const clashes = await findClashes(candidateNames, probeCss)

  const utilityIntersection = clashes.filter((name) => chassisUtilityNames.has(name))
  if (utilityIntersection.length > 0) {
    throw new Error(
      `Component clash set intersects Chassis's own @utility names — excluding these would also kill our ` +
        `own utilities: ${utilityIntersection.join(', ')}`
    )
  }

  const compressed = compressCandidates(clashes)
  const safelist = JSON.parse(readFileSync(path.join(root, 'build/tailwind-safelist.json'), 'utf8'))

  const generatedLines = [
    '',
    '/* Generated by build/tailwind-clashes.mjs. Do not edit directly — re-run `pnpm css:tailwind`. */',
    ...compressed.map((entry) => `@source not inline("${entry}");`),
    ...safelist.map((entry) => `@source inline("${entry.class}"); /* ${entry.reason} */`)
  ]
  const generatedBlock = generatedLines.join('\n')

  writeFileSync(path.join(outDir, 'theme.css'), `${cleanThemeCss}${generatedBlock}\n`)

  const indexCss = readFileSync(path.join(outDir, 'index.css'), 'utf8')
  const cleanIndexCss = indexCss.replace(/\n\/\* Generated by build\/tailwind-clashes\.mjs[\s\S]*$/, '')
  writeFileSync(path.join(outDir, 'index.css'), `${cleanIndexCss}${generatedBlock}\n`)

  writeFileSync(
    path.join(outDir, 'clashes.json'),
    JSON.stringify(
      {
        candidatesChecked: candidateNames.length,
        clashes,
        compressed,
        safelist: safelist.map((entry) => entry.class)
      },
      null,
      2
    )
  )

  console.log(
    `tailwind-clashes: ${clashes.length} clash(es) found among ${candidateNames.length} candidates, ` +
      `compressed to ${compressed.length} @source not inline() entries.`
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
