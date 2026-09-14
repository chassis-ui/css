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

// Loads Tailwind core the same way `scss/tailwind/_layer-order.scss` does for
// consumers: no `tailwindcss/theme.css`, whose values the reset discards.
export const TAILWIND_UTILITIES_PROBE = '@layer utilities { @tailwind utilities; }'

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
    TAILWIND_UTILITIES_PROBE,
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

// ---------------------------------------------------------------------------
// Utility-name clash policy (Phase 5 / fact 7): Chassis utility names that
// Tailwind CORE also generates, even after the `--*: initial` theme reset.
// Distinct from the component-clash check above (which EXCLUDES Chassis
// component/reboot names from Tailwind's own generation): here both
// Chassis's own `@utility` and Tailwind's core utility register for the same
// name, and Tailwind's same-name merge (fact 5/6) concatenates their
// declarations into one rule. Measured empirically: which side's declaration
// ends up textually last - and therefore wins any property both sides set -
// is an internal Tailwind ordering detail that does NOT reliably favor
// Chassis, contrary to fact 6's original "custom declarations come last"
// read (true for some utility shapes, false for others). `@source not
// inline()` is not usable as a remedy here (unlike the component-clash
// case): it suppresses a candidate string from being treated as a utility
// candidate at all, so excluding e.g. "opacity-10" would also kill Chassis's
// own `@utility opacity-10`, not just Tailwind's core one - confirmed
// empirically. The remedies below patch the compiled `@utility` output
// directly instead.
// ---------------------------------------------------------------------------

