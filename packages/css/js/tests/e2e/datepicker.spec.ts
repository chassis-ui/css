import { expect, test, type Locator, type Page } from '@playwright/test'
import { openPage } from './helpers/pages'

// The Datepicker of js/tests/visual/datepicker.html, with the production bundle and its bundled
// Vanilla Calendar Pro: what the unit spec cannot cover, a real keyboard and a real pointer,
// focus, and the position of the calendar in a real layout.
// The page is opened on 2026-01-15 (helpers/pages.ts), in en-US and UTC (playwright.config.ts).

test.beforeEach(async ({ page }) => {
  await openPage(page, 'datepicker')
})

const input = (page: Page, id: string) => page.locator(`#${id}`)

// Each datepicker adds a calendar of its own to the body when it first opens. A closed calendar
// is hidden, and a hidden element is not found by its role, so this is the open one
const calendar = (page: Page) => page.getByRole('application', { name: 'Calendar' })

const button = (page: Page, name: string | RegExp) =>
  calendar(page).getByRole('button', { name, exact: true })

// A day by its full date, `January 20, 2026`
const day = (page: Page, name: string) => button(page, name)
const month = (page: Page) => button(page, /^Select month/)
const year = (page: Page) => button(page, /^Select year/)
const previousMonth = (page: Page) => button(page, 'Previous month')
const nextMonth = (page: Page) => button(page, 'Next month')

const box = async (locator: Locator) => {
  const rect = await locator.boundingBox()
  if (!rect) {
    throw new Error('The element has no box')
  }

  return rect
}

const SHOW = ['show.cx.datepicker', 'shown.cx.datepicker']
const HIDE = ['hide.cx.datepicker', 'hidden.cx.datepicker']

// The names of the events in the log of the page, without the time
const loggedEvents = async (page: Page) => {
  const log = await page.locator('#eventsLog').textContent()
  return (log ?? '').match(/\w+\.cx\.datepicker/g) ?? []
}

test.describe('opening', () => {
  test('focusing the input with the keyboard opens the calendar below it', async ({ page }) => {
    await expect(calendar(page)).toBeHidden()

    await page.keyboard.press('Tab')

    await expect(input(page, 'basicDatepicker')).toBeFocused()
    await expect(calendar(page)).toBeVisible()

    // Below the input, aligned with its left edge (placement `left`), and inside the viewport
    const viewport = page.viewportSize()!
    await expect
      .poll(async () => {
        const anchor = await box(input(page, 'basicDatepicker'))
        const popup = await box(calendar(page))
        const gap = popup.y - (anchor.y + anchor.height)
        return {
          below: gap >= 0 && gap <= 16,
          aligned: Math.abs(popup.x - anchor.x) <= 1,
          inside:
            popup.x >= 0 &&
            popup.y >= 0 &&
            popup.x + popup.width <= viewport.width &&
            popup.y + popup.height <= viewport.height
        }
      })
      .toEqual({ below: true, aligned: true, inside: true })
  })

  test('clicking the input opens the calendar on the month of today', async ({ page }) => {
    await input(page, 'basicDatepicker').click()

    await expect(calendar(page)).toBeVisible()
    await expect(month(page)).toHaveText('January')
    await expect(year(page)).toHaveText('2026')

    const today = calendar(page).locator('[aria-current="date"]')
    await expect(today).toHaveCount(1)
    await expect(today.getByRole('button')).toHaveAccessibleName('January 15, 2026')
  })

  test('the previous and next month controls change the month', async ({ page }) => {
    await input(page, 'basicDatepicker').click()
    await expect(month(page)).toHaveText('January')

    await nextMonth(page).click()
    await expect(month(page)).toHaveText('February')
    await expect(year(page)).toHaveText('2026')
    await expect(day(page, 'February 14, 2026')).toBeVisible()

    await previousMonth(page).click()
    await previousMonth(page).click()
    await expect(month(page)).toHaveText('December')
    await expect(year(page)).toHaveText('2025')
    await expect(day(page, 'December 14, 2025')).toBeVisible()
  })
})

