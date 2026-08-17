/*!
 * Vitest browser mode runs the unit specs in real browsers through Playwright.
 * It replaces Karma. `js/tests/vitest-setup.js` maps the Jasmine API the specs
 * are written against onto Vitest.
 * --------------------------------------------------------------------------
 * Chassis CSS vitest.config.mts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */

import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import tsExtensionAlias from '../../build/rollup-plugin-ts-resolve.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(dirname, '../..')

const DEBUG = Boolean(process.env.DEBUG)

// Chromium alone keeps the local dev loop fast (~20s for the full suite).
// CI, and anyone who opts in locally with ALL_BROWSERS=true before pushing,
// runs the same specs through Firefox and WebKit too — WebKit is the closest
// automatable proxy to Safari, which is where cross-browser regressions in
// this codebase have actually surfaced (focus handling after a click, in
// particular). This replaces the old BrowserStack matrix, which had never
// been wired into any CI workflow in this repo's history and was pinned to
// Chrome 60 / Firefox 60 / iOS 12 / Android 8 — all predating this project's
// browser floors.
const ALL_BROWSERS = Boolean(process.env.CI) || Boolean(process.env.ALL_BROWSERS)

export default defineConfig({
  root,
  plugins: [{ ...tsExtensionAlias(), enforce: 'pre' as const }],
  define: {
    'process.env.NODE_ENV': '"dev"'
  },
  test: {
    // The specs call describe/it/expect as globals, the way Karma provided them
    globals: true,
    setupFiles: [path.resolve(dirname, 'vitest-setup.js')],
    include: ['js/tests/unit/**/*.spec.js'],
    coverage: {
      provider: 'istanbul',
      // Cover every source file, not only the ones a spec happens to import
      include: ['js/src/**/*.ts'],
      reporter: ['text-summary', 'lcov'],
      reportsDirectory: path.resolve(root, 'js/coverage'),
      // Karma's thresholds were 90/89/90/90, but they were measured against a
      // smaller denominator, because istanbul only instrumented the files a spec
      // imported. Counting all of js/src raises the branch denominator and lands
      // at 88.53%, so the branch floor is set to the honest figure. Statements,
      // functions and lines all still clear their old thresholds.
      thresholds: {
        statements: 90,
        branches: 88,
        functions: 90,
        lines: 90
      }
    },
    browser: {
      enabled: true,
      provider: playwright(),
      headless: !DEBUG,
      screenshotFailures: false,
      instances: ALL_BROWSERS ?
        [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }] :
        [{ browser: 'chromium' }]
    }
  }
})
