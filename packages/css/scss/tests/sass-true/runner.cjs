'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { runSass } = require('sass-true')

// Repo root is two levels above `scss/tests/sass-true/`.
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..')
const SCSS_DIR = path.join(REPO_ROOT, 'scss')
const SCSS_DEFAULTS_DIR = path.join(SCSS_DIR, 'defaults')
const SCSS_VENDOR_DIR = path.join(SCSS_DIR, 'vendor')
const NODE_MODULES_DIR = path.join(REPO_ROOT, 'node_modules')

module.exports = (filename, { describe, it }) => {
  const data = fs.readFileSync(filename, 'utf8')
  const TRUE_SETUP = '@use "true" as *;'
  const sassString = TRUE_SETUP + data

  runSass({ describe, it, sourceType: 'string' }, sassString, {
    // Tests reference the framework via bare specifiers (`@use "config"`)
    // and chassis modules pull tokens via `@forward "token-source"` — both
    // depend on the framework's loadPath layout.
    loadPaths: [
      path.dirname(filename),
      SCSS_DIR,
      SCSS_DEFAULTS_DIR,
      SCSS_VENDOR_DIR,
      NODE_MODULES_DIR
    ]
  })
}