test.describe('selecting a date', () => {
  test('a click on a day writes the date into the input and closes the calendar', async ({
    page
  }) => {
    await input(page, 'basicDatepicker').click()
    await day(page, 'January 20, 2026').click()

    await expect(input(page, 'basicDatepicker')).toHaveValue('1/20/2026')
    await expect(calendar(page)).toBeHidden()

    // The calendar opens again with the day selected
    await input(page, 'basicDatepicker').click()
    await expect(calendar(page)).toBeVisible()
    await expect(day(page, 'January 20, 2026')).toHaveAttribute('aria-selected', 'true')
    await expect(calendar(page).locator('[aria-selected="true"]')).toHaveCount(1)
  })

  test('the arrow keys move into the calendar and between its days, Enter selects', async ({
    page
  }) => {
    await page.keyboard.press('Tab')
    await expect(calendar(page)).toBeVisible()

    // From the input to the first control of the calendar, then along its four controls to the
    // first day
    await page.keyboard.press('ArrowDown')
    await expect(previousMonth(page)).toBeFocused()

    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowRight')
    }

    await expect(day(page, 'December 29, 2025')).toBeFocused()

    // A week down with each ArrowDown, a day forward with ArrowRight
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('ArrowDown')
    }

    await expect(day(page, 'January 19, 2026')).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(day(page, 'January 20, 2026')).toBeFocused()

    await page.keyboard.press('Enter')

    await expect(input(page, 'basicDatepicker')).toHaveValue('1/20/2026')
    await expect(calendar(page)).toBeHidden()
  })

  test('a calendar of multiple dates stays open and lists the dates', async ({ page }) => {
    await input(page, 'multipleDatepicker').click()

    await day(page, 'January 10, 2026').click()
    await expect(input(page, 'multipleDatepicker')).toHaveValue('1/10/2026')

    await day(page, 'January 12, 2026').click()
    await expect(input(page, 'multipleDatepicker')).toHaveValue('1/10/2026, 1/12/2026')
    await expect(day(page, 'January 10, 2026')).toHaveAttribute('aria-selected', 'true')
    await expect(day(page, 'January 12, 2026')).toHaveAttribute('aria-selected', 'true')

    // A click on a selected day takes it out
    await day(page, 'January 10, 2026').click()
    await expect(input(page, 'multipleDatepicker')).toHaveValue('1/12/2026')
    await expect(calendar(page).locator('[aria-selected="true"]')).toHaveCount(1)
    await expect(calendar(page)).toBeVisible()
  })

  test('a calendar of a range closes after the second date', async ({ page }) => {
    await input(page, 'rangeDatepicker').click()

    await day(page, 'January 10, 2026').click()
    await expect(input(page, 'rangeDatepicker')).toHaveValue('1/10/2026')
    await expect(calendar(page)).toBeVisible()

    await day(page, 'January 14, 2026').click()
    await expect(input(page, 'rangeDatepicker')).toHaveValue('1/10/2026 – 1/14/2026')
    await expect(calendar(page)).toBeHidden()
  })

  test('the days before the minimum date cannot be selected', async ({ page }) => {
    await input(page, 'minMaxDatepicker').click()
    await expect(calendar(page)).toBeVisible()

    // January 2026 is the first month: nothing to go back to
    await expect(previousMonth(page)).toBeHidden()
    await expect(nextMonth(page)).toBeVisible()

    await expect(day(page, 'December 31, 2025')).toHaveAttribute('aria-disabled', 'true')
    await day(page, 'December 31, 2025').click({ force: true })
    await expect(input(page, 'minMaxDatepicker')).toHaveValue('')
    await expect(calendar(page)).toBeVisible()

    await expect(day(page, 'January 1, 2026')).not.toHaveAttribute('aria-disabled', 'true')
    await day(page, 'January 1, 2026').click()
    await expect(input(page, 'minMaxDatepicker')).toHaveValue('1/1/2026')
    await expect(calendar(page)).toBeHidden()
  })
})

test.describe('closing', () => {
  test('Escape closes the calendar and the focus stays on the input', async ({ page }) => {
    await input(page, 'basicDatepicker').click()
    await expect(calendar(page)).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(calendar(page)).toBeHidden()
    await expect(input(page, 'basicDatepicker')).toBeFocused()
    await expect(input(page, 'basicDatepicker')).toHaveValue('')

    // A click on the input, which still has the focus, opens it again
    await input(page, 'basicDatepicker').click()
    await expect(calendar(page)).toBeVisible()
  })

  test('Escape returns the focus from the calendar to the input', async ({
    page,
    browserName
  }) => {
    // Expected: the calendar closes and the focus returns to the input, as the hide() of Vanilla
    // Calendar Pro means to (`inputElement.focus()` when the focus is inside the calendar).
    // Chromium: the calendar closes and the focus is left on the body. The button that has the
    // focus loses it while hide() disables the tabbing of the calendar it has just hidden, so
    // hide() no longer finds the focus inside the calendar and does not move it to the input.
    // WebKit: passes. Firefox: not checked (it does not launch locally), so not run either.
    test.fixme(browserName !== 'webkit', 'Chromium leaves the focus on the body')

    await page.keyboard.press('Tab')
    await expect(calendar(page)).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await expect(previousMonth(page)).toBeFocused()

    await page.keyboard.press('Escape')

    await expect(calendar(page)).toBeHidden()
    await expect(input(page, 'basicDatepicker')).toBeFocused()
  })

  test('a click outside closes the calendar', async ({ page }) => {
    await input(page, 'basicDatepicker').click()
    await expect(calendar(page)).toBeVisible()

    await page.getByRole('heading', { level: 1 }).click()

    await expect(calendar(page)).toBeHidden()
    await expect(input(page, 'basicDatepicker')).toHaveValue('')
  })

  // Expected: `hide.cx.datepicker` and `hidden.cx.datepicker` fire whenever the calendar closes,
  // `show.cx.datepicker` and `shown.cx.datepicker` whenever it opens. The docs tell to keep
  // `aria-expanded` of the trigger in sync with these events.
  // Chromium and WebKit: the events fire only when the plugin itself shows or hides the calendar
  // (focus of the input, show(), hide(), a selected date). Vanilla Calendar Pro closes the
  // calendar on Escape and on a click outside, and opens it on a click on the input that already
  // has the focus: no event fires, and the log has only the first `show` and `shown`.
  test.fixme('the events follow a calendar closed with Escape and opened again', async ({
    page
  }) => {
    await input(page, 'eventsDatepicker').click()
    await expect(calendar(page)).toBeVisible()
    await expect.poll(() => loggedEvents(page)).toEqual(SHOW)

    await page.keyboard.press('Escape')
    await expect(calendar(page)).toBeHidden()
    await expect.poll(() => loggedEvents(page)).toEqual([...SHOW, ...HIDE])

    await input(page, 'eventsDatepicker').click()
    await expect(calendar(page)).toBeVisible()
    await expect.poll(() => loggedEvents(page)).toEqual([...SHOW, ...HIDE, ...SHOW])
  })
})
