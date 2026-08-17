#!/usr/bin/env node

/*!
 * Script to build our plugins to use them separately.
 * Copyright 2020-2026 The Bootstrap Authors
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { globby } from 'globby'
import { rolldown } from 'rolldown'
import banner from './banner.js'
import browserTargets from './browser-targets.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const sourcePath = path.resolve(__dirname, '../js/src/').replace(/\\/g, '/')
const tsFiles = await globby(`${sourcePath}/**/*.ts`)

// Array which holds the resolved plugins
const resolvedPlugins = []

for (const file of tsFiles) {
  const dist = file.replace('src', 'dist').replace(/\.ts$/, '.js')

  resolvedPlugins.push({
    src: file,
    dist,
    fileName: path.basename(dist)
  })
}

const build = async (plugin) => {
  const bundle = await rolldown({
    input: plugin.src,
    // Keep every import external, so each plugin file mirrors its source module
    external: () => true,
    resolve: {
      // Map ESM-style `.js` specifiers to the `.ts` sources on disk
      extensionAlias: { '.js': ['.ts', '.js'] }
    },
    transform: {
      target: browserTargets
    }
  })

  await bundle.write({
    banner: banner(plugin.fileName),
    format: 'esm',
    sourcemap: true,
    file: plugin.dist
  })

  await bundle.close()

  console.log(`Built ${plugin.fileName}`)
}

;(async () => {
  try {
    const basename = path.basename(__filename)
    const timeLabel = `[${basename}] finished`

    console.log('Building individual plugins...')
    console.time(timeLabel)

    await Promise.all(Object.values(resolvedPlugins).map((plugin) => build(plugin)))

    console.timeEnd(timeLabel)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
})()
