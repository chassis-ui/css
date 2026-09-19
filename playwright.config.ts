import { defineConfig, devices } from '@playwright/test'

const PORT = 4310

export default defineConfig({
  testDir: 'js/tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'dot' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure'
  },
  webServer: {
    command: `node js/tests/e2e/static-server.mjs`,
    url: `http://localhost:${PORT}/js/tests/visual/tab.html`,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(PORT) }
  },
  projects: [
    // tailwind-parity compiles a real Tailwind build in beforeAll and runs a
    // 2-viewport x 3-color-scheme computed-style matrix -- slower than the
    // rest of the e2e suite, so it's excluded from the default three
    // browsers and run on request via `pnpm js:test:e2e:tailwind-parity`
    // (see AGENTS.md).
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /tailwind-parity/ },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: /tailwind-parity/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: /tailwind-parity/ },
    { name: 'tailwind-parity', use: { ...devices['Desktop Chrome'] }, testMatch: /tailwind-parity/ }
  ]
})
