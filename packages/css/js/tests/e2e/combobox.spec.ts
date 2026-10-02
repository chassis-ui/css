import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { clickSlowly, nextFrames, openPage } from './helpers/pages'

// Drives js/tests/visual/combobox.html in real browsers: what the docs promise for the
// keyboard, where focus goes when the menu closes, the filtering as a user types, and the
// values a form submits.

const toggle = (page: Page, name: string) => page.locator(`#${name}Toggle`)
const input = (page: Page, name: string) => toggle(page, name).locator('input.combobox-value')
const menu = (page: Page, name: string) => page.locator(`#${name}Menu`)
const option = (page: Page, name: string, text: string) =>
  menu(page, name).getByRole('option', { name: text, exact: true })
const hiddenInput = (page: Page, name: string) =>
  page.locator(`input[type="hidden"][name="${name}"]`)

const visibleOptions = (page: Page, name: string) =>
  menu(page, name).getByRole('option').filter({ visible: true })

// The menu is open and has settled: when it opens, the plugin gives the focus to the input or
// the search field in the next frame, which a key pressed by a test would come before
async function expectOpen(page: Page, name: string) {
  await expect(menu(page, name)).toBeVisible()
  await expect(toggle(page, name)).toHaveAttribute('aria-expanded', 'true')
  await nextFrames(page)
}

async function expectClosed(page: Page, name: string) {
  await expect(menu(page, name)).toBeHidden()
  await expect(toggle(page, name)).toHaveAttribute('aria-expanded', 'false')
}

const box = async (locator: Locator) => (await locator.boundingBox())!

test.beforeEach(async ({ page }) => {
  await openPage(page, 'combobox')
})

