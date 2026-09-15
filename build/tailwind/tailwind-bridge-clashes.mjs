#!/usr/bin/env node

/*!
 * tailwind-bridge-clashes.mjs — reruns the Phase 5 same-name utility-clash
 * analysis (build/tailwind/tailwind-clashes.mjs) with scss/tailwind/bridge.scss's
 * `--color-*` theme keys loaded. Bridging Chassis's palette into Tailwind's
 * own theme namespace re-enables NATIVE Tailwind color utilities (`bg-*`,
 * `border-*`, ...) for names Chassis's own `@utility` generator already
 * produces (`bg-primary`, `border-primary`, ...) — a same-name merge,
 * exactly like Phase 5's original clash set, just triggered by the OPT-IN
 * bridge instead of Tailwind's own default theme.
 *
 * Scoped to ONLY the names that clash BECAUSE of the bridge: a Chassis
 * utility name that already clashes with plain Tailwind core is already
 * covered by build/tailwind/tailwind-utility-clashes.json and is skipped here, so
 * the two policy files never overlap and scss/tailwind/_clash-policy.scss
 * (which merges both) never double-remedies one @utility block.
 *
 * Runs inside `css:tailwind`, after build-tailwind.mjs's Sass + prefix pass,
 * so dist/tailwind/utilities.css / index.css / bridge.css already hold their
 * final content -- the !important remedy is baked into utilities.css /
 * index.css UNCONDITIONALLY by the Sass emitter (scss/tailwind/_clash-policy.scss),
 * not written here. It's a no-op for consumers who never import bridge.css,
 * and protects the ones who do.
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import { compile } from '@tailwindcss/node'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  coreUtilityAfterReset,
  extractOrderedDecls,
  parseChassisUtilityBlocks,
  stripImportant,
  TAILWIND_UTILITIES_PROBE,
  winningValues
} from './tailwind-clashes.mjs'

const root = path.resolve(fileURLToPath(import.meta.url), '../../..')
const outDir = path.join(root, 'dist/tailwind')

async function coreUtilityWithBridge(candidate, themeCss, bridgeCss) {
  const css = [TAILWIND_UTILITIES_PROBE, themeCss, bridgeCss, '@source not "..";'].join('\n')
  const compiler = await compile(css, { base: outDir, onDependency: () => {} })
  const built = compiler.build([candidate])
  return /@layer utilities\s*\{/.test(built) ? built : null
}

async function mergedUtilityWithBridge(candidate, themeCss, bridgeCss, utilitiesCssText) {
  const css = [
    TAILWIND_UTILITIES_PROBE,
    themeCss,
    bridgeCss,
    utilitiesCssText,
    '@source not "..";'
  ].join('\n')
  const compiler = await compile(css, { base: outDir, onDependency: () => {} })
  return compiler.build([candidate])
}

// Finds Chassis utility names that become a same-name clash with Tailwind
// core ONLY once bridge.css's theme keys are loaded (a name that already
// clashes with plain Tailwind core is already covered by
// build/tailwind/tailwind-utility-clashes.json and is skipped here).
async function detectBridgeClashes(themeCss, bridgeCss, utilitiesCssText) {
  const chassisBlocks = parseChassisUtilityBlocks(utilitiesCssText)
  const results = new Map()

  for (const [name, block] of chassisBlocks) {
    const alreadyCoreClash = await coreUtilityAfterReset(name, themeCss)
    if (alreadyCoreClash) continue

    const bridgedCoreCss = await coreUtilityWithBridge(name, themeCss, bridgeCss)
    if (!bridgedCoreCss) continue

    const coreDecls = extractOrderedDecls(bridgedCoreCss, name)
    if (!coreDecls || coreDecls.length === 0) continue

    const mergedCss = await mergedUtilityWithBridge(name, themeCss, bridgeCss, utilitiesCssText)
    const mergedWinners = winningValues(extractOrderedDecls(mergedCss, name) ?? [])
    const chassisOwnWinners = winningValues(block.decls)

    const realCoreProps = [...new Set(coreDecls.map(([p]) => p))].filter(
      (p) => !p.startsWith('--tw-')
    )
    const leaked = realCoreProps.filter((p) => !chassisOwnWinners.has(p))
    const overridden = [...chassisOwnWinners.entries()].filter(
      ([prop, value]) => mergedWinners.has(prop) && mergedWinners.get(prop) !== value
    )

    results.set(name, {
      classification: leaked.length > 0 || overridden.length > 0 ? 'differs' : 'equal'
    })
  }

  return results
}

// Re-detects against the (already-remedied) compiled utilities.css, with
// the bridge loaded, and asserts each "important" remedy actually makes
// Chassis's declared value win the merged rule -- against the real compiled
// output, not the policy's own claim.
async function verifyBridgeClashRemedies(themeCss, bridgeCss, utilitiesCssText, policy) {
  const blocks = parseChassisUtilityBlocks(utilitiesCssText)

  for (const entry of policy.differs) {
    if (entry.remedy === 'documented') continue
    const block = blocks.get(entry.name)
    const mergedCss = await mergedUtilityWithBridge(
      entry.name,
      themeCss,
      bridgeCss,
      utilitiesCssText
    )
    const mergedWinners = winningValues(extractOrderedDecls(mergedCss, entry.name) ?? [])
    const chassisOwnWinners = winningValues(block.decls)

    for (const property of entry.properties) {
      const expected = chassisOwnWinners.get(property)
      const actual = mergedWinners.get(property)
      if (actual !== expected) {
        throw new Error(
          `tailwind-bridge-clashes: !important remedy for "${entry.name}" failed to win "${property}" ` +
            `(expected "${expected}", got "${actual}")`
        )
      }
    }
  }
}

export async function checkBridgeClashes() {
  const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
  const bridgeCss = readFileSync(path.join(outDir, 'bridge.css'), 'utf8')
  const utilitiesCssText = readFileSync(path.join(outDir, 'utilities.css'), 'utf8')
  const policy = JSON.parse(
    readFileSync(path.join(root, 'build/tailwind/tailwind-bridge-clashes.json'), 'utf8')
  )

  const live = await detectBridgeClashes(themeCss, bridgeCss, stripImportant(utilitiesCssText))

  const knownNames = new Set([...policy.equal, ...policy.differs.map((d) => d.name)])
  const liveDiffers = new Set(policy.differs.map((d) => d.name))
  const drift = []
  for (const [name, { classification }] of live) {
    if (!knownNames.has(name)) {
      drift.push(
        `new bridge clash "${name}" (${classification}) is not in build/tailwind/tailwind-bridge-clashes.json`
      )
      continue
    }
    const expected = liveDiffers.has(name) ? 'differs' : 'equal'
    if (expected !== classification) {
      drift.push(
        `"${name}" is now "${classification}" but the bridge policy file says "${expected}"`
      )
    }
  }
  for (const name of knownNames) {
    if (!live.has(name))
      drift.push(`"${name}" is in the bridge policy file but is no longer a bridge clash at all`)
  }
  if (drift.length > 0) {
    throw new Error(
      `tailwind-bridge-clashes: bridge clash set has drifted from build/tailwind/tailwind-bridge-clashes.json ` +
        `(re-run the analysis and update the policy file deliberately):\n  ${drift.join('\n  ')}`
    )
  }

  await verifyBridgeClashRemedies(themeCss, bridgeCss, utilitiesCssText, policy)

  writeFileSync(
    path.join(outDir, 'bridge-clashes.json'),
    JSON.stringify(
      {
        bridgeClashesChecked: live.size,
        equal: policy.equal.length,
        differs: policy.differs.map(({ name, remedy }) => ({ name, remedy }))
      },
      null,
      2
    )
  )

  console.log(
    `tailwind-bridge-clashes: ${live.size} bridge-only clash(es) checked against policy, ` +
      `${policy.differs.filter((d) => d.remedy === 'important').length} remedied with !important, ` +
      `${policy.differs.filter((d) => d.remedy === 'documented').length} documented-only.`
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  checkBridgeClashes().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
