import Jasmine from 'jasmine'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { runSass } from 'sass-true'
import { globby } from 'globby'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Set up Jasmine
const jasmine = new Jasmine()

// Find all SCSS test files
const testFiles = await globby(['**/*.{test,spec}.scss'], {
  cwd: join(__dirname, '.'),
  absolute: true
})

// Process each SCSS test file
for (const testFile of testFiles) {
  const data = readFileSync(testFile, 'utf8')
  const TRUE_SETUP = '$true-terminal-output: false; @import "true";'
  const sassString = TRUE_SETUP + data

  runSass({ describe, it, sourceType: 'string' }, sassString, {
    loadPaths: [dirname(testFile), join(__dirname, '..', 'scss')]
  })
}

// Run the tests
await jasmine.execute()
