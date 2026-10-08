'use strict'

// What the `.test.cjs` specs share. They compile through the Sass API what
// sass-true cannot assert on: an `@error`, a `@warn`, a whole entry point, a
// module with a configuration of its own.

const path = require('node:path')
const sass = require('sass')

const SCSS_DIR = path.resolve(__dirname, '..', '..')

// The framework by bare name (`@use "config"`), the default token source and
// the packages, as the build resolves them
const LOAD_PATHS = [
  SCSS_DIR,
  path.join(SCSS_DIR, 'vendor'),
  path.resolve(SCSS_DIR, '..', 'node_modules')
]

// Compiles `source` and returns its CSS with the `@warn` messages of the
// compilation. `options` are options of `sass.compileString()`.
function compile(source, options = {}) {
  const warnings = []
  const { css } = sass.compileString(source, {
    loadPaths: LOAD_PATHS,
    logger: {
      warn: (message) => warnings.push(message),
      debug() {}
    },
    ...options
  })
  return { css, warnings }
}

module.exports = { compile }
