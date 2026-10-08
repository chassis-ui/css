import { expect, test, type Page } from '@playwright/test'
import { openPage } from './helpers/pages'

// The Drawer plugin in js/tests/visual/drawer.html, as the production bundle runs it: what a
// real keyboard and pointer do to a native <dialog> at an edge of the viewport, where the
// focus goes, what the page behind a drawer receives, and what a responsive drawer is on
// each side of its breakpoint. The unit specs cover the API.

type Recorded = { drawerEvents: string[] }

// The viewport of the tests, wider than `lg` (1024px): the responsive drawer of the page is
// content of the page at this width
const WIDE = { width: 1280, height: 720 }
const NARROW = { width: 800, height: 720 }

// Records the events of the plugin, which bubble, as `shown startDrawer`
const record = (page: Page) =>
  page.evaluate(() => {
    const log: string[] = []
    Object.assign(window, { drawerEvents: log })
    for (const name of ['show', 'shown', 'hide', 'hidden', 'hidePrevented']) {
      document.addEventListener(`${name}.cx.drawer`, (event) => {
        log.push(`${name} ${(event.target as Element).id}`)
      })
    }
  })

const events = (page: Page, id: string) =>
  page.evaluate(
    (suffix) =>
      (window as unknown as Recorded).drawerEvents
        .filter((entry) => entry.endsWith(suffix))
        .map((entry) => entry.split(' ')[0]),
    ` ${id}`
  )

// The plugin ignores hide() until the drawer has finished opening: every test waits for `shown`
// before it tries to close one
const shown = (page: Page, id: string) =>
  expect.poll(async () => (await events(page, id)).at(-1)).toBe('shown')

// The number of attempts to close the drawer that the plugin has refused
const refused = (page: Page, id: string, count: number) =>
  expect
    .poll(async () => (await events(page, id)).filter((name) => name === 'hidePrevented').length)
    .toBe(count)

// The trigger of a drawer in the page, not the one in another drawer
const trigger = (page: Page, id: string) =>
  page.locator(`[data-cx-target="#${id}"]:not(dialog *)`)

const open = async (page: Page, id: string) => {
  await trigger(page, id).click()
  await shown(page, id)
}

// The area an element with `position: fixed` is laid out in: the viewport without the gutter
// the page keeps for its scrollbar, which takes room in Chromium on Linux
const fixedArea = (page: Page) =>
  page.evaluate(() => {
    const probe = document.createElement('div')
    probe.style.cssText = 'position: fixed; inset: 0; visibility: hidden'
    document.body.append(probe)
    const { width, height } = probe.getBoundingClientRect()
    probe.remove()

    return { width, height }
  })

// Where the layout puts the drawer: the place it comes to rest in, without the transform of
// its entry. The entry is a transition, and a test that waited for it would wait for as long
// as a busy browser holds it.
const place = (page: Page, id: string) =>
  page.locator(`#${id}`).evaluate((drawer: HTMLElement) => ({
    x: drawer.offsetLeft,
    y: drawer.offsetTop,
    width: drawer.offsetWidth,
    height: drawer.offsetHeight
  }))

// A click of the pointer beside the drawer, in the middle of what it leaves free of the
// viewport. Behind a modal drawer, that is a click on the backdrop.
const clickBeside = async (page: Page, id: string) => {
  const [box, { width, height }] = await Promise.all([place(page, id), fixedArea(page)])
  const free = {
    left: box.x,
    right: width - box.x - box.width,
    top: box.y,
    bottom: height - box.y - box.height
  }
  const [side] = Object.entries(free).sort(([, a], [, b]) => b - a)[0]
  const point = {
    left: [box.x / 2, height / 2],
    right: [box.x + box.width + free.right / 2, height / 2],
    top: [width / 2, box.y / 2],
    bottom: [width / 2, box.y + box.height + free.bottom / 2]
  }[side]!
  await page.mouse.click(point[0], point[1])
}

// What the page counts of the clicks that reach it
const pageClicks = (page: Page) => page.locator('#pageClicks').textContent()

test.use({ viewport: WIDE })

test.beforeEach(async ({ page }) => {
  await openPage(page, 'drawer')
  await record(page)
})

