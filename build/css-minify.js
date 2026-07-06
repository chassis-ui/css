#!/usr/bin/env node

/**
 * CSS minification script using lightningcss
 *
 * This replaces clean-css which doesn't support modern CSS features
 * like light-dark(), color-mix(), @layer, etc.
 */

import fs from 'node:fs'
import path from 'node:path'
import browserslist from 'browserslist'
import { transform, browserslistToTargets } from 'lightningcss'

const distDir = path.join(process.cwd(), 'dist/css')

// Get all CSS files that need minification
const cssFiles = fs
  .readdirSync(distDir)
  .filter((file) => file.endsWith('.css') && !file.endsWith('.min.css'))

// Target browsers, read from .browserslistrc. Minifying without these silently
// drops the project's real support matrix, so a failure here fails the build
// instead of falling back to lightningcss's defaults.
let targets
try {
  const browsers = browserslist()
  console.log('Target browsers from .browserslistrc:', browsers)
  targets = browserslistToTargets(browsers)
} catch (error) {
  console.error('Could not load browserslist targets:', error.message)
  process.exit(1)
}

for (const file of cssFiles) {
  const inputPath = path.join(distDir, file)
  const outputPath = path.join(distDir, file.replace(/\.css$/, '.min.css'))
  const mapPath = `${outputPath}.map`

  console.log(`Minifying ${file}...`)

  const inputCss = fs.readFileSync(inputPath, 'utf8')
  const inputMapPath = `${inputPath}.map`
  const inputMap = fs.existsSync(inputMapPath) ? fs.readFileSync(inputMapPath, 'utf8') : undefined

  try {
    const result = transform({
      filename: file,
      code: Buffer.from(inputCss),
      minify: true,
      sourceMap: true,
      inputSourceMap: inputMap,
      targets
    })

    // Write minified CSS with source map reference
    const minifiedCss = `${result.code.toString()}\n/*# sourceMappingURL=${path.basename(mapPath)} */`
    fs.writeFileSync(outputPath, minifiedCss)

    // Write source map
    if (result.map) {
      // lightningcss always emits a `sourceRoot` key, using JSON null when
      // unset, which violates the source map spec (must be a string or
      // omitted) and triggers "invalid sourceRoot" warnings in devtools.
      const map = JSON.parse(result.map.toString())
      if (map.sourceRoot === null) {
        delete map.sourceRoot
      }
      fs.writeFileSync(mapPath, JSON.stringify(map))
    }

    console.log(`  ✓ ${file} → ${path.basename(outputPath)}`)
  } catch (error) {
    console.error(`  ✗ Error minifying ${file}:`, error.message)
    process.exit(1)
  }
}

console.log('\nCSS minification complete!')
