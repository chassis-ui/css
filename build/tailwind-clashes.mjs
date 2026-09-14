#!/usr/bin/env node

/*!
 * tailwind-clashes.mjs — finds Chassis component/reboot class names that
 * Tailwind core would also generate, which would otherwise need excluding
 * from Tailwind's own generation via `@source not inline(...)` (fact 9).
 * Without that, a candidate like `outline` or `lg:container` would get BOTH
 * Chassis's component rule (`components`/`reboot` layer) and Tailwind's own
 * utility rule (`utilities` layer) — and the utilities layer always wins the
 * cascade, silently breaking the Chassis component.
 *
 * The exclusions themselves are committed Sass data
 * (`scss/tailwind/_source-exclusions.scss`), emitted by `theme.scss` at
 * compile time — so a project compiling `scss/tailwind/index.scss` with its
 * own chassis-tokens gets them too, not only the prebuilt `dist/tailwind/`.
 * This module only CHECKS that the committed lists still match live
 * detection (`run()`, wired into `css:tailwind`, throws on drift) and
 * regenerates them on request (`updateSourceExclusions()`, wired into
 * `css:tailwind:update-clashes`) — it never edits `dist/tailwind/*.css`.
 *
 * Runs inside `css:tailwind`, after `build-tailwind.mjs`'s Sass + prefix
 * pass, so `dist/tailwind/components.css` / `reboot.css` / `utilities.css`
 * / `theme.css` already hold their final content.
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
const sourceExclusionsPath = path.join(root, 'scss/tailwind/_source-exclusions.scss')
const clashPolicyPath = path.join(root, 'scss/tailwind/_clash-policy.scss')

// Undoes the compiled-in `!important` remedy (scss/tailwind/_clash-policy.scss,
// applied by the Sass emitter at compile time) so clash DETECTION can probe
// the merge as if unremedied. Without this, an already-remedied name's
// Chassis declaration -- now genuinely `!important` in the real compiled
// output -- always wins the merge regardless of source order, which would
// reclassify it "equal" and hide whether the underlying same-name clash still
// exists. The only source of `!important` in dist/tailwind/utilities.css is
// this remedy (no `$utilities` entry sets `important: true`), so a blanket
// strip is safe.
export function stripImportant(css) {
  return css.replace(/\s*!important(?=\s*;)/g, '')
}

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
// Breakpoint prefixes and clash classification
// ---------------------------------------------------------------------------

// Reads the actual configured breakpoint names back out of the compiled
// theme.css (`--breakpoint-<name>: …`, emitted by theme.scss from
// `$breakpoints`, in map order, `xs` already skipped) instead of a
// hard-coded list — so a project with its own custom breakpoints still
// classifies and compresses clashes correctly.
function readBreakpointPrefixes(themeCss) {
  const names = [...themeCss.matchAll(/--breakpoint-([a-zA-Z0-9]+):/g)].map((m) => m[1])
  return ['', ...names.map((name) => `${name}:`)]
}

// Splits clash candidates into base names that clash unprefixed only
// (`$bare-clashes`) vs. base names that clash at every breakpoint prefix
// (`$breakpoint-clashes`, exploiting Tailwind's brace-expansion — fact 9).
// Throws on a base name clashing at only SOME prefixes: `theme.scss`'s
// emitter has no representation for that shape, and it has never occurred
// in practice (every real breakpoint-clashing name, `container`/`col-*`,
// clashes at all of them) — surface it for manual investigation rather than
// silently under- or over-excluding.
function classifyClashes(clashes, breakpointPrefixes) {
  const byBase = new Map()
  for (const candidate of clashes) {
    const prefixMatch = breakpointPrefixes.slice(1).find((p) => candidate.startsWith(p))
    const prefix = prefixMatch ?? ''
    const base = prefix ? candidate.slice(prefix.length) : candidate
    if (!byBase.has(base)) byBase.set(base, new Set())
    byBase.get(base).add(prefix)
  }

  const bare = []
  const responsive = []
  const partial = []
  for (const [base, prefixes] of byBase) {
    if (prefixes.size === 1 && prefixes.has('')) {
      bare.push(base)
    } else if (prefixes.size === breakpointPrefixes.length) {
      responsive.push(base)
    } else {
      partial.push({ base, prefixes: [...prefixes] })
    }
  }

  if (partial.length > 0) {
    throw new Error(
      `tailwind-clashes: found component clash(es) with a partial breakpoint-prefix set, which ` +
        `theme.scss's emitter can't express (only "unprefixed only" or "every prefix" are handled): ` +
        `${JSON.stringify(partial)}. Investigate manually before updating scss/tailwind/_source-exclusions.scss.`
    )
  }

  return { bare: bare.sort(), responsive: responsive.sort() }
}

// ---------------------------------------------------------------------------
// scss/tailwind/_source-exclusions.scss (generated file) parsing/formatting
// ---------------------------------------------------------------------------

function parseSassStringList(source, varName) {
  const match = source.match(new RegExp(`\\$${varName}:\\s*\\(([\\s\\S]*?)\\)\\s*!default\\s*;`))
  if (!match) {
    throw new Error(`tailwind-clashes: could not find $${varName} in ${sourceExclusionsPath}`)
  }
  return [...match[1].matchAll(/"([^"]*)"/g)].map((m) => m[1])
}

function formatSassStringList(values) {
  return values.map((value) => `  "${value}"`).join(',\n')
}

function formatSourceExclusionsFile({ bare, responsive }) {
  return `//
// Chassis CSS — Tailwind Source Exclusions (generated, do not hand-edit)
//
// Component/reboot/grid class names that would otherwise clash with a
// Tailwind core utility of the same name (fact 9) — excluding them from
// Tailwind's own generation via \`@source not inline(...)\`, emitted by
// \`./theme.scss\`. \`$bare-clashes\` clash unprefixed only; \`$breakpoint-clashes\`
// clash at every breakpoint prefix too (\`sm:container\`, \`lg:container\`, …),
// so \`./theme.scss\` wraps each one in the brace-expansion group built from
// \`$breakpoints\`.
//
// Regenerated by \`build/tailwind-clashes.mjs\` (checked on every
// \`pnpm css:tailwind\`) from the compiled \`dist/tailwind/\` output — never
// hand-edit. A drift error means a component, grid, or reboot class was
// added, renamed, or removed; after confirming that's deliberate, run
// \`pnpm css:tailwind:update-clashes\` to regenerate this file.
//

$bare-clashes: (
${formatSassStringList(bare)}
) !default;

$breakpoint-clashes: (
${formatSassStringList(responsive)}
) !default;
`
}

// ---------------------------------------------------------------------------
// Shared detection
// ---------------------------------------------------------------------------

async function detectSourceExclusions() {
  const componentsCss = readFileSync(path.join(outDir, 'components.css'), 'utf8')
  const rebootCss = readFileSync(path.join(outDir, 'reboot.css'), 'utf8')
  const utilitiesCss = readFileSync(path.join(outDir, 'utilities.css'), 'utf8')
  const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')

  const candidateNames = [...new Set([...extractClassNames(componentsCss), ...extractClassNames(rebootCss)])].sort()
  const chassisUtilityNames = extractUtilityNames(utilitiesCss)

  // Probe against the theme + variants BEFORE this build's own committed
  // @source exclusions -- an already-excluded name never registers as
  // clashing with core (that's what the exclusion does), which would hide a
  // name that no longer needs excluding instead of catching the drift.
  const probeThemeCss = themeCss.replace(/^@source .*$/gm, '')
  const probeCss = [TAILWIND_UTILITIES_PROBE, probeThemeCss, '@source not "..";'].join('\n')

  const clashes = await findClashes(candidateNames, probeCss)

  const utilityIntersection = clashes.filter((name) => chassisUtilityNames.has(name))
  if (utilityIntersection.length > 0) {
    throw new Error(
      `Component clash set intersects Chassis's own @utility names — excluding these would also kill our ` +
        `own utilities: ${utilityIntersection.join(', ')}`
    )
  }

  const breakpointPrefixes = readBreakpointPrefixes(themeCss)
  const { bare, responsive } = classifyClashes(clashes, breakpointPrefixes)

  return { candidateNames, clashes, bare, responsive }
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export async function run() {
  const { candidateNames, clashes, bare, responsive } = await detectSourceExclusions()

  const committedSource = readFileSync(sourceExclusionsPath, 'utf8')
  const committedBare = parseSassStringList(committedSource, 'bare-clashes')
  const committedResponsive = parseSassStringList(committedSource, 'breakpoint-clashes')

  const drift = []
  if (JSON.stringify(bare) !== JSON.stringify(committedBare)) {
    drift.push(
      `$bare-clashes: live [${bare.join(', ')}] vs. committed [${committedBare.join(', ')}]`
    )
  }
  if (JSON.stringify(responsive) !== JSON.stringify(committedResponsive)) {
    drift.push(
      `$breakpoint-clashes: live [${responsive.join(', ')}] vs. committed [${committedResponsive.join(', ')}]`
    )
  }
  if (drift.length > 0) {
    throw new Error(
      `tailwind-clashes: component source-exclusion set has drifted from ` +
        `scss/tailwind/_source-exclusions.scss (after confirming this is deliberate, run ` +
        `\`pnpm css:tailwind:update-clashes\` to regenerate it):\n  ${drift.join('\n  ')}`
    )
  }

  writeFileSync(
    path.join(outDir, 'clashes.json'),
    JSON.stringify(
      {
        candidatesChecked: candidateNames.length,
        bareClashes: bare,
        breakpointClashes: responsive
      },
      null,
      2
    )
  )

  console.log(
    `tailwind-clashes: ${clashes.length} clash(es) found among ${candidateNames.length} candidates ` +
      `(${bare.length} bare, ${responsive.length} breakpoint-responsive), matches ` +
      `scss/tailwind/_source-exclusions.scss.`
  )
}

// Regenerates scss/tailwind/_source-exclusions.scss from live detection,
// unconditionally (no drift check) -- run explicitly via
// `pnpm css:tailwind:update-clashes` after confirming a reported drift is a
// deliberate source change, not a detection bug.
export async function updateSourceExclusions() {
  const { bare, responsive } = await detectSourceExclusions()
  writeFileSync(sourceExclusionsPath, formatSourceExclusionsFile({ bare, responsive }))
  console.log(
    `tailwind-clashes: wrote scss/tailwind/_source-exclusions.scss ` +
      `(${bare.length} bare, ${responsive.length} breakpoint-responsive).`
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

// Re-detects clashes against the (already-remedied) compiled utilities.css
// and asserts each "important" remedy actually makes Chassis's declared
// value win the merged rule -- against the real compiled output, not the
// policy's own claim.
async function verifyUtilityClashRemedies(themeCss, utilitiesCssText, policy) {
  const blocks = parseChassisUtilityBlocks(utilitiesCssText)

  for (const entry of policy.differs) {
    if (entry.remedy === 'documented') continue
    const block = blocks.get(entry.name)
    if (!block) {
      throw new Error(
        `tailwind-clashes: utility-clash policy entry "${entry.name}" (${entry.remedy}) has no matching ` +
          `@utility block in the compiled output -- was it renamed or removed?`
      )
    }
    const mergedCss = await mergedUtility(entry.name, themeCss, utilitiesCssText)
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

  const live = await detectUtilityNameClashes(themeCss, stripImportant(utilitiesCssText))

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

  await verifyUtilityClashRemedies(themeCss, utilitiesCssText, policy)

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
      `${policy.differs.filter((d) => d.remedy === 'important').length} remedied with !important, ` +
      `${policy.differs.filter((d) => d.remedy === 'documented').length} documented-only.`
  )
}

// ---------------------------------------------------------------------------
// scss/tailwind/_clash-policy.scss (generated file): merges every
// "important"-remedy entry from BOTH policy JSON files into one Sass map,
// $important-properties, consumed by scss/mixins/_utilities-tailwind.scss's
// emitter. The JSON files stay the reviewed source of truth (edited by hand
// after re-running the Phase 5/9 analysis, then checked by
// checkUtilityNameClashes()/checkBridgeClashes() above); this is a pure,
// mechanical re-derivation of them, so its own check is a straight
// re-derive-and-compare, not a live Tailwind-compile probe. "documented"
// entries need no remedy and aren't listed.
// ---------------------------------------------------------------------------

function buildImportantPropertiesPolicy() {
  const utilityPolicy = JSON.parse(
    readFileSync(path.join(root, 'build/tailwind-utility-clashes.json'), 'utf8')
  )
  const bridgePolicy = JSON.parse(
    readFileSync(path.join(root, 'build/tailwind-bridge-clashes.json'), 'utf8')
  )

  const entries = new Map()
  for (const policy of [utilityPolicy, bridgePolicy]) {
    for (const entry of policy.differs) {
      if (entry.remedy !== 'important') continue
      if (entries.has(entry.name)) {
        throw new Error(
          `tailwind-clashes: "${entry.name}" has an "important" remedy in both policy files`
        )
      }
      entries.set(entry.name, entry.properties)
    }
  }
  return entries
}

function sortedEntries(map) {
  return [...map.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
}

function parseClashPolicySass(source) {
  const match = source.match(/\$important-properties:\s*\(([\s\S]*?)\)\s*!default\s*;/)
  if (!match) {
    throw new Error(`tailwind-clashes: could not find $important-properties in ${clashPolicyPath}`)
  }
  const entries = new Map()
  for (const m of match[1].matchAll(/"([^"]+)":\s*\(([^)]*)\)/g)) {
    entries.set(
      m[1],
      [...m[2].matchAll(/"([^"]*)"/g)].map((p) => p[1])
    )
  }
  return entries
}

function formatClashPolicyFile(policy) {
  const lines = sortedEntries(policy)
    .map(([name, properties]) => `  "${name}": (${properties.map((p) => `"${p}"`).join(', ')})`)
    .join(',\n')
  return `//
// Chassis CSS — Tailwind Clash Policy (generated, do not hand-edit)
//
// Forces \`!important\` on specific properties of specific same-name-clash
// utilities (fact 6 / Phase 5) so Chassis's own value always wins Tailwind's
// same-name \`@utility\` merge -- consumed by
// \`scss/mixins/_utilities-tailwind.scss\`'s emitter, so it's scoped to the
// Tailwind build only; \`dist/css\` never sees this.
//
// Merges the "important"-remedy entries from BOTH
// \`build/tailwind-utility-clashes.json\` (clashes with Tailwind core) and
// \`build/tailwind-bridge-clashes.json\` (clashes the opt-in token bridge
// creates, applied unconditionally here whether or not \`bridge.css\` is
// imported -- see the Tailwind docs guide's "Token bridge" section).
// "documented" entries in either policy file need no remedy and aren't
// listed here.
//
// Regenerated by \`build/tailwind-clashes.mjs\` (checked on every
// \`pnpm css:tailwind\`) from those two JSON files -- never hand-edit. A
// drift error means one of the JSON policy files changed; after confirming
// that's deliberate, run \`pnpm css:tailwind:update-clash-policy\` to
// regenerate this file.
//

$important-properties: (
${lines}
) !default;
`
}

export function checkClashPolicy() {
  const live = buildImportantPropertiesPolicy()
  const committed = parseClashPolicySass(readFileSync(clashPolicyPath, 'utf8'))

  const liveSorted = sortedEntries(live)
  const committedSorted = sortedEntries(committed)
  if (JSON.stringify(liveSorted) !== JSON.stringify(committedSorted)) {
    throw new Error(
      `tailwind-clashes: scss/tailwind/_clash-policy.scss has drifted from the JSON policy files ` +
        `(after confirming this is deliberate, run \`pnpm css:tailwind:update-clash-policy\` to regenerate it):\n` +
        `  live: ${JSON.stringify(liveSorted)}\n  committed: ${JSON.stringify(committedSorted)}`
    )
  }

  console.log(
    `tailwind-clashes: ${live.size} important-property remedy(ies), matches scss/tailwind/_clash-policy.scss.`
  )
}

// Regenerates scss/tailwind/_clash-policy.scss unconditionally (no drift
// check) -- run explicitly via `pnpm css:tailwind:update-clash-policy` after
// editing either JSON policy file.
export function updateClashPolicy() {
  writeFileSync(clashPolicyPath, formatClashPolicyFile(buildImportantPropertiesPolicy()))
  console.log('tailwind-clashes: wrote scss/tailwind/_clash-policy.scss.')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run()
    .then(() => checkClashPolicy())
    .then(checkUtilityNameClashes)
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