test.describe('opening and closing', () => {
  test('a trigger opens the drawer as a modal and moves the focus to it', async ({ page }) => {
    await open(page, 'startDrawer')

    const drawer = page.getByRole('dialog', { name: 'Start drawer' })
    await expect(drawer).toBeVisible()
    await expect(drawer).toHaveId('startDrawer')
    await expect(page.locator('#startDrawer:modal')).toHaveCount(1)
    // The drawer itself, not its first control
    await expect(drawer).toBeFocused()
  })

  test('Escape closes the drawer and returns the focus to the trigger', async ({ page }) => {
    await trigger(page, 'startDrawer').focus()
    await page.keyboard.press('Enter')
    await shown(page, 'startDrawer')

    await page.keyboard.press('Escape')

    await expect(page.locator('#startDrawer')).toBeHidden()
    await expect(page.locator('dialog[open]')).toHaveCount(0)
    await expect(trigger(page, 'startDrawer')).toBeFocused()
  })

  test('the close button and the dismiss button of the footer close the drawer', async ({
    page
  }) => {
    const drawer = page.locator('#startDrawer')

    await open(page, 'startDrawer')
    await drawer.locator('.drawer-header').getByRole('button', { name: 'Close' }).click()

    await expect(drawer).toBeHidden()
    await expect(trigger(page, 'startDrawer')).toBeFocused()

    await open(page, 'startDrawer')
    await drawer.locator('.drawer-footer').getByRole('button', { name: 'Close' }).click()

    await expect(drawer).toBeHidden()
    await expect(trigger(page, 'startDrawer')).toBeFocused()
  })

  test('a click on the backdrop closes the drawer and does not reach the page', async ({
    page
  }) => {
    await open(page, 'startDrawer')
    const clicks = await pageClicks(page)

    await clickBeside(page, 'startDrawer')

    await expect(page.locator('#startDrawer')).toBeHidden()
    await expect(page.locator('dialog[open]')).toHaveCount(0)
    await expect(trigger(page, 'startDrawer')).toBeFocused()
    expect(await pageClicks(page)).toBe(clicks)
  })

  test('a click on a static backdrop leaves the drawer open, Escape closes it', async ({
    page
  }) => {
    await open(page, 'staticDrawer')

    await clickBeside(page, 'staticDrawer')

    await refused(page, 'staticDrawer', 1)
    await expect(page.locator('#staticDrawer')).toBeVisible()
    await expect(page.locator('dialog[open]')).toHaveCount(1)

    await page.keyboard.press('Escape')

    await expect(page.locator('#staticDrawer')).toBeHidden()
    await expect(trigger(page, 'staticDrawer')).toBeFocused()
  })

  test('without the keyboard option Escape is refused too, and a button closes the drawer', async ({
    page
  }) => {
    await open(page, 'lockedDrawer')

    const drawer = page.getByRole('dialog', { name: 'No Escape' })

    await clickBeside(page, 'lockedDrawer')
    await refused(page, 'lockedDrawer', 1)

    // Again and again: a second Escape in a row must not close the dialog either
    for (let press = 1; press <= 3; press++) {
      await page.keyboard.press('Escape')
      await refused(page, 'lockedDrawer', press + 1)
      await expect(drawer).toBeVisible()
    }

    await drawer.getByRole('button', { name: 'Close' }).click()

    await expect(drawer).toBeHidden()
    await expect(page.locator('body')).not.toHaveClass(/dialog-open/)
  })

  test('Tab and Shift+Tab do not leave the modal drawer', async ({ page }) => {
    await open(page, 'startDrawer')

    const drawer = page.locator('#startDrawer')
    const closeButton = drawer.locator('.drawer-header').getByRole('button', { name: 'Close' })
    const focusOutside = page.locator(':focus:not(#startDrawer, #startDrawer *)')

    await page.keyboard.press('Tab')
    await expect(closeButton).toBeFocused()

    // Over the five controls of the drawer and on: the focus goes to the browser or to the
    // first control, and never to the page behind the drawer
    for (let press = 0; press < 8; press++) {
      await page.keyboard.press('Tab')
      await expect(focusOutside).toHaveCount(0)
    }

    await closeButton.focus()

    for (let press = 0; press < 4; press++) {
      await page.keyboard.press('Shift+Tab')
      await expect(focusOutside).toHaveCount(0)
    }

    await expect(drawer).toBeVisible()
  })

  test('a trigger in an open drawer closes it and opens its target', async ({ page }) => {
    await open(page, 'startDrawer')

    await page
      .locator('#startDrawer')
      .getByRole('button', { name: 'Open the end drawer' })
      .click()
    await shown(page, 'endDrawer')

    await expect(page.locator('#startDrawer')).toBeHidden()
    await expect(page.getByRole('dialog', { name: 'End drawer' })).toBeVisible()
    await expect(page.locator('dialog[open]')).toHaveCount(1)

    await page.keyboard.press('Escape')

    await expect(page.locator('dialog[open]')).toHaveCount(0)
    await expect(page.locator('body')).not.toHaveClass(/dialog-open/)
  })

  test('an instant drawer opens and closes without a transition', async ({ page }) => {
    const drawer = page.locator('#instantDrawer')
    const transitions = () => drawer.evaluate((element) => element.getAnimations().length)

    await trigger(page, 'instantDrawer').click()

    // In its place in the frame of the click, not on its way to it
    expect(await transitions()).toBe(0)
    await expect(drawer).toBeVisible()
    await shown(page, 'instantDrawer')

    await page.keyboard.press('Escape')

    expect(await transitions()).toBe(0)
    await expect(drawer).toBeHidden()
  })

  // A closed drawer has no transition (`.drawer:not([open])`), as a closed dialog: the plugin
  // closes the drawer when its exit is over, and a transition that has not run by then would
  // keep the closed drawer in view. WebKit under load left one in its open place for seconds.
  // A drawer closed with its own close() goes from open to closed in one step, and shows the
  // same without the load.
  test('a closed drawer is hidden at once, with no transition left to run', async ({ page }) => {
    await open(page, 'startDrawer')

    const closed = await page.locator('#startDrawer').evaluate((drawer: HTMLDialogElement) => {
      drawer.close()

      return {
        visibility: getComputedStyle(drawer).visibility,
        transitions: drawer.getAnimations().length
      }
    })

    expect(closed).toEqual({ visibility: 'hidden', transitions: 0 })
  })
})

