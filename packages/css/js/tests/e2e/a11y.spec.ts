import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { DISABLED_RULES, KNOWN_VIOLATIONS } from './helpers/a11y-known'
import { clickSlowly, openPage, pages, THEMES } from './helpers/pages'

// axe on every page of js/tests/visual/, as it loads and with its component open, light and
// dark. The markup of a closed dialog or menu is not rendered, so most of what a plugin does
// for assistive technology only shows in the open state.
//
// A page fails when it breaks a rule more often than helpers/a11y-known.ts records, and when
// it breaks one less often, so that the record of a fixed defect is removed with the fix.
//
// Run with `pnpm js:test:a11y`.

type State = (page: Page) => Promise<void>

// The states of a page beside the one it loads in, and how to get there
const STATES: Record<string, Record<string, State>> = {
  accordion: {
    'second item open': async (page) => {
      await page.locator('#groupTwo > summary').click()
      await page.locator('#groupTwo > .accordion-body').waitFor()
    }
  },
  alert: {
    'confirm open': async (page) => {
      await page.locator('[data-cx-target="#confirmAlert"]').click()
      await page.locator('#confirmAlert[open]').waitFor()
    }
  },
  combobox: {
    'menu open': async (page) => {
      await clickSlowly(page, page.locator('#country'))
      await page.locator('#countryMenu.show').waitFor()
    },
    'search open': async (page) => {
      await clickSlowly(page, page.locator('#cityToggle'))
      await page.locator('#cityMenu.show').waitFor()
    }
  },
  datepicker: {
    'calendar open': async (page) => {
      await page.locator('#basicDatepicker').click()
      await page.locator('[data-vc="calendar"]:visible').first().waitFor()
    }
  },
  menu: {
    'menu open': async (page) => {
      await page.locator('button[data-cx-toggle="menu"]').first().click()
      await page.locator('.menu.show').first().waitFor()
    }
  },
  modal: {
    'basic open': async (page) => {
      await page.locator('[data-cx-target="#basicModal"]').click()
      await page.locator('#basicModal[open]').waitFor()
    }
  },
  popover: {
    'popover open': async (page) => {
      await page.locator('[data-cx-toggle="popover"]').first().click()
      await page.locator('.popover.show').waitFor()
    }
  },
  toast: {
    'toasts shown': async (page) => {
      await page.locator('#btnShowToast').click()
      await page.locator('.toast.show').first().waitFor()
    }
  },
  tooltip: {
    'tooltip shown': async (page) => {
      await page.locator('button[data-cx-toggle="tooltip"]').first().focus()
      await page.getByRole('tooltip', { name: 'Tooltip on auto' }).waitFor()
    }
  }
}

// The animations of the page have ended: axe reads the colors and the sizes of what it sees
const settled = (page: Page) =>
  page.evaluate(() =>
    Promise.all(
      document.getAnimations().map((animation) => animation.finished.catch(() => undefined))
    )
  )

for (const name of pages) {
  for (const [state, open] of Object.entries({ '': undefined, ...STATES[name] })) {
    const where = state ? `${name}, ${state}` : name

    for (const theme of THEMES) {
      test(`${where} (${theme})`, async ({ page }) => {
        await openPage(page, name, theme)
        await open?.(page)
        await settled(page)

        const { violations } = await new AxeBuilder({ page })
          .disableRules(Object.keys(DISABLED_RULES))
          .analyze()
        const known = KNOWN_VIOLATIONS.filter((violation) => violation.where === where)
        const rules = new Set([...violations.map(({ id }) => id), ...known.map(({ rule }) => rule)])
        const problems: string[] = []

        for (const rule of rules) {
          const violation = violations.find(({ id }) => id === rule)
          const nodes = violation?.nodes ?? []
          const recorded = known.find((entry) => entry.rule === rule)?.elements ?? 0

          if (nodes.length > recorded) {
            problems.push(
              `${rule}: ${nodes.length} elements, ${recorded} recorded (${violation?.helpUrl})\n` +
                nodes.map((node) => `    ${node.target.join(' ')}\n      ${node.html}`).join('\n')
            )
          } else if (nodes.length < recorded) {
            problems.push(
              `${rule}: ${nodes.length} elements, ${recorded} recorded. ` +
                'Correct the entry in js/tests/e2e/helpers/a11y-known.ts, or remove it'
            )
          }
        }

        expect(problems, problems.join('\n\n')).toEqual([])
      })
    }
  }
}

test('every recorded violation is of a page and a state that are tested', () => {
  const tested = pages.flatMap((name) => [
    name,
    ...Object.keys(STATES[name] ?? {}).map((state) => `${name}, ${state}`)
  ])

  expect(KNOWN_VIOLATIONS.filter(({ where }) => !tested.includes(where))).toEqual([])
  expect(Object.keys(STATES).filter((name) => !pages.includes(name))).toEqual([])
})
