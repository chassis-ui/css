import { expect, test, type Page } from '@playwright/test'
import { openPage } from './helpers/pages'

// The Dialog plugin in js/tests/visual/modal.html and alert.html, as the production bundle
// runs it: what a real keyboard and pointer do to a native <dialog>, where the focus goes,
// and what the page behind a modal dialog receives. The unit specs cover the API.

type Recorded = { dialogEvents: string[] }

// Records the events of the plugin, which bubble, as `shown basicModal`
const record = (page: Page) =>
  page.evaluate(() => {
    const log: string[] = []
    Object.assign(window, { dialogEvents: log })
    for (const name of ['show', 'shown', 'hide', 'hidden', 'hidePrevented']) {
      document.addEventListener(`${name}.cx.dialog`, (event) => {
        log.push(`${name} ${(event.target as Element).id}`)
      })
    }
  })

const events = (page: Page, id: string) =>
  page.evaluate(
    (suffix) =>
      (window as unknown as Recorded).dialogEvents
        .filter((entry) => entry.endsWith(suffix))
        .map((entry) => entry.split(' ')[0]),
    ` ${id}`
  )

// The plugin ignores hide() until the dialog has finished opening: every test waits for `shown`
// before it tries to close one
const shown = (page: Page, id: string) =>
  expect.poll(async () => (await events(page, id)).at(-1)).toBe('shown')

// The number of attempts to close the dialog that the plugin has refused
const refused = (page: Page, id: string, count: number) =>
  expect
    .poll(async () => (await events(page, id)).filter((name) => name === 'hidePrevented').length)
    .toBe(count)

// The trigger of a dialog in the page, not the one in another dialog
const trigger = (page: Page, id: string) =>
  page.locator(`[data-cx-target="#${id}"]:not(dialog *)`)

const open = async (page: Page, id: string) => {
  await trigger(page, id).click()
  await shown(page, id)
}

// A click of the pointer where a trigger of the page is. Behind a modal dialog, that is a click
// on the backdrop.
const clickAtTrigger = async (page: Page, id: string) => {
  const box = await trigger(page, id).boundingBox()
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2)
}