test.describe('input trigger', () => {
  test('a click on the input opens the menu below it, as wide as the toggle', async ({ page }) => {
    await clickSlowly(page, input(page, 'country'))

    await expectOpen(page, 'country')
    await expect(input(page, 'country')).toBeFocused()

    const toggleBox = await box(toggle(page, 'country'))

    // The menu grows to its size while it fades in
    await expect
      .poll(async () => Math.round((await box(menu(page, 'country'))).width))
      .toBe(Math.round(toggleBox.width))

    const menuBox = await box(menu(page, 'country'))

    expect(menuBox.y).toBeGreaterThanOrEqual(toggleBox.y + toggleBox.height)
    expect(menuBox.y).toBeLessThan(toggleBox.y + toggleBox.height + 8)
    expect(Math.abs(menuBox.x - toggleBox.x)).toBeLessThan(1)
  })

  test('the focus on the input opens the menu, ArrowDown goes to its first item', async ({
    page
  }) => {
    await input(page, 'country').focus()

    await expectOpen(page, 'country')
    await expect(input(page, 'country')).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(option(page, 'country', 'United States')).toBeFocused()
  })

  // The docs: with the toggle focused and the menu closed, ArrowDown and ArrowUp open the menu
  // and focus the first or the last item. `expectOpen` waits for the frame in which show()
  // gives the focus to the input, which it must not do here.
  test('ArrowDown opens a closed menu with focus on the first item, ArrowUp on the last', async ({
    page
  }) => {
    await input(page, 'country').focus()
    await expectOpen(page, 'country')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Escape')
    await expectClosed(page, 'country')
    await expect(input(page, 'country')).toBeFocused()

    await page.keyboard.press('ArrowDown')

    await expectOpen(page, 'country')
    await expect(option(page, 'country', 'United States')).toBeFocused()

    await page.keyboard.press('Escape')
    await expectClosed(page, 'country')
    await page.keyboard.press('ArrowUp')

    await expectOpen(page, 'country')
    await expect(option(page, 'country', 'Germany')).toBeFocused()
  })

  test('the arrow keys move through the items, Home and End jump', async ({ page }) => {
    await input(page, 'country').focus()
    await expectOpen(page, 'country')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await expect(option(page, 'country', 'United Kingdom')).toBeFocused()

    await page.keyboard.press('ArrowUp')
    await expect(option(page, 'country', 'United States')).toBeFocused()

    await page.keyboard.press('End')
    await expect(option(page, 'country', 'Germany')).toBeFocused()

    await page.keyboard.press('Home')
    await expect(option(page, 'country', 'United States')).toBeFocused()
  })

  test('the arrow keys wrap at the ends of the list', async ({ page }) => {
    await input(page, 'country').focus()
    await expectOpen(page, 'country')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('End')
    await expect(option(page, 'country', 'Germany')).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(option(page, 'country', 'United States')).toBeFocused()

    await page.keyboard.press('ArrowUp')
    await expect(option(page, 'country', 'Germany')).toBeFocused()
  })

  test('Enter selects the item, closes the menu and gives focus back to the input', async ({
    page
  }) => {
    await input(page, 'country').focus()
    await expectOpen(page, 'country')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await expect(option(page, 'country', 'Canada')).toBeFocused()
    await page.keyboard.press('Enter')

    await expectClosed(page, 'country')
    await expect(input(page, 'country')).toBeFocused()
    await expect(input(page, 'country')).toHaveValue('Canada')
    await expect(hiddenInput(page, 'country')).toHaveValue('ca')
    // The items of a closed menu have no role to find them by
    await expect(menu(page, 'country').locator('[aria-selected="true"]')).toHaveText(['Canada'])
  })

  test('Escape on an item closes the menu and gives focus back to the input', async ({ page }) => {
    await input(page, 'country').focus()
    await expectOpen(page, 'country')
    await page.keyboard.press('ArrowDown')
    await expect(option(page, 'country', 'United States')).toBeFocused()

    await page.keyboard.press('Escape')

    await expectClosed(page, 'country')
    await expect(input(page, 'country')).toBeFocused()
    await expect(hiddenInput(page, 'country')).toHaveValue('')
  })

  // The focus is in the input after a click or while typing, not in the menu
  test('Escape in the input closes the menu', async ({ page }) => {
    await clickSlowly(page, input(page, 'country'))
    await expectOpen(page, 'country')

    await page.keyboard.press('Escape')

    await expectClosed(page, 'country')
    await expect(input(page, 'country')).toBeFocused()
  })

  test('typing filters the list, and the keyboard moves through what is left', async ({ page }) => {
    await clickSlowly(page, input(page, 'country'))
    await expectOpen(page, 'country')
    await page.keyboard.type('uni')

    await expect(visibleOptions(page, 'country')).toHaveText(['United States', 'United Kingdom'])

    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await expect(option(page, 'country', 'United Kingdom')).toBeFocused()

    await page.keyboard.press('ArrowUp')
    await expect(option(page, 'country', 'United States')).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(input(page, 'country')).toHaveValue('United States')
    await expect(hiddenInput(page, 'country')).toHaveValue('us')
  })

  test('a click on an item selects it, a click outside closes the menu', async ({ page }) => {
    await clickSlowly(page, input(page, 'country'))
    await expectOpen(page, 'country')
    await clickSlowly(page, option(page, 'country', 'Australia'))

    await expectClosed(page, 'country')
    await expect(input(page, 'country')).toHaveValue('Australia')

    await clickSlowly(page, input(page, 'country'))
    await expectOpen(page, 'country')
    await page.locator('h1').click()

    await expectClosed(page, 'country')
    await expect(input(page, 'country')).toHaveValue('Australia')
    await expect(hiddenInput(page, 'country')).toHaveValue('au')
  })

  // The plugin moves the focus to the input before it hides the item that has it: WebKit
  // would leave the focus on <body>, and Tab would start from the top of the page
  test('Tab on an item closes the menu and moves on to the next control', async ({ page }) => {
    await input(page, 'country').focus()
    await expectOpen(page, 'country')
    await page.keyboard.press('ArrowDown')
    await expect(option(page, 'country', 'United States')).toBeFocused()

    await page.keyboard.press('Tab')

    await expectClosed(page, 'country')
    await expect(input(page, 'role')).toBeFocused()
  })

  test('opening one combobox closes the other', async ({ page }) => {
    await clickSlowly(page, input(page, 'country'))
    await expectOpen(page, 'country')

    // Far enough down the page for the first menu not to cover it
    await clickSlowly(page, input(page, 'skills'))

    await expectOpen(page, 'skills')
    await expectClosed(page, 'country')
  })

  test('shows the item that is selected in the markup', async ({ page }) => {
    await expect(input(page, 'role')).toHaveValue('Editor')
    await expect(hiddenInput(page, 'role')).toHaveValue('editor')
  })

  test('fires change on the toggle, with the value and the item', async ({ page }) => {
    await page.evaluate(() => {
      document.addEventListener('change.cx.combobox', (event) => {
        const { value, item } = event as unknown as { value: string; item: HTMLElement }

        document.body.dataset.change = `${(event.target as HTMLElement).id} ${value} ${item.textContent}`
      })
    })

    await clickSlowly(page, input(page, 'role'))
    await expectOpen(page, 'role')
    await clickSlowly(page, option(page, 'role', 'Viewer'))

    await expect(page.locator('body')).toHaveAttribute('data-change', 'roleToggle viewer Viewer')
  })
})

