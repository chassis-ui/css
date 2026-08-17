import { expect, test } from '@playwright/test'

// Converts js/tests/visual/tab.html from a manually-eyeballed fixture into
// real-browser behavior assertions (chromium/firefox/webkit projects).

test.beforeEach(async ({ page }) => {
  await page.goto('/js/tests/visual/tab.html')
})

const tab = (page, controls: string) => page.locator(`[aria-controls="${controls}"]`)
const pane = (page, id: string) => page.locator(`#${id}`)

test.describe('tabs without fade', () => {
  test('clicking a tab activates it and its pane, deactivating the previous one', async ({ page }) => {
    await expect(tab(page, 'home')).toHaveClass(/active/)
    await expect(tab(page, 'home')).toHaveAttribute('aria-selected', 'true')
    await expect(pane(page, 'home')).toHaveClass(/active/)

    await tab(page, 'profile').click()

    await expect(tab(page, 'profile')).toHaveClass(/active/)
    await expect(tab(page, 'profile')).toHaveAttribute('aria-selected', 'true')
    await expect(tab(page, 'profile')).not.toHaveAttribute('tabindex', '-1')
    await expect(pane(page, 'profile')).toHaveClass(/active/)

    await expect(tab(page, 'home')).not.toHaveClass(/active/)
    await expect(tab(page, 'home')).toHaveAttribute('aria-selected', 'false')
    await expect(tab(page, 'home')).toHaveAttribute('tabindex', '-1')
    await expect(pane(page, 'home')).not.toHaveClass(/active/)
  })

  test('arrow keys move focus and activation between tabs (roving tabindex)', async ({ page }) => {
    await tab(page, 'home').focus()

    await page.keyboard.press('ArrowRight')
    await expect(tab(page, 'profile')).toBeFocused()
    await expect(tab(page, 'profile')).toHaveClass(/active/)

    await page.keyboard.press('End')
    await expect(tab(page, 'mdo')).toBeFocused()
    await expect(tab(page, 'mdo')).toHaveClass(/active/)

    await page.keyboard.press('Home')
    await expect(tab(page, 'home')).toBeFocused()
    await expect(tab(page, 'home')).toHaveClass(/active/)
  })
})

test.describe('tabs with fade', () => {
  test('activating a tab fades the old pane out and the new pane in', async ({ page }) => {
    await expect(pane(page, 'home2')).toHaveClass(/\bshow\b/)
    await expect(pane(page, 'home2')).toHaveClass(/\bactive\b/)

    await tab(page, 'profile2').click()

    await expect(pane(page, 'profile2')).toHaveClass(/\bshow\b/)
    await expect(pane(page, 'profile2')).toHaveClass(/\bactive\b/)
    await expect(pane(page, 'home2')).not.toHaveClass(/\bshow\b/)
    await expect(pane(page, 'home2')).not.toHaveClass(/\bactive\b/)
  })

  test('fires show/shown/hide/hidden events on the tab elements', async ({ page }) => {
    await page.evaluate(() => {
      (window as unknown as { events: string[] }).events = []
      const record = (name: string) => document.addEventListener(name, () => {
        (window as unknown as { events: string[] }).events.push(name)
      })
      for (const name of ['show.cx.tab', 'shown.cx.tab', 'hide.cx.tab', 'hidden.cx.tab']) {
        record(name)
      }
    })

    await tab(page, 'profile2').click()
    await expect(pane(page, 'profile2')).toHaveClass(/\bshow\b/)

    const events = await page.evaluate(() => (window as unknown as { events: string[] }).events)
    expect(events).toEqual(['hide.cx.tab', 'show.cx.tab', 'hidden.cx.tab', 'shown.cx.tab'])
  })
})

test.describe('tabs without an initially active pane', () => {
  test('no tab or pane is active until one is clicked', async ({ page }) => {
    await expect(tab(page, 'home3')).not.toHaveClass(/active/)
    await expect(tab(page, 'profile3')).not.toHaveClass(/active/)

    await tab(page, 'home3').click()

    await expect(tab(page, 'home3')).toHaveClass(/active/)
    await expect(pane(page, 'home3')).toHaveClass(/active/)
  })
})

test.describe('tabs with nav links (with fade)', () => {
  test('clicking the disabled tab does not change the active pane', async ({ page }) => {
    await expect(pane(page, 'home5')).toHaveClass(/\bactive\b/)

    const disabled = page.locator('#nav-tab .disabled')
    await expect(disabled).toHaveAttribute('aria-disabled', 'true')
    await disabled.click({ force: true })

    await expect(pane(page, 'home5')).toHaveClass(/\bactive\b/)
    await expect(page).toHaveURL(/tab\.html$/)
  })
})

test.describe('tabs with list-group (with fade)', () => {
  test('clicking a list-group item switches the active tab panel', async ({ page }) => {
    await expect(page.locator('#list-home-list')).toHaveClass(/active/)
    await expect(pane(page, 'list-home')).toHaveClass(/\bactive\b/)

    await page.locator('#list-profile-list').click()

    await expect(page.locator('#list-profile-list')).toHaveClass(/active/)
    await expect(pane(page, 'list-profile')).toHaveClass(/\bactive\b/)
    await expect(page.locator('#list-home-list')).not.toHaveClass(/active/)
    await expect(pane(page, 'list-home')).not.toHaveClass(/\bactive\b/)
  })
})
