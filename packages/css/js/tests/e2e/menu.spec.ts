import { expect, test, type Locator, type Page } from '@playwright/test'
import { openPage } from './helpers/pages'

// Drives js/tests/visual/menu.html and menu-submenu.html with a real keyboard and a real
// pointer, on the production bundle the pages load. It covers what the unit spec cannot: the
// order of focus and its return, the place Floating UI gives a menu in a real layout, and the
// submenus opened by the pointer and by the keyboard.

// The distance the plugin keeps between a toggle and its menu (`offset: [0, 2]`), and the one
// it moves a submenu by along its item (`crossAxis: -4`)
const MENU_GAP = 2
const SUBMENU_SHIFT = -4

type Placement = `${'top' | 'bottom' | 'left' | 'right'}-${'start' | 'end'}`

const toggleOf = (page: Page, name: string) => page.getByRole('button', { name, exact: true })

// The menu of a toggle, or the submenu of an item, is the `.menu` that follows it
const menuOf = (toggle: Locator) => toggle.locator(':scope + .menu')

const item = (menu: Locator, name: string) =>
  menu.getByRole('button', { name, exact: true }).or(menu.getByRole('link', { name, exact: true }))

const edges = async (locator: Locator) => {
  const box = await locator.boundingBox()
  if (!box) {
    throw new Error('The element has no box')
  }

  return { left: box.x, top: box.y, right: box.x + box.width, bottom: box.y + box.height }
}

// Where a menu is, seen from its reference: `gap` is the distance between the two on the side of
// the placement, `shift` the distance between the edges the placement aligns, and `inViewport`
// tells that no part of the menu is cut by the viewport
const position = async (page: Page, reference: Locator, menu: Locator, placement: Placement) => {
  const [from, to] = await Promise.all([edges(reference), edges(menu)])
  const viewport = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight
  }))
  const [side, alignment] = placement.split('-')
  const gaps = {
    top: from.top - to.bottom,
    bottom: to.top - from.bottom,
    left: from.left - to.right,
    right: to.left - from.right
  }
  const aligned = side === 'top' || side === 'bottom' ?
    (alignment === 'start' ? 'left' : 'right') :
    (alignment === 'start' ? 'top' : 'bottom')

  return {
    // `+ 0` turns -0 into 0
    gap: Math.round(gaps[side]) + 0,
    shift: Math.round(to[aligned] - from[aligned]) + 0,
    inViewport: to.left >= 0 && to.top >= 0 &&
      to.right <= viewport.width && to.bottom <= viewport.height
  }
}

const expectOpen = async (toggle: Locator, menu: Locator) => {
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(menu).toBeVisible()
  // The menu fades and scales in: its box is the final one when the transition has ended
  await expect(menu).toHaveCSS('opacity', '1')
}

const expectClosed = async (toggle: Locator, menu: Locator) => {
  await expect(menu).toBeHidden()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
}

// Moves the pointer to the middle of an element. Unlike `locator.hover()` it never scrolls the
// page: a page that scrolls under a resting pointer hovers whatever arrives below it
const pointTo = async (page: Page, target: Locator) => {
  const { left, top, right, bottom } = await edges(target)
  await page.mouse.move((left + right) / 2, (top + bottom) / 2, { steps: 4 })
}

