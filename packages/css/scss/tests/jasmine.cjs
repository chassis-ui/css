'use strict'

const path = require('node:path')

module.exports = {
  spec_dir: 'scss',
  // Make Jasmine look for `.test.scss` files, and the `.test.cjs` specs that need the Sass API
  spec_files: ['**/*.test.scss', '**/*.test.cjs'],
  // Compile them into JS scripts running `sass-true`
  requires: [path.join(__dirname, 'sass-true/register.cjs')],
  // Ensure we use `require` so that the require.extensions works
  // as `import` completely bypasses it
  jsLoader: 'require'
}
