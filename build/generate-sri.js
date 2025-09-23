#!/usr/bin/env node

/*!
 * SRI Hash Generation Script
 *
 * Generates Subresource Integrity (SRI) hashes for CSS and JavaScript files
 * and updates the site configuration with the computed integrity values.
 *
 * This ensures that external resources loaded by the documentation site
 * maintain integrity and security by preventing tampering.
 *
 * Usage:
 *   node generate-sri.js
 *
 * Requirements:
 *   - Built distribution files must exist in dist/ directory
 *   - Popper.js must be installed via npm
 *   - Site config.yml must be present and writable
 *
 * Output:
 *   - Updates site/config.yml with new SRI hashes
 *   - Console output showing generated hashes
 *
 * Copyright 2025 Ozgur Gunes
 * Licensed under MIT
 */

import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Configuration constants
const CONFIG = {
  configFile: path.join(__dirname, '../site/config.yml'),
  algorithm: 'sha384'
}

// Array of objects which holds the files to generate SRI hashes for.
// `file` is the path from the root folder
// `configPropertyName` is the config.yml variable's name of the file
const FILES_TO_HASH = [
  {
    file: 'dist/css/chassis.min.css',
    configPropertyName: 'css_hash'
  },
  {
    file: 'dist/css/chassis.rtl.min.css',
    configPropertyName: 'css_rtl_hash'
  },
  {
    file: 'dist/js/chassis.min.js',
    configPropertyName: 'js_hash'
  },
  {
    file: 'dist/js/chassis.bundle.min.js',
    configPropertyName: 'js_bundle_hash'
  },
  {
    file: 'node_modules/@popperjs/core/dist/umd/popper.min.js',
    configPropertyName: 'popper_hash'
  }
]

/**
 * Generates SRI hash for a file
 * @param {string} filePath - Path to the file to hash
 * @returns {string} SRI integrity string
 */
async function generateSRIHash(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    const hash = crypto.createHash(CONFIG.algorithm).update(data, 'utf8').digest('base64')
    return `${CONFIG.algorithm}-${hash}`
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`)
    }
    throw new Error(`Failed to read file ${filePath}: ${error.message}`)
  }
}

/**
 * Updates a single property in the YAML config file
 * @param {string} propertyName - The property name to update
 * @param {string} newValue - The new value to set
 */
async function updateConfigProperty(propertyName, newValue) {
  try {
    const configContent = await fs.readFile(CONFIG.configFile, 'utf8')
    // Match properties under the cdn section with proper indentation (2 spaces)
    const regex = new RegExp(`^(  ${propertyName}:\\s+["'])\\S*(["'])`, 'm')
    const match = configContent.match(regex)

    if (!match) {
      console.warn(`⚠️ Property '${propertyName}' not found in config file`)
      return false
    }

    const updatedContent = configContent.replace(regex, `$1${newValue}$2`)

    if (configContent === updatedContent) {
      return false
    }

    await fs.writeFile(CONFIG.configFile, updatedContent, 'utf8')
    return true
  } catch (error) {
    throw new Error(`⚠️ Failed to update config property ${propertyName}: ${error.message}`)
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('⚙️ Generating SRI hashes...')

  let hasErrors = false

  for (const { file, configPropertyName } of FILES_TO_HASH) {
    try {
      const integrity = await generateSRIHash(file)
      const updated = await updateConfigProperty(configPropertyName, integrity)

      if (updated) {
        console.log(`✓ ${configPropertyName}: ${integrity}`)
      } else {
        console.log(`✓ ${configPropertyName}: ${integrity} (already up to date)`)
      }
    } catch (error) {
      console.error(`✕ Error processing ${file}: ${error.message}`)
      hasErrors = true
    }
  }

  if (hasErrors) {
    console.error('❌ SRI generation completed with errors')
    process.exit(1)
  } else {
    console.log('✅ SRI generation completed successfully')
  }
}

// Execute main function
main()