test.describe('menu', () => {
  test.beforeEach(async ({ page }) => {
    await openPage(page, 'menu')
  })

  test('a click on the toggle opens the menu, a second click closes it', async ({ page }) => {
    const toggle = toggleOf(page, 'This menu is end-aligned')
    const menu = menuOf(toggle)

    await expect(menu).toBeHidden()
    await toggle.click()

    await expectOpen(toggle, menu)
    await expect(toggle).toBeFocused()

    await toggle.click()

    await expectClosed(toggle, menu)
  })

  test('the menu opens on the side of the toggle its placement names', async ({ page }) => {
    const placements: Array<[string, Placement]> = [
      ['Menu', 'bottom-start'],
      ['This menu is end-aligned', 'bottom-end'],
      ['Menu (top)', 'top-start'],
      ['Menu (top) align end', 'top-end'],
      ['Menu (end)', 'right-start'],
      ['Menu (start)', 'left-start']
    ]

    for (const [name, placement] of placements) {
      await test.step(`${name}: ${placement}`, async () => {
        const toggle = toggleOf(page, name)
        const menu = menuOf(toggle)

        await toggle.click()

        await expectOpen(toggle, menu)
        await expect(menu).toHaveAttribute('data-cx-placement', placement)
        await expect
          .poll(() => position(page, toggle, menu, placement))
          .toEqual({ gap: MENU_GAP, shift: 0, inViewport: true })

        await toggle.click()
        await expectClosed(toggle, menu)
      })
    }
  })

  test('the arrow keys open the menu from the toggle and move through its items', async ({
    page
  }) => {
    const toggle = toggleOf(page, 'This menu is end-aligned')
    const menu = menuOf(toggle)

    await toggle.focus()
    await page.keyboard.press('ArrowDown')

    await expectOpen(toggle, menu)
    await expect(item(menu, 'Action')).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(item(menu, 'Another action')).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(item(menu, 'Something else here')).toBeFocused()

    await page.keyboard.press('ArrowUp')
    await expect(item(menu, 'Another action')).toBeFocused()

    await page.keyboard.press('End')
    await expect(item(menu, 'Something else here')).toBeFocused()

    await page.keyboard.press('Home')
    await expect(item(menu, 'Action')).toBeFocused()
  })

  test('Escape closes the menu and returns focus to the toggle', async ({ page }) => {
    const toggle = toggleOf(page, 'Menu (end)')
    const menu = menuOf(toggle)

    await toggle.click()
    await expectOpen(toggle, menu)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await expect(item(menu, 'Another action')).toBeFocused()

    await page.keyboard.press('Escape')

    await expectClosed(toggle, menu)
    await expect(toggle).toBeFocused()
  })

  test('Enter and Space on the toggle open the menu', async ({ page }) => {
    const toggle = toggleOf(page, 'Menu (end)')
    const menu = menuOf(toggle)

    await toggle.focus()
    await page.keyboard.press('Enter')

    await expectOpen(toggle, menu)
    await expect(toggle).toBeFocused()

    await page.keyboard.press('Escape')
    await expectClosed(toggle, menu)

    await page.keyboard.press('Space')

    await expectOpen(toggle, menu)
    await expect(toggle).toBeFocused()
  })

  test('Tab goes through the menu and closes it when focus leaves it', async ({ page }) => {
    const toggle = toggleOf(page, 'Menu')
    const menu = menuOf(toggle)
    const field = menu.getByRole('textbox')

    await toggle.click()
    await expectOpen(toggle, menu)

    await page.keyboard.press('Tab')

    await expect(field).toBeFocused()
    await expect(menu).toBeVisible()

    await page.keyboard.press('Tab')

    await expectClosed(toggle, menu)
    await expect(toggle).not.toBeFocused()
  })

  test('a click outside the menu, or on another toggle, closes it', async ({ page }) => {
    const first = toggleOf(page, 'Menu (top)')
    const second = toggleOf(page, 'This menu is end-aligned')

    await first.click()
    await expectOpen(first, menuOf(first))

    await page.getByRole('heading', { level: 1 }).click()

    await expectClosed(first, menuOf(first))

    await first.click()
    await expectOpen(first, menuOf(first))

    await second.click()

    await expectOpen(second, menuOf(second))
    await expectClosed(first, menuOf(first))
  })
})

