import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { openPage } from './helpers/pages'

// Drives js/tests/visual/accordion.html in real browsers. The accordion is a list of native
// <details> elements, so the browser toggles them and moves focus; the plugin animates the
// height and leaves a copy of a closing item in the page while it does. These tests are about
// what is left when it is done: the right items open, no copy, and a keyboard that still
// moves on.

// Not the copy of a closing item, which has its id while the animation runs
const item = (page: Page, id: string) => page.locator(`#${id}:not([data-cx-clone])`)
const summary = (page: Page, id: string) => item(page, id).locator('> summary')
const body = (page: Page, id: string) => item(page, id).locator('> .accordion-body')
const openItems = (page: Page, accordion: string) =>
  page.locator(`#${accordion} > details[open]:not([data-cx-clone])`)

// Nothing of an animation is left: no copy of an item, no height or overflow on one
async function expectSettled(page: Page) {
  await expect(page.locator('details[data-cx-clone]')).toHaveCount(0)
  await expect
    .poll(() =>
      page
        .locator('.accordion > details')
        .evaluateAll((items: HTMLElement[]) =>
          items.filter(({ style }) => style.height || style.overflow).map(({ id }) => id)
        )
    )
    .toEqual([])
}

test.beforeEach(async ({ page }) => {
  await openPage(page, 'accordion')
})

test.describe('items of a group', () => {
  test('a click on a summary opens its item and closes the open one', async ({ page }) => {
    await expect(item(page, 'groupOne')).toHaveJSProperty('open', true)
    await expect(body(page, 'groupTwo')).toBeHidden()

    await summary(page, 'groupTwo').click()

    await expect(item(page, 'groupTwo')).toHaveJSProperty('open', true)
    await expect(body(page, 'groupTwo')).toBeVisible()
    await expect(item(page, 'groupOne')).toHaveJSProperty('open', false)
    await expect(body(page, 'groupOne')).toBeHidden()
    await expect(openItems(page, 'group')).toHaveCount(1)
    await expectSettled(page)
  })

  test('a click on the summary of the open item closes it', async ({ page }) => {
    await summary(page, 'groupOne').click()

    await expect(item(page, 'groupOne')).toHaveJSProperty('open', false)
    await expect(openItems(page, 'group')).toHaveCount(0)
    await expectSettled(page)
  })

  test('items that are opened one after the other leave one open', async ({ page }) => {
    await summary(page, 'groupTwo').click()
    await summary(page, 'groupThree').click()
    await summary(page, 'groupOne').click()

    await expect(item(page, 'groupOne')).toHaveJSProperty('open', true)
    await expect(openItems(page, 'group')).toHaveCount(1)
    await expectSettled(page)
  })

  test('fires open and opened on the item that opens, close and closed on the other', async ({
    page
  }) => {
    await page.evaluate(() => {
      const events: string[] = []
      ;(window as unknown as { events: string[] }).events = events

      for (const type of ['open', 'opened', 'close', 'closed']) {
        document.addEventListener(`${type}.cx.accordion`, (event) => {
          events.push(`${(event.target as HTMLElement).id} ${type}`)
        })
      }
    })
    const eventsOf = (id: string) =>
      page.evaluate(
        (prefix) =>
          (window as unknown as { events: string[] }).events.filter((event) =>
            event.startsWith(prefix)
          ),
        `${id} `
      )

    await summary(page, 'groupTwo').click()

    await expect.poll(() => eventsOf('groupTwo')).toEqual(['groupTwo open', 'groupTwo opened'])
    await expect.poll(() => eventsOf('groupOne')).toEqual(['groupOne close', 'groupOne closed'])
  })
})

test.describe('items without a name', () => {
  test('open and close by themselves', async ({ page }) => {
    await summary(page, 'independentTwo').click()

    await expect(item(page, 'independentTwo')).toHaveJSProperty('open', true)
    await expect(item(page, 'independentOne')).toHaveJSProperty('open', true)

    await summary(page, 'independentOne').click()

    await expect(item(page, 'independentOne')).toHaveJSProperty('open', false)
    await expect(item(page, 'independentTwo')).toHaveJSProperty('open', true)
    await expectSettled(page)
  })

  test('leave the items of a group as they are', async ({ page }) => {
    await summary(page, 'independentTwo').click()

    await expect(item(page, 'groupOne')).toHaveJSProperty('open', true)
  })
})

test.describe('keyboard', () => {
  test('Enter and Space toggle the item whose summary has focus', async ({ page }) => {
    await summary(page, 'groupTwo').focus()
    await page.keyboard.press('Enter')

    await expect(item(page, 'groupTwo')).toHaveJSProperty('open', true)
    await expect(item(page, 'groupOne')).toHaveJSProperty('open', false)
    await expect(summary(page, 'groupTwo')).toBeFocused()

    await page.keyboard.press('Space')

    await expect(item(page, 'groupTwo')).toHaveJSProperty('open', false)
    await expect(summary(page, 'groupTwo')).toBeFocused()
    await expectSettled(page)
  })

  test('Tab goes through the summaries in order, and into an open body', async ({ page }) => {
    await summary(page, 'groupTwo').focus()
    await page.keyboard.press('Enter')
    await expect(body(page, 'groupTwo')).toBeVisible()
    await expectSettled(page)

    await summary(page, 'groupOne').focus()
    await page.keyboard.press('Tab')
    await expect(summary(page, 'groupTwo')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.locator('#groupTwoButton')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(summary(page, 'groupThree')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.locator('#between')).toBeFocused()
  })

  test('Tab moves on after an item was opened with the mouse', async ({ page }) => {
    await summary(page, 'groupTwo').click()
    await expect(body(page, 'groupTwo')).toBeVisible()
    await expectSettled(page)

    await page.keyboard.press('Tab')
    await expect(page.locator('#groupTwoButton')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(summary(page, 'groupThree')).toBeFocused()
  })

  test('Tab moves on after an item was closed with the mouse', async ({ page }) => {
    await summary(page, 'groupOne').click()
    await expect(item(page, 'groupOne')).toHaveJSProperty('open', false)
    await expectSettled(page)

    await page.keyboard.press('Tab')
    await expect(summary(page, 'groupTwo')).toBeFocused()

    await page.keyboard.press('Shift+Tab')
    await expect(summary(page, 'groupOne')).toBeFocused()
  })
})
