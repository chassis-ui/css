#!/usr/bin/env node

/*!
 * Plugin Builder Script
 *
 * Builds individual JavaScript plugins from source files into UMD bundles.
 * Each plugin is processed with Babel transpilation and Rollup bundling,
 * handling inter-plugin dependencies and external libraries.
 *
 * Usage:
 *   node build-plugins.js
 *
 * Output:
 *   - Individual UMD bundles in js/dist/ directory
 *   - Source maps for debugging
 *   - Console progress reporting
 *
 * Copyright 2025 Ozgur Gunes
 * Licensed under MIT
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { babel } from '@rollup/plugin-babel'
import { globby } from 'globby'
import { rollup } from 'rollup'
import banner from './banner.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Configuration constants
const CONFIG = {
  sourcePath: path.resolve(__dirname, '../js/src/'),
  babel: {
    exclude: 'node_modules/**',
    babelHelpers: 'bundled'
  },
  output: {
    format: 'umd',
    sourcemap: true,
    generatedCode: 'es2015'
  }
}

// Get all JavaScript source files
const jsFiles = await globby(`${CONFIG.sourcePath}/**/*.js`)

// Array which holds the resolved plugins
const resolvedPlugins = []

/**
 * Converts a filename to a PascalCase class name
 * Removes .js extension and capitalizes after hyphens, slashes, and backslashes
 * @param {string} filename - The filename to convert
 * @returns {string} PascalCase class name
 */
const filenameToEntity = (filename) => {
  return filename
    .replace('.js', '')
    .split(/[-/\\]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

// Build plugin configurations
for (const file of jsFiles) {
  resolvedPlugins.push({
    src: file,
    dist: file.replace('src', 'dist'),
    fileName: path.basename(file),
    className: filenameToEntity(path.basename(file))
    // safeClassName: filenameToEntity(path.relative(CONFIG.sourcePath, file))
  })
}

// Create a Map for O(1) plugin lookups during external resolution
const pluginMap = new Map(
  resolvedPlugins.map((plugin) => [path.basename(plugin.src, '.js'), plugin])
)

/**
 * Builds a single plugin using Rollup bundler
 * @param {Object} plugin - Plugin configuration object
 * @param {string} plugin.src - Source file path
 * @param {string} plugin.dist - Destination file path
 * @param {string} plugin.className - Plugin class name for UMD export
 * @param {string} plugin.fileName - Original filename
 */
const build = async (plugin) => {
  try {
    /**
     * @type {import('rollup').GlobalsOption}
     */
    const globals = {}

    const bundle = await rollup({
      input: plugin.src,
      plugins: [babel(CONFIG.babel)],
      external(source) {
        // Pattern to identify local files
        const pattern = /^(\.{1,2})\//

        // It's not a local file, e.g a Node.js package
        if (!pattern.test(source)) {
          globals[source] = source
          return true
        }

        const depName = path.basename(source.replace(pattern, ''), '.js')
        const depPlugin = pluginMap.get(depName)

        if (!depPlugin) {
          throw new Error(`Unresolved dependency: ${source}`)
        }

        // We can change `Index` with `UtilIndex` etc if we use
        // `safeClassName` instead of `className` everywhere
        globals[path.normalize(depPlugin.src)] = depPlugin.className
        return true
      }
    })

    await bundle.write({
      banner: banner(plugin.fileName),
      format: CONFIG.output.format,
      name: plugin.className,
      sourcemap: CONFIG.output.sourcemap,
      globals,
      generatedCode: CONFIG.output.generatedCode,
      file: plugin.dist
    })

    console.log(`✓ Built ${plugin.className}`)
  } catch (error) {
    console.error(`✕ Failed to build ${plugin.className}: ${error.message}`)
    throw error
  }
}

/**
 * Main build execution function
 * Processes all resolved plugins and reports results
 */
async function main() {
  const basename = path.basename(__filename)
  const timeLabel = `[${basename}] finished`

  console.log('🏗️ Building individual plugins...')
  console.time(timeLabel)

  try {
    const results = await Promise.all(
      resolvedPlugins.map(async (plugin) => {
        try {
          await build(plugin)
          return { success: true, plugin }
        } catch (error) {
          return { success: false, plugin, error }
        }
      })
    )

    console.timeEnd(timeLabel)

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.length - successCount

    console.log('')
    console.log('Build Summary:')
    console.log(`✅ Successful: ${successCount}`)
    console.log(`❌ Failed: ${failureCount}`)

    if (failureCount > 0) {
      console.log('')
      console.log('❌ Failed plugins:')
      results
        .filter((r) => !r.success)
        .forEach((r) => console.log(`   - ${r.plugin.className}: ${r.error.message}`))

      process.exit(1)
    } else {
      console.log('')
      console.log('🎉 All plugins built successfully!')
    }
  } catch (error) {
    console.error(`❌ Build process failed: ${error.message}`)
    process.exit(1)
  }
}

// Execute main function
main()