test.describe('modal dialogs', () => {
  test.beforeEach(async ({ page }) => {
    await openPage(page, 'modal')
    await record(page)
  })

  test('a trigger opens the dialog as a modal and moves the focus to it', async ({ page }) => {
    await open(page, 'basicModal')

    const dialog = page.getByRole('dialog', { name: 'Modal title' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveId('basicModal')
    await expect(page.locator('#basicModal:modal')).toHaveCount(1)
    // The dialog itself, not its first control
    await expect(dialog).toBeFocused()
  })

  test('Escape closes the dialog and returns the focus to the trigger', async ({ page }) => {
    await trigger(page, 'basicModal').focus()
    await page.keyboard.press('Enter')
    await shown(page, 'basicModal')

    await page.keyboard.press('Escape')

    await expect(page.locator('#basicModal')).toBeHidden()
    await expect(trigger(page, 'basicModal')).toBeFocused()
  })

  test('the close button and the dismiss button of the footer close the dialog', async ({
    page
  }) => {
    await open(page, 'basicModal')
    await page.locator('#basicModal .modal-header').getByRole('button', { name: 'Close' }).click()

    await expect(page.locator('#basicModal')).toBeHidden()
    await expect(trigger(page, 'basicModal')).toBeFocused()

    await open(page, 'scrollableModal')
    await page
      .locator('#scrollableModal .modal-footer')
      .getByRole('button', { name: 'Close' })
      .click()

    await expect(page.locator('#scrollableModal')).toBeHidden()
    await expect(trigger(page, 'scrollableModal')).toBeFocused()
  })

  test('a click on the backdrop closes the dialog and does not reach the page', async ({
    page
  }) => {
    await open(page, 'basicModal')

    await clickAtTrigger(page, 'smallModal')

    await expect(page.locator('#basicModal')).toBeHidden()
    await expect(page.locator('dialog[open]')).toHaveCount(0)
    await expect(trigger(page, 'basicModal')).toBeFocused()
  })

  test('a click on a static backdrop leaves the dialog open, Escape closes it', async ({
    page
  }) => {
    await open(page, 'staticModal')

    await clickAtTrigger(page, 'smallModal')

    await refused(page, 'staticModal', 1)
    await expect(page.locator('#staticModal')).toBeVisible()
    await expect(page.locator('dialog[open]')).toHaveCount(1)

    await page.keyboard.press('Escape')

    await expect(page.locator('#staticModal')).toBeHidden()
    await expect(trigger(page, 'staticModal')).toBeFocused()
  })

  test('Tab and Shift+Tab do not leave the modal dialog', async ({ page }) => {
    await open(page, 'staticModal')

    const dialog = page.locator('#staticModal')
    const closeButton = dialog.locator('.modal-header').getByRole('button', { name: 'Close' })
    const dismissButton = dialog.locator('.modal-footer').getByRole('button', { name: 'Close' })
    const focusOutside = page.locator(':focus:not(#staticModal, #staticModal *)')

    await page.keyboard.press('Tab')
    await expect(closeButton).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(dismissButton).toBeFocused()

    // After the last control the focus goes to the browser or to the first control, and never
    // to the page behind the dialog
    for (let press = 0; press < 4; press++) {
      await page.keyboard.press('Tab')
      await expect(focusOutside).toHaveCount(0)
    }

    await dismissButton.focus()
    await page.keyboard.press('Shift+Tab')
    await expect(closeButton).toBeFocused()

    for (let press = 0; press < 4; press++) {
      await page.keyboard.press('Shift+Tab')
      await expect(focusOutside).toHaveCount(0)
    }

    await expect(dialog).toBeVisible()
  })

  test('a trigger in an open dialog swaps it for its target, one dialog stays open', async ({
    page
  }) => {
    await open(page, 'swapModal1')

    await page.getByRole('button', { name: 'Go to second modal' }).click()
    await shown(page, 'swapModal2')

    await expect(page.locator('#swapModal1')).toBeHidden()
    await expect(page.locator('dialog[open]')).toHaveCount(1)
    await expect(page.locator('#swapModal2:modal')).toBeVisible()
    await expect(page.locator('#swapModal2')).toBeFocused()

    await page.getByRole('button', { name: 'Back to first modal' }).click()
    await shown(page, 'swapModal1')

    await expect(page.locator('#swapModal2')).toBeHidden()
    await expect(page.locator('dialog[open]')).toHaveCount(1)
    await expect(page.locator('#swapModal1:modal')).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(page.locator('dialog[open]')).toHaveCount(0)
  })

  test('a non-modal dialog leaves the page usable, Escape closes it', async ({ page }) => {
    await open(page, 'nonModal')

    const dialog = page.locator('#nonModal')
    await expect(dialog).toBeVisible()
    await expect(page.locator('dialog:modal')).toHaveCount(0)
    await expect(dialog).toBeFocused()

    await page.locator('#tall-toggle').click()

    await expect(page.locator('#tall')).toBeVisible()
    await expect(dialog).toBeVisible()

    // Escape reaches a non-modal dialog when the focus is in it
    await dialog.getByRole('heading', { name: 'Non-modal' }).click()
    await expect(dialog).toBeFocused()
    await page.keyboard.press('Escape')

    await expect(dialog).toBeHidden()
    await expect(trigger(page, 'nonModal')).toBeFocused()
  })

  // Expected: the dialog is at the center of the viewport, as the docs of the non-modal dialog
  // say. Actual, in Chromium and WebKit: its top left corner is at the center, since
  // `.dialog:not(.instant)[open]:not(.hiding) { transform: none }` wins over the
  // `transform: translate(-50%, -50%)` of `.dialog.nonmodal` in scss/_dialog.scss.
  test.fixme('a non-modal dialog is at the center of the viewport', async ({ page }) => {
    await open(page, 'nonModal')

    const viewport = page.viewportSize()!
    const center = async () => {
      const box = await page.locator('#nonModal').boundingBox()
      return [Math.round(box!.x + box!.width / 2), Math.round(box!.y + box!.height / 2)]
    }

    await expect
      .poll(center)
      .toEqual([Math.round(viewport.width / 2), Math.round(viewport.height / 2)])
  })

  test('the input with autofocus has the focus when the dialog opens', async ({ page }) => {
    await open(page, 'autofocusModal')

    const input = page.locator('#autofocusModal').getByPlaceholder('Should receive focus on open')
    await expect(input).toBeFocused()

    await page.keyboard.type('typed')

    await expect(input).toHaveValue('typed')
  })

  test('a dialog opened with JavaScript is modal and closes with its close button', async ({
    page
  }) => {
    await page.getByRole('button', { name: 'Open via JavaScript' }).click()
    await shown(page, 'basicModal')

    await expect(page.locator('#basicModal:modal')).toBeVisible()
    await expect(page.locator('#basicModal')).toBeFocused()

    await page.locator('#basicModal .modal-header').getByRole('button', { name: 'Close' }).click()

    await expect(page.locator('#basicModal')).toBeHidden()
  })
})

test.describe('alert dialogs', () => {
  test.beforeEach(async ({ page }) => {
    await openPage(page, 'alert')
    await record(page)
  })

  test('Escape and the backdrop do not close an alert that allows neither', async ({ page }) => {
    await open(page, 'confirmAlert')

    const alert = page.getByRole('alertdialog', { name: 'Delete item' })
    await expect(alert).toHaveId('confirmAlert')
    await expect(page.locator('#confirmAlert:modal')).toBeVisible()
    await expect(alert).toBeFocused()

    await page.keyboard.press('Escape')

    await refused(page, 'confirmAlert', 1)
    await expect(alert).toBeVisible()

    await clickAtTrigger(page, 'keyboardAlert')

    await refused(page, 'confirmAlert', 2)
    await expect(alert).toBeVisible()
    await expect(page.locator('dialog[open]')).toHaveCount(1)

    await alert.getByRole('button', { name: 'Cancel' }).click()

    await expect(alert).toBeHidden()
    await expect(trigger(page, 'confirmAlert')).toBeFocused()
  })

  // Expected: Escape never closes a dialog with `data-cx-keyboard="false"`, and the plugin
  // fires `hidePrevented` each time. Actual, in Chromium and WebKit: the third Escape in a row
  // closes it. The browser makes that `cancel` event not cancelable and closes the dialog by
  // itself, so the plugin fires no `hide` or `hidden`, and `body` keeps `dialog-open`, which
  // leaves the page unable to scroll.
  test.fixme('Escape, pressed repeatedly, does not close an alert that forbids it', async ({
    page
  }) => {
    await open(page, 'confirmAlert')

    const alert = page.getByRole('alertdialog', { name: 'Delete item' })

    for (let press = 1; press <= 4; press++) {
      await page.keyboard.press('Escape')
      await refused(page, 'confirmAlert', press)
      await expect(alert).toBeVisible()
    }

    await alert.getByRole('button', { name: 'Cancel' }).click()

    await expect(alert).toBeHidden()
    await expect(page.locator('body')).not.toHaveClass(/dialog-open/)
  })

  test('Escape closes an alert with the default options', async ({ page }) => {
    await open(page, 'keyboardAlert')

    const alert = page.getByRole('alertdialog', { name: 'Keyboard dismissible' })
    await expect(alert).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(alert).toBeHidden()
    await expect(trigger(page, 'keyboardAlert')).toBeFocused()
  })
})
