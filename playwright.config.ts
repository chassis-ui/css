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
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
})
