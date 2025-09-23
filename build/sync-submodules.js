#!/usr/bin/env node

/*!
 * Git Submodule Sync
 *
 * Synchronizes git submodules to their latest versions.
 *
 * Copyright 2025 Ozgur Gunes
 * Licensed under MIT
 */

import { execSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import picocolors from 'picocolors'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const submodules = [{ name: 'chassis-assets', path: 'vendor/assets' }]

function runCommand(command, cwd = process.cwd(), silent = false) {
  const result = execSync(command, {
    cwd,
    encoding: 'utf8',
    stdio: silent ? 'pipe' : 'inherit'
  })
  return result
}

function syncSubmodule(submodule) {
  console.log(picocolors.cyan(`📦 Syncing ${submodule.name}...`))

  const submodulePath = path.join(process.cwd(), submodule.path)

  if (!fs.existsSync(submodulePath)) {
    console.log(picocolors.yellow(`   ⚠️  ${submodule.name} not found at ${submodule.path}`))
    return
  }

  try {
    runCommand(`git submodule update --remote --merge ${submodule.path}`, process.cwd(), true)
    console.log(picocolors.green(`   ✅ ${submodule.name} synced successfully`))
  } catch {
    console.log(
      picocolors.yellow(`   ⚠️  ${submodule.name} has local changes, keeping current version`)
    )
  }
}

function main() {
  try {
    console.log(picocolors.cyan('🔄 Syncing git submodules...'))

    // Check if submodules exist, if not initialize them
    try {
      runCommand('git submodule status', process.cwd(), true)
    } catch {
      console.log(picocolors.cyan('📦 Initializing submodules...'))
      try {
        runCommand('git submodule update --init --recursive')
      } catch {
        console.log(
          picocolors.yellow('⚠️  Some submodules may not be available or have uncommitted changes')
        )
        console.log(picocolors.yellow('Continuing with existing submodules...'))
      }
    }

    // Sync each submodule individually with error handling
    for (const submodule of submodules) {
      syncSubmodule(submodule)
    }

    // Check if there are any changes
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' })
      if (status.trim()) {
        console.log(picocolors.cyan('\n📝 Changes detected in submodules'))
        console.log(
          picocolors.gray(
            '   Run `git add . && git commit -m "chore: update submodules"` to commit changes'
          )
        )
      } else {
        console.log(picocolors.green('\n✅ All submodules are up to date'))
      }
    } catch {
      // Ignore git status errors
    }

    console.log(picocolors.green('🎉 Submodule sync completed!'))
  } catch (error) {
    console.error(picocolors.red('❌ Error:'), error.message)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