test.describe('button trigger with a search field', () => {
  test('shows its placeholder, and Enter opens the menu with focus in the search field', async ({
    page
  }) => {
    await expect(toggle(page, 'city')).toHaveText('Select a city…')

    await toggle(page, 'city').focus()
    await page.keyboard.press('Enter')

    await expectOpen(page, 'city')
    await expect(menu(page, 'city').getByLabel('Filter cities')).toBeFocused()
  })

  test('the search field filters the list and says when nothing is left', async ({ page }) => {
    await clickSlowly(page, toggle(page, 'city'))
    await expectOpen(page, 'city')
    await expect(menu(page, 'city').getByLabel('Filter cities')).toBeFocused()
    await page.keyboard.type('l')

    await expect(visibleOptions(page, 'city')).toHaveText([
      'Berlin',
      'Istanbul',
      'Lisbon',
      'London'
    ])
    await expect(menu(page, 'city').getByText('No results found')).toBeHidden()

    await page.keyboard.type('x')

    await expect(visibleOptions(page, 'city')).toHaveCount(0)
    await expect(menu(page, 'city').getByText('No results found')).toBeVisible()
  })

  test('ArrowDown goes from the search field to the first item that is left', async ({ page }) => {
    await clickSlowly(page, toggle(page, 'city'))
    await expectOpen(page, 'city')
    await expect(menu(page, 'city').getByLabel('Filter cities')).toBeFocused()
    await page.keyboard.type('lis')
    await expect(visibleOptions(page, 'city')).toHaveText(['Lisbon'])
    await page.keyboard.press('ArrowDown')

    await expect(option(page, 'city', 'Lisbon')).toBeFocused()

    await page.keyboard.press('Enter')

    await expectClosed(page, 'city')
    await expect(toggle(page, 'city')).toBeFocused()
    await expect(toggle(page, 'city')).toHaveText('Lisbon')
    await expect(hiddenInput(page, 'city')).toHaveValue('lis')
  })

  test('Escape in the search field closes the menu and gives focus back to the button', async ({
    page
  }) => {
    await clickSlowly(page, toggle(page, 'city'))
    await expectOpen(page, 'city')
    await expect(menu(page, 'city').getByLabel('Filter cities')).toBeFocused()

    await page.keyboard.press('Escape')

    await expectClosed(page, 'city')
    await expect(toggle(page, 'city')).toBeFocused()
  })
})

test.describe('multiple selection', () => {
  test('a click toggles an item and the menu stays open', async ({ page }) => {
    await clickSlowly(page, input(page, 'skills'))
    await expectOpen(page, 'skills')
    await clickSlowly(page, option(page, 'skills', 'HTML'))

    await expectOpen(page, 'skills')
    await expect(input(page, 'skills')).toHaveValue('HTML')
    await expect(hiddenInput(page, 'skills')).toHaveValue('html')

    await clickSlowly(page, option(page, 'skills', 'JavaScript'))

    await expectOpen(page, 'skills')
    await expect(input(page, 'skills')).toHaveValue('2 selected')
    await expect(hiddenInput(page, 'skills')).toHaveValue('html,js')
    await expect(menu(page, 'skills').locator('[aria-selected="true"]')).toHaveText([
      'HTML',
      'JavaScript'
    ])

    await clickSlowly(page, option(page, 'skills', 'HTML'))

    await expect(input(page, 'skills')).toHaveValue('JavaScript')
    await expect(hiddenInput(page, 'skills')).toHaveValue('js')
    await expect(option(page, 'skills', 'HTML')).toHaveAttribute('aria-selected', 'false')
  })
})

test.describe('disabled', () => {
  test('does not open', async ({ page }) => {
    await expect(toggle(page, 'plan')).toHaveAttribute('aria-disabled', 'true')
    await expect(input(page, 'plan')).toBeDisabled()

    // The input is disabled, so the click lands on the toggle around it
    await toggle(page, 'plan').click({ force: true, position: { x: 4, y: 4 } })

    await expect(menu(page, 'plan')).toBeHidden()
  })
})

test.describe('in a form', () => {
  test('submits the values of the comboboxes that are not disabled', async ({ page }) => {
    await clickSlowly(page, input(page, 'country'))
    await expectOpen(page, 'country')
    await clickSlowly(page, option(page, 'country', 'Germany'))
    await clickSlowly(page, toggle(page, 'city'))
    await expectOpen(page, 'city')
    await clickSlowly(page, option(page, 'city', 'Istanbul'))
    await clickSlowly(page, input(page, 'skills'))
    await expectOpen(page, 'skills')
    await clickSlowly(page, option(page, 'skills', 'CSS'))
    await clickSlowly(page, option(page, 'skills', 'HTML'))
    await clickSlowly(page, page.locator('h1'))
    await expectClosed(page, 'skills')

    await page.locator('#submit').click()

    await expect(page.locator('#values')).toHaveText(
      'country=de&role=editor&city=ist&skills=html%2Ccss'
    )
  })
})