test.describe('placement', () => {
  // The inset of a drawer is the same on every side that touches the viewport
  test('each drawer lies along its edge of the viewport', async ({ page }) => {
    const { width, height } = await fixedArea(page)
    const openAt = async (id: string) => {
      await open(page, id)
      return place(page, id)
    }
    const close = async (id: string) => {
      await page.keyboard.press('Escape')
      await expect(page.locator(`#${id}`)).toBeHidden()
    }

    const start = await openAt('startDrawer')
    expect(start.x).toBeGreaterThan(0)
    expect(start.x).toBeCloseTo(start.y, 0)
    expect(start.y + start.height).toBeCloseTo(height - start.y, 0)
    expect(start.x + start.width).toBeLessThan(width / 2)
    await close('startDrawer')

    const end = await openAt('endDrawer')
    expect(width - end.x - end.width).toBeCloseTo(start.x, 0)
    expect(end.y).toBeCloseTo(start.y, 0)
    expect(end.y + end.height).toBeCloseTo(height - end.y, 0)
    expect(end.x).toBeGreaterThan(width / 2)
    await close('endDrawer')

    const top = await openAt('topDrawer')
    expect(top.y).toBeCloseTo(start.y, 0)
    expect(top.x).toBeCloseTo(start.x, 0)
    expect(top.x + top.width).toBeCloseTo(width - top.x, 0)
    expect(top.y + top.height).toBeLessThan(height / 2)
    await close('topDrawer')

    const bottom = await openAt('bottomDrawer')
    expect(height - bottom.y - bottom.height).toBeCloseTo(start.y, 0)
    expect(bottom.x).toBeCloseTo(start.x, 0)
    expect(bottom.x + bottom.width).toBeCloseTo(width - bottom.x, 0)
    expect(bottom.y).toBeGreaterThan(height / 2)
  })

  test('a closed drawer is outside of the viewport, and adds nothing to what the page scrolls', async ({
    page
  }) => {
    for (const id of ['startDrawer', 'endDrawer', 'topDrawer', 'bottomDrawer']) {
      await expect(page.locator(`#${id}`)).not.toBeInViewport()
    }

    const scrolls = await page.evaluate(() => {
      window.scrollTo({ left: 1000, top: 1000, behavior: 'instant' })
      return [window.scrollX, window.scrollY]
    })
    expect(scrolls).toEqual([0, 0])
  })
})