// name -> { start, end, decls: [[prop, value]] }. start/end are character
// offsets of the block BODY (just after "{" .. the matching "}") in the
// given css text. decls are the TOP-LEVEL declarations only; nested rule
// blocks (child-selector / dotted-compound forms) are stripped before
// parsing, since every entry in the utility-clash policy is a simple
// single-level utility.
export function parseChassisUtilityBlocks(css) {
  const map = new Map()
  const re = /@utility\s+(\S+)\s*\{/g
  let m
  while ((m = re.exec(css))) {
    const name = m[1]
    let depth = 1
    let i = re.lastIndex
    const start = i
    while (depth > 0 && i < css.length) {
      if (css[i] === '{') depth++
      else if (css[i] === '}') depth--
      i++
    }
    const end = i - 1
    const rawBody = css.slice(start, end)
    const flatBody = rawBody.replace(/[^{;]*\{[^{}]*\}/g, '')
    const decls = parseDecls(flatBody)
    if (!map.has(name)) map.set(name, { start, end, decls })
    else map.get(name).decls.push(...decls)
    re.lastIndex = i
  }
  return map
}

function parseDecls(body) {
  const decls = []
  for (const decl of body.split(';')) {
    const t = decl.trim()
    if (!t) continue
    const colon = t.indexOf(':')
    if (colon === -1) continue
    decls.push([t.slice(0, colon).trim(), t.slice(colon + 1).trim()])
  }
  return decls
}

// Matches only a TOP-LEVEL `.name { ... }` rule: the lookbehind requires the
// class token to open a new selector (right after `{`, `}`, or the start of
// the string), not sit inside a larger one. Without it, a Tailwind utility
// like `divide-x` -- whose real rule is `:where(.divide-x > :not(:last-child))
// { ... }`, styling children, not the classed element -- would false-match
// on the `.divide-x` substring inside that selector and grab the wrong
// declarations entirely (caught by the reset-remedy self-verification
// failing in a way that made no sense until this was traced back).
//
// Brace-depth-aware (not a naive `[^}]*` capture): some Tailwind core
// utilities nest a `@supports (...) { ... }` fallback inside the rule body
// (every color-driven `shadow-<color>` utility does, for its `color-mix`
// alpha fallback, regardless of whether an opacity modifier is present) --
// a naive capture would stop at the `@supports` block's own closing brace
// and mis-split its content as if it were a flat declaration. The body is
// flattened the same way `parseChassisUtilityBlocks` flattens Chassis's own
// blocks: one level of nested `selector { ... }` is stripped (its
// declarations discarded, matching how a `--tw-*` runtime variable set only
// inside that fallback is inert for clash-detection purposes anyway).
export function extractOrderedDecls(css, candidate) {
  const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const openRe = new RegExp(`(?<=^|[{}])\\s*\\.${escaped}(?:[^\\n{]*)\\{`)
  const m = openRe.exec(css)
  if (!m) return null
  let depth = 1
  let i = m.index + m[0].length
  const start = i
  while (depth > 0 && i < css.length) {
    if (css[i] === '{') depth++
    else if (css[i] === '}') depth--
    i++
  }
  const rawBody = css.slice(start, i - 1)
  const flatBody = rawBody.replace(/[^{;]*\{[^{}]*\}/g, '')
  return parseDecls(flatBody)
}

// !important-aware: an !important declaration beats a later plain one for
// the same property; otherwise later wins, matching normal same-rule
// cascade order.
export function winningValues(decls) {
  const state = new Map()
  for (const [prop, rawValue] of decls ?? []) {
    const important = /!important\s*$/i.test(rawValue.trim())
    const value = rawValue.replace(/!important\s*$/i, '').trim()
    const existing = state.get(prop)
    if (existing?.important && !important) continue
    state.set(prop, { value, important })
  }
  const flat = new Map()
  for (const [prop, { value }] of state) flat.set(prop, value)
  return flat
}

export async function coreUtilityAfterReset(candidate, themeCss) {
  const css = [
    TAILWIND_UTILITIES_PROBE,
    themeCss,
    '@source not "..";'
  ].join('\n')
  const compiler = await compile(css, { base: outDir, onDependency: () => {} })
  const built = compiler.build([candidate])
  return /@layer utilities\s*\{/.test(built) ? built : null
}

async function mergedUtility(candidate, themeCss, utilitiesCssText) {
  const css = [
    TAILWIND_UTILITIES_PROBE,
    themeCss,
    utilitiesCssText,
    '@source not "..";'
  ].join('\n')
  const compiler = await compile(css, { base: outDir, onDependency: () => {} })
  return compiler.build([candidate])
}

// For every Chassis utility name that Tailwind core ALSO generates after the
// theme reset, classify as "equal" (Chassis's own declared properties all
// win, or the only extra Tailwind properties are functionally inert) or
// "differs" (Tailwind either overrides a property Chassis sets, or adds a
// property Chassis never touches at all).
async function detectUtilityNameClashes(themeCss, utilitiesCssText) {
  const chassisBlocks = parseChassisUtilityBlocks(utilitiesCssText)
  const results = new Map()
  for (const [name, block] of chassisBlocks) {
    const coreCss = await coreUtilityAfterReset(name, themeCss)
    if (!coreCss) continue
    const coreDecls = extractOrderedDecls(coreCss, name)
    if (!coreDecls || coreDecls.length === 0) continue

    const mergedCss = await mergedUtility(name, themeCss, utilitiesCssText)
    const mergedWinners = winningValues(extractOrderedDecls(mergedCss, name) ?? [])
    const chassisOwnWinners = winningValues(block.decls)

    const realCoreProps = [...new Set(coreDecls.map(([p]) => p))].filter((p) => !p.startsWith('--tw-'))
    const leaked = realCoreProps.filter((p) => !chassisOwnWinners.has(p))
    const overridden = [...chassisOwnWinners.entries()].filter(
      ([prop, value]) => mergedWinners.has(prop) && mergedWinners.get(prop) !== value
    )

    results.set(name, { classification: leaked.length > 0 || overridden.length > 0 ? 'differs' : 'equal' })
  }
  return results
}

// Patches the compiled `@utility` blocks for every policy entry with an
// "important" remedy ("documented" entries are left untouched). Applied
// identically to `utilities.css` and `index.css` -- they hold independent
// Sass compiles of the same source, not an import of one by the other (see
// build-tailwind.mjs).
export function applyUtilityClashRemedies(css, policy) {
  const blocks = parseChassisUtilityBlocks(css)
  const edits = []

  for (const entry of policy.differs) {
    if (entry.remedy === 'documented') continue
    if (entry.remedy !== 'important') {
      throw new Error(`tailwind-clashes: unknown remedy "${entry.remedy}" for "${entry.name}"`)
    }
    const block = blocks.get(entry.name)
    if (!block) {
      throw new Error(
        `tailwind-clashes: utility-clash policy entry "${entry.name}" (${entry.remedy}) has no matching ` +
          `@utility block in the compiled output -- was it renamed or removed?`
      )
    }
    let body = css.slice(block.start, block.end)

    for (const property of entry.properties) {
      const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const declRe = new RegExp(`(^\\s*|[;{]\\s*)(${escaped})(\\s*:\\s*)([^;]+?)(\\s*;)`)
      if (!declRe.test(body)) {
        throw new Error(`tailwind-clashes: expected property "${property}" in @utility ${entry.name}, not found`)
      }
      body = body.replace(declRe, (_m, pre, prop, colon, value, semi) => `${pre}${prop}${colon}${value.trimEnd()} !important${semi}`)
    }

    edits.push({ start: block.start, end: block.end, body })
  }

  edits.sort((a, b) => b.start - a.start)
  let out = css
  for (const { start, end, body } of edits) out = out.slice(0, start) + body + out.slice(end)
  return out
}

// Re-detects clashes against the PATCHED utilities.css and asserts each
// "important" remedy actually made Chassis's declared value win the merged
// rule.
async function verifyUtilityClashRemedies(themeCss, patchedUtilitiesCssText, policy) {
  const patchedBlocks = parseChassisUtilityBlocks(patchedUtilitiesCssText)

  for (const entry of policy.differs) {
    if (entry.remedy === 'documented') continue
    const block = patchedBlocks.get(entry.name)
    const mergedCss = await mergedUtility(entry.name, themeCss, patchedUtilitiesCssText)
    const mergedWinners = winningValues(extractOrderedDecls(mergedCss, entry.name) ?? [])
    const chassisOwnWinners = winningValues(block.decls)

    for (const property of entry.properties) {
      const expected = chassisOwnWinners.get(property)
      const actual = mergedWinners.get(property)
      if (actual !== expected) {
        throw new Error(
          `tailwind-clashes: !important remedy for "${entry.name}" failed to win "${property}" ` +
            `(expected "${expected}", got "${actual}")`
        )
      }
    }
  }
}

export async function checkUtilityNameClashes() {
  const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
  const utilitiesCssText = readFileSync(path.join(outDir, 'utilities.css'), 'utf8')
  const policy = JSON.parse(readFileSync(path.join(root, 'build/tailwind-utility-clashes.json'), 'utf8'))

  const live = await detectUtilityNameClashes(themeCss, utilitiesCssText)

  const knownNames = new Set([...policy.equal, ...policy.differs.map((d) => d.name)])
  const liveDiffers = new Set(policy.differs.map((d) => d.name))
  const drift = []
  for (const [name, { classification }] of live) {
    if (!knownNames.has(name)) {
      drift.push(`new clash "${name}" (${classification}) is not in build/tailwind-utility-clashes.json`)
      continue
    }
    const expected = liveDiffers.has(name) ? 'differs' : 'equal'
    if (expected !== classification) {
      drift.push(`"${name}" is now "${classification}" but the policy file says "${expected}"`)
    }
  }
  for (const name of knownNames) {
    if (!live.has(name)) drift.push(`"${name}" is in the policy file but is no longer a same-name clash at all`)
  }
  if (drift.length > 0) {
    throw new Error(
      `tailwind-clashes: utility-name clash set has drifted from build/tailwind-utility-clashes.json ` +
        `(re-run the Phase 5 analysis and update the policy file deliberately):\n  ${drift.join('\n  ')}`
    )
  }

  const patchedUtilities = applyUtilityClashRemedies(utilitiesCssText, policy)
  writeFileSync(path.join(outDir, 'utilities.css'), patchedUtilities)

  const indexCss = readFileSync(path.join(outDir, 'index.css'), 'utf8')
  writeFileSync(path.join(outDir, 'index.css'), applyUtilityClashRemedies(indexCss, policy))

  await verifyUtilityClashRemedies(themeCss, patchedUtilities, policy)

  writeFileSync(
    path.join(outDir, 'utility-clashes.json'),
    JSON.stringify(
      {
        sameNameClashesChecked: live.size,
        equal: policy.equal.length,
        differs: policy.differs.map(({ name, remedy }) => ({ name, remedy }))
      },
      null,
      2
    )
  )

  console.log(
    `tailwind-utility-clashes: ${live.size} same-name clash(es) checked against policy, ` +
      `${policy.differs.filter((d) => d.remedy === 'important').length} patched with !important, ` +
      `${policy.differs.filter((d) => d.remedy === 'documented').length} documented-only.`
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run()
    .then(checkUtilityNameClashes)
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
