#!/usr/bin/env node

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const configPath = '.bundlewatch.config.json'

const parseSize = (str) => Number.parseFloat(str.replace('KB', ''))
const ceilToQuarter = (n) => Math.ceil(n / 0.25) * 0.25

export const formatSize = (n) => {
  const frac = n % 1
  const decimals = frac === 0 || frac === 0.5 ? 1 : 2
  return `${n.toFixed(decimals)} kB`
}

/**
 * The limit to write for a file over its limit: the next quarter kilobyte above the size.
 * Bundlewatch prints sizes rounded to two decimals, so a file a little over its limit prints the
 * limit itself (`41.75KB > 41.75KB`), and the quarter above that size is the old limit; the
 * limit then goes to the quarter above the old one.
 * @param {number} size - The size bundlewatch printed, in kB
 * @param {number} limit - The limit bundlewatch printed, in kB
 * @returns {number} The new limit, in kB
 */
export function raiseLimit(size, limit) {
  const raised = ceilToQuarter(size)
  return raised > limit ? raised : Math.floor(limit / 0.25) * 0.25 + 0.25
}

/**
 * Raises the limits of the files bundlewatch reported over their limit
 * @param {string} output - The output of bundlewatch
 * @param {{ files: { path: string, maxSize: string }[] }} config - The bundlewatch config; changed in place
 * @returns {string[]} A line for each limit changed
 */
export function fixLimits(output, config) {
  const messages = []

  for (const line of output.split('\n').filter((l) => l.startsWith('FAIL'))) {
    const match = line.match(/(FAIL)\s+(.+?):\s+([\d.]+KB)\s+([<>])\s+([\d.]+KB)/)
    if (!match) {
      continue
    }

    const file = match[2]
    const oldLimit = parseSize(match[5])
    const newMaxStr = formatSize(raiseLimit(parseSize(match[3]), oldLimit))

    const entry = config.files.find((f) => f.path === `./${file}` || f.path === file)
    if (entry) {
      entry.maxSize = newMaxStr
      messages.push(`Updated ${file}: ${formatSize(oldLimit)} -> ${newMaxStr}`)
    }
  }

  return messages
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  let stdout
  try {
    stdout = execSync('npx bundlewatch --config .bundlewatch.config.json', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    })
  } catch (error) {
    stdout = error.stdout || ''
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  const messages = fixLimits(stdout, config)

  if (messages.length === 0) {
    console.log('All files are within their bundlewatch limits. Nothing to fix.')
    process.exit(0)
  }

  for (const message of messages) {
    console.log(message)
  }

  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`)
  console.log(`\nUpdated ${configPath}`)
}
