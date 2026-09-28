import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { openPage, TODAY } from './helpers/pages'

// Drives js/tests/visual/toast.html in real browsers, with the bundle the page loads. The page
// has two toasts, which its button shows together: one that hides by itself after 2 seconds,
// and one with autohide off. These tests are about what a user notices: the toasts are shown
// as live regions, a pointer or a keyboard closes them, the first one leaves after its delay
// unless the pointer or the focus is in it, and the second one takes its place.
//
// The clock of Playwright has the timers of the page (`openPage` installs it when it fixes the
// date). They run in real time, until a test of the delay pauses the clock and moves it.

// `data-cx-delay` of #toastAutoHide
const DELAY = 2000
// The default delay, which the toast with autohide off would have
const DEFAULT_DELAY = 5000
// More than the transition of a toast (0.15s), with the clock paused
const TRANSITION = 1000

const showButton = (page: Page) => page.getByRole('button', { name: 'Show toast' })
const closeButton = (toast: Locator) => toast.getByRole('button', { name: 'Close' })
const autohideToast = (page: Page) => page.locator('#toastAutoHide')
// The toast with autohide off has no id. A hidden toast is not in the accessibility tree.
const lastingToast = (page: Page) =>
  page.getByRole('alert', { includeHidden: true }).filter({ hasText: 'stack automatically' })

// The transition is over, and the toast is opaque
async function expectShown(toast: Locator) {
  await expect(toast).toBeVisible()
  await expect(toast).toHaveClass(/\bshow\b/)
  await expect(toast).not.toHaveClass(/\bshowing\b/)
}

// No timer of the page fires unless the test moves the clock
async function pauseClock(page: Page) {
  await page.clock.pauseAt(TODAY)
}

// With the clock paused. A plugin waits for `transitionend`, and for a timer when the event
// does not come: the clock moves past that timer, and fires it once.
async function endTransition(page: Page) {
  await page.clock.fastForward(TRANSITION)
}

async function showToasts(page: Page) {
  await showButton(page).click()
  await endTransition(page)
  await expectShown(autohideToast(page))
  await expectShown(lastingToast(page))
}

async function expectAutohideAfterDelay(page: Page) {
  const toast = autohideToast(page)

  await page.clock.runFor(DELAY - 1)
  await expectShown(toast)

  await page.clock.runFor(1)
  await expect(toast).toHaveClass(/\bshowing\b/)
  await endTransition(page)
  await expect(toast).toBeHidden()
}

async function box(toast: Locator) {
  const rect = await toast.boundingBox()
  if (!rect) {
    throw new Error('The toast is not shown')
  }

  return rect
}

test.beforeEach(async ({ page }) => {
  await openPage(page, 'toast')
})

test.describe('showing and closing', () => {
  test('the button shows the toasts, as live regions', async ({ page }) => {
    await expect(autohideToast(page)).toBeHidden()
    await expect(lastingToast(page)).toBeHidden()
    await expect(page.getByRole('alert')).toHaveCount(0)

    await pauseClock(page)
    await showToasts(page)

    await expect(page.getByRole('alert')).toHaveCount(2)
    for (const toast of [autohideToast(page), lastingToast(page)]) {
      await expect(toast).toHaveRole('alert')
      await expect(toast).toHaveAttribute('aria-live', 'assertive')
      await expect(toast).toHaveAttribute('aria-atomic', 'true')
      await expect(toast).toHaveCSS('opacity', '1')
    }

    await expect(autohideToast(page)).toContainText('Hello, world!')
  })

  test('a click on the close button hides the toast', async ({ page }) => {
    const toast = lastingToast(page)

    await showButton(page).click()
    await expectShown(toast)

    await closeButton(toast).click()

    await expect(toast).toBeHidden()
    await expect(toast).not.toHaveClass(/\bshow(ing)?\b/)
  })

  test('Enter on the close button hides the toast', async ({ page }) => {
    const toast = lastingToast(page)

    await showButton(page).click()
    await expectShown(toast)

    await closeButton(toast).focus()
    await page.keyboard.press('Enter')

    await expect(toast).toBeHidden()
  })

  test('show, shown, hide and hidden fire in order on the toast', async ({ page }) => {
    const toast = autohideToast(page)
    const events = () =>
      page.evaluate(() => (window as unknown as { toastEvents: string[] }).toastEvents)

    await toast.evaluate((element) => {
      const toastEvents: string[] = []
      Object.assign(window, { toastEvents })
      for (const name of ['show.cx.toast', 'shown.cx.toast', 'hide.cx.toast', 'hidden.cx.toast']) {
        element.addEventListener(name, () => toastEvents.push(name))
      }
    })

    // `shown` and `hidden` wait for the end of the transition
    await pauseClock(page)
    await showButton(page).click()
    expect(await events()).toEqual(['show.cx.toast'])

    await endTransition(page)
    await expectShown(toast)
    expect(await events()).toEqual(['show.cx.toast', 'shown.cx.toast'])

    await page.clock.runFor(DELAY)
    await endTransition(page)
    await expect(toast).toBeHidden()
    expect(await events()).toEqual([
      'show.cx.toast',
      'shown.cx.toast',
      'hide.cx.toast',
      'hidden.cx.toast'
    ])
  })
})

test.describe('autohide', () => {
  test.beforeEach(async ({ page }) => {
    await pauseClock(page)
    await showToasts(page)
  })

  test('the toast hides after its delay, and not before', async ({ page }) => {
    await expectAutohideAfterDelay(page)
  })

  // The delay starts again when the pointer leaves: the time before it came does not count
  test('the pointer over the toast holds it, until the pointer leaves', async ({ page }) => {
    const toast = autohideToast(page)

    await page.clock.runFor(DELAY - 1)
    await toast.hover()
    await page.clock.runFor(DELAY * 2)
    await expectShown(toast)

    await page.getByRole('heading', { level: 1 }).hover()

    await expectAutohideAfterDelay(page)
  })

  test('the focus in the toast holds it, until the focus leaves', async ({ page }) => {
    const toast = autohideToast(page)

    await page.clock.runFor(DELAY - 1)
    await closeButton(toast).focus()
    await expect(closeButton(toast)).toBeFocused()
    await page.clock.runFor(DELAY * 2)
    await expectShown(toast)

    await showButton(page).focus()
    await expect(showButton(page)).toBeFocused()

    await expectAutohideAfterDelay(page)
  })

  test('a toast with autohide off stays', async ({ page }) => {
    await page.clock.runFor(DEFAULT_DELAY * 2)
    await endTransition(page)

    await expect(autohideToast(page)).toBeHidden()
    await expectShown(lastingToast(page))
  })

  test('the toasts stack, and one takes the place of the one that hides', async ({ page }) => {
    const first = await box(autohideToast(page))
    const second = await box(lastingToast(page))

    expect(second.y).toBeGreaterThanOrEqual(first.y + first.height)
    expect(second.x).toBe(first.x)
    expect(second.width).toBe(first.width)

    await page.clock.runFor(DELAY)
    await endTransition(page)
    await expect(autohideToast(page)).toBeHidden()

    await expect.poll(async () => (await box(lastingToast(page))).y).toBe(first.y)
  })
})