test.describe('submenus', () => {
  test.beforeEach(async ({ page }) => {
    await openPage(page, 'menu-submenu')
  })

  test('the arrow keys skip the disabled items', async ({ page }) => {
    const toggle = toggleOf(page, 'Menu with Disabled')
    const menu = menuOf(toggle)

    await toggle.focus()
    await page.keyboard.press('ArrowDown')
    await expect(item(menu, 'Enabled action')).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(item(menu, 'Submenu')).toBeFocused()

    await page.keyboard.press('ArrowUp')
    await expect(item(menu, 'Enabled action')).toBeFocused()
  })

  test('the arrow keys wrap from the last item to the first and back', async ({ page }) => {
    const toggle = toggleOf(page, 'Menu with Submenu')
    const menu = menuOf(toggle)

    await toggle.focus()
    await page.keyboard.press('ArrowDown')
    await expect(item(menu, 'Action')).toBeFocused()

    await page.keyboard.press('ArrowUp')
    await expect(item(menu, 'Something else')).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(item(menu, 'Action')).toBeFocused()
  })

  test('the pointer opens the submenu of an item, one at a time', async ({ page }) => {
    const toggle = toggleOf(page, 'Multiple Submenus')
    const menu = menuOf(toggle)
    const file = item(menu, 'File operations')
    const edit = item(menu, 'Edit operations')

    await toggle.click()
    await expectOpen(toggle, menu)
    await expect
      .poll(() => position(page, toggle, menu, 'bottom-start'))
      .toEqual({ gap: MENU_GAP, shift: 0, inViewport: true })

    await pointTo(page, file)

    await expectOpen(file, menuOf(file))
    await expect(file).toHaveAttribute('aria-haspopup', 'true')
    await expect
      .poll(() => position(page, file, menuOf(file), 'right-start'))
      .toEqual({ gap: 0, shift: SUBMENU_SHIFT, inViewport: true })

    await pointTo(page, edit)

    await expectOpen(edit, menuOf(edit))
    await expectClosed(file, menuOf(file))

    await pointTo(page, item(menuOf(edit), 'Cut'))
    await expect(menuOf(edit)).toBeVisible()

    // Out of the menu: the submenu closes, the menu stays
    await pointTo(page, page.getByRole('heading', { name: 'Multiple Submenus at Same Level' }))

    await expectClosed(edit, menuOf(edit))
    await expectOpen(toggle, menu)
  })

  test('ArrowRight opens the submenu on its first item, ArrowLeft closes it', async ({ page }) => {
    const toggle = toggleOf(page, 'Menu with Submenu')
    const menu = menuOf(toggle)
    const trigger = item(menu, 'More options')
    const submenu = menuOf(trigger)

    await toggle.focus()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await expect(trigger).toBeFocused()
    await expect(submenu).toBeHidden()

    await page.keyboard.press('ArrowRight')

    await expectOpen(trigger, submenu)
    await expect(trigger).toHaveAttribute('aria-haspopup', 'true')
    await expect(item(submenu, 'Sub-action 1')).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(item(submenu, 'Sub-action 2')).toBeFocused()

    await page.keyboard.press('ArrowLeft')

    await expectClosed(trigger, submenu)
    await expect(trigger).toBeFocused()
    await expectOpen(toggle, menu)
  })

  test('Escape closes one level at a time and returns focus to the item above', async ({
    page
  }) => {
    const toggle = toggleOf(page, 'Multi-level Menu')
    const menu = menuOf(toggle)
    const first = item(menu, 'Level 1 - Submenu')
    const second = item(menuOf(first), 'Level 2 - Submenu')

    await toggle.focus()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await expect(first).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(item(menuOf(first), 'Level 2 - Action')).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(second).toBeFocused()

    await page.keyboard.press('Space')
    await expect(item(menuOf(second), 'Level 3 - Action A')).toBeFocused()
    await expectOpen(second, menuOf(second))

    await page.keyboard.press('Escape')

    await expectClosed(second, menuOf(second))
    await expect(second).toBeFocused()
    await expectOpen(first, menuOf(first))

    await page.keyboard.press('Escape')

    await expectClosed(first, menuOf(first))
    await expect(first).toBeFocused()
    await expectOpen(toggle, menu)

    await page.keyboard.press('Escape')

    await expectClosed(toggle, menu)
    await expect(toggle).toBeFocused()
  })

  test('a submenu with no room at the end of its item opens at the start', async ({ page }) => {
    const sides: Array<[string, string, Placement]> = [
      ['Left Side (opens right)', 'Submenu', 'right-start'],
      ['Right Side (flips left)', 'Submenu (should flip)', 'left-start']
    ]

    for (const [name, triggerName, placement] of sides) {
      await test.step(`${name}: ${placement}`, async () => {
        const toggle = toggleOf(page, name)
        const menu = menuOf(toggle)
        const trigger = item(menu, triggerName)
        const submenu = menuOf(trigger)

        await toggle.focus()
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('ArrowDown')
        await expect(trigger).toBeFocused()
        await page.keyboard.press('ArrowRight')

        await expectOpen(trigger, submenu)
        await expect(submenu).toHaveAttribute('data-cx-placement', placement)
        await expect
          .poll(() => position(page, trigger, submenu, placement))
          .toEqual({ gap: 0, shift: SUBMENU_SHIFT, inViewport: true })

        await page.keyboard.press('Escape')
        await page.keyboard.press('Escape')
        await expectClosed(toggle, menu)
      })
    }
  })

  // In WebKit a click does not focus a button, it takes focus from the toggle to the body:
  // the plugin hears Escape there too
  test('Escape closes the menu after a click on the item of a submenu', async ({ page }) => {
    const toggle = toggleOf(page, 'Menu with Submenu')
    const menu = menuOf(toggle)

    await toggle.click()
    await expectOpen(toggle, menu)

    await item(menu, 'More options').click()
    await page.keyboard.press('Escape')

    await expectClosed(toggle, menu)
    await expect(toggle).toBeFocused()
  })
})