test.describe('the page behind the drawer', () => {
  test('the page does not scroll while a drawer is open, and scrolls again when it has closed', async ({
    page
  }) => {
    await page.locator('#tall-toggle').click()
    await expect(page.locator('#tall')).toBeVisible()

    await open(page, 'startDrawer')

    await expect(page.locator('body')).toHaveClass(/dialog-open/)
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')

    await page.keyboard.press('Escape')

    await expect(page.locator('#startDrawer')).toBeHidden()
    await expect(page.locator('body')).not.toHaveClass(/dialog-open/)
    await expect(page.locator('body')).toHaveCSS('overflow', 'visible')
  })

  test('a drawer with `scroll` and no backdrop is not modal: the page scrolls and can be used', async ({
    page
  }) => {
    await open(page, 'scrollDrawer')

    const drawer = page.locator('#scrollDrawer')
    await expect(drawer).toBeVisible()
    await expect(page.locator('dialog:modal')).toHaveCount(0)
    await expect(page.locator('body')).not.toHaveClass(/dialog-open/)
    await expect(drawer).toBeFocused()

    await page.locator('#tall-toggle').click()

    await expect(page.locator('#tall')).toBeVisible()
    await expect(drawer).toBeVisible()

    // A click beside it reaches the page, and is no click on a backdrop
    const clicks = await pageClicks(page)
    await clickBeside(page, 'scrollDrawer')

    await expect(page.locator('#pageClicks')).not.toHaveText(clicks!)
    await expect(drawer).toBeVisible()

    // Escape reaches a drawer that is not modal when the focus is in it
    await drawer.getByRole('heading', { name: 'Scrolling, no backdrop' }).click()
    await expect(drawer).toBeFocused()
    await page.keyboard.press('Escape')

    await expect(drawer).toBeHidden()
    await expect(trigger(page, 'scrollDrawer')).toBeFocused()
  })
})

test.describe('a responsive drawer', () => {
  test('is content of the page from its breakpoint on, without its header', async ({ page }) => {
    const drawer = page.locator('#responsiveDrawer')

    await expect(drawer).toBeVisible()
    await expect(drawer).toBeInViewport()
    await expect(drawer.getByText('A drawer below')).toBeVisible()
    await expect(drawer.locator('.drawer-header')).toBeHidden()
    await expect(trigger(page, 'responsiveDrawer')).toBeHidden()
    await expect(page.locator('dialog[open]')).toHaveCount(0)
  })

  test('is a drawer below its breakpoint', async ({ page }) => {
    await page.setViewportSize(NARROW)

    const drawer = page.locator('#responsiveDrawer')
    await expect(drawer).toBeHidden()

    await open(page, 'responsiveDrawer')

    await expect(page.getByRole('dialog', { name: 'Responsive drawer' })).toBeVisible()
    await expect(page.locator('#responsiveDrawer:modal')).toHaveCount(1)
    // At the end edge, as `.drawer-end` says
    const [box, area] = await Promise.all([place(page, 'responsiveDrawer'), fixedArea(page)])
    expect(box.y).toBeGreaterThan(0)
    expect(area.width - box.x - box.width).toBeCloseTo(box.y, 0)
    expect(box.x).toBeGreaterThan(area.width / 2 - box.width)

    await drawer.getByRole('button', { name: 'Close' }).click()

    await expect(drawer).toBeHidden()
    await expect(trigger(page, 'responsiveDrawer')).toBeFocused()
  })

  test('closes when the viewport grows over its breakpoint, and the page scrolls again', async ({
    page
  }) => {
    await page.setViewportSize(NARROW)
    await open(page, 'responsiveDrawer')
    await expect(page.locator('body')).toHaveClass(/dialog-open/)

    await page.setViewportSize(WIDE)

    // The plugin closes the drawer at the `resize` event, which a busy browser sends seconds
    // after the viewport has changed: the time is for the event, the plugin needs none
    await expect(page.locator('dialog[open]')).toHaveCount(0, { timeout: 15_000 })
    await expect(page.locator('body')).not.toHaveClass(/dialog-open/)
    // Content of the page again
    await expect(page.locator('#responsiveDrawer')).toBeVisible()
    await expect(page.locator('#responsiveDrawer .drawer-header')).toBeHidden()
  })
})
