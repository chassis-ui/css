import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Locator, Page } from '@playwright/test'

// The pages of js/tests/visual/: one per plugin, written to be checked by hand, and opened by
// the tests of this directory

const PAGES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../visual')

export const PAGES_URL = '/js/tests/visual'

export const THEMES = ['light', 'dark'] as const

export type Theme = (typeof THEMES)[number]

// The day the pages are opened on: a calendar shows the month of today
export const TODAY = new Date('2026-01-15T12:00:00Z')

/** The names of the pages: `menu` for js/tests/visual/menu.html */
export const pages: string[] = fs
  .readdirSync(PAGES_DIR)
  .filter((file) => file.endsWith('.html'))
  .map((file) => file.replace(/\.html$/, ''))
  .sort()

/** Two frames of the page: what a plugin left for the next frame has been done */
export const nextFrames = (page: Page) =>
  page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  )

/**
 * A click as a hand does it, with the button down for a moment. A menu that opens when the
 * button goes down is put in its place a frame later; a click without any time in it lets the
 * button go while the menu is still where it was shown, over its toggle.
 */
export async function clickSlowly(page: Page, locator: Locator) {
  // Waits until the element is in view and nothing covers it, without clicking
  await locator.click({ trial: true })
  const box = (await locator.boundingBox())!

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await nextFrames(page)
  await page.mouse.up()
}

/**
 * Opens a page of js/tests/visual/, on the same day and in the given theme
 */
export async function openPage(page: Page, name: string, theme: Theme = 'light') {
  await page.clock.setFixedTime(TODAY)
  // The framework follows the color scheme of the system unless `data-cx-theme` is set
  await page.emulateMedia({ colorScheme: theme })
  await page.goto(`${PAGES_URL}/${name}.html`)
}
