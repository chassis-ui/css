import { compile } from '@tailwindcss/node'
import { expect, test } from '@playwright/test'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Renders js/tests/e2e/fixtures/tailwind-parity.html twice per scenario --
// once against dist/css/chassis.css, once against a Tailwind build compiled
// fresh from the same fixture's classes -- and asserts getComputedStyle
// agrees for a curated element list. The fixture's own inline script picks
// the stylesheet from `?mode=`, so both runs load the exact same DOM; any
// computed-style difference can only come from the CSS.

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../..')
const fixturePath = path.join(here, 'fixtures/tailwind-parity.html')
const generatedDir = path.join(here, 'generated')
const generatedCssPath = path.join(generatedDir, 'tailwind-parity.css')

function extractClasses(html: string): string[] {
  const found = new Set<string>()
  const re = /class="([^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    for (const cls of m[1].split(/\s+/)) if (cls) found.add(cls)
  }
  return [...found].sort()
}

test.beforeAll(async () => {
  const html = readFileSync(fixturePath, 'utf8')
  const candidates = extractClasses(html)
  const compiler = await compile('@import "@chassis-ui/css/tailwind";', {
    base: root,
    onDependency: () => {}
  })
  const built = compiler.build(candidates)
  mkdirSync(generatedDir, { recursive: true })
  writeFileSync(generatedCssPath, built)
})

type Curated = { testid: string; properties: string[] }

// Buttons in all styles, card, navbar at lg (the toggler's visibility flips
// at the lg breakpoint), table, grid row/col (flex-based) and CSS grid-cols-2
// (the Phase 5 !important remedy -- the highest-value regression check
// here), a container-query stack, and typical utilities spanning a
// responsive variant and two more Phase 5 remedies. The grid cases check the
// Tailwind entry's on-demand grid utilities (scss/tailwind/_grid.scss)
// against dist/css's per-breakpoint classes: responsive columns, the
// same-breakpoint precedence among grid classes, utilities overriding grid
// classes at their own and at other breakpoints, and core col-<n>'s
// grid-column leak into a .grid parent. The .grid cases check Tailwind
// core's placement utilities (col-span-*, col-start-*, row-span-*,
// grid-cols-*) against dist/css's per-breakpoint classes, the deprecated
// g-col-* alias mixed with the class it aliases, a start line reset with
// col-start-auto and row-start-auto, the responsive gutter of
// .grid at each viewport, a gap utility over it, the fraction widths, and
// a fraction reset with md:w-100 and lg:w-auto.
//
// dark:fg-primary is deliberately NOT here: Chassis's own utility generator
// only flags a handful of utilities (display) with `dark: true`, so
// `dark:fg-primary` has no native Chassis-side rule at all to compare
// against -- Tailwind's variant engine providing `dark:` (and every other
// variant) for EVERY utility regardless of that flag is the whole point of
// the integration (fact 2), not a bug to chase parity on. See the dedicated
// dark:d-none test below for the one dark: mechanism both builds share.
const CURATED: Curated[] = [
  { testid: 'btn-primary', properties: ['backgroundColor', 'color', 'borderRadius', 'paddingTop', 'paddingLeft'] },
  { testid: 'btn-primary-outline', properties: ['backgroundColor', 'color', 'borderTopColor'] },
  { testid: 'btn-secondary', properties: ['backgroundColor', 'color'] },
  { testid: 'btn-danger', properties: ['backgroundColor', 'color'] },
  { testid: 'card', properties: ['backgroundColor', 'borderRadius', 'boxShadow'] },
  { testid: 'navbar-toggler', properties: ['display'] },
  { testid: 'table', properties: ['borderCollapse'] },
  { testid: 'col-6', properties: ['width'] },
  { testid: 'col-responsive', properties: ['width', 'flexGrow', 'flexBasis'] },
  { testid: 'col-then-fluid', properties: ['width', 'flexGrow', 'flexBasis'] },
  { testid: 'col-auto', properties: ['flexGrow', 'flexBasis'] },
  { testid: 'row-cols-col', properties: ['width', 'flexGrow'] },
  { testid: 'row-cols-col-6', properties: ['width', 'flexGrow'] },
  { testid: 'row-cols-col-wrapped', properties: ['width', 'flexGrow'] },
  { testid: 'row-cols-responsive', properties: ['width'] },
  { testid: 'offset-responsive', properties: ['width', 'marginLeft'] },
  { testid: 'offset-vs-margin-utility', properties: ['marginLeft'] },
  { testid: 'col-vs-width-utility', properties: ['width'] },
  { testid: 'col-vs-flex-utility', properties: ['flexGrow'] },
  { testid: 'width-utility-vs-responsive-col', properties: ['width', 'flexGrow'] },
  { testid: 'margin-utility-vs-responsive-offset', properties: ['marginLeft'] },
  { testid: 'flex-utility-vs-responsive-col', properties: ['flexGrow'] },
  { testid: 'auto-margin-utility-vs-responsive-offset', properties: ['marginLeft', 'marginRight'] },
  { testid: 'gutter-0', properties: ['paddingLeft', 'marginTop'] },
  { testid: 'gutter-responsive', properties: ['paddingLeft', 'marginTop'] },
  { testid: 'g-col-responsive', properties: ['gridColumnStart', 'gridColumnEnd'] },
  { testid: 'g-col-start', properties: ['gridColumnStart', 'gridColumnEnd'] },
  { testid: 'col-in-grid', properties: ['gridColumnStart', 'gridColumnEnd', 'width'] },
  { testid: 'grid-cols-2', properties: ['gridTemplateColumns'] },
  { testid: 'grid-cols-12', properties: ['gridTemplateColumns'] },
  { testid: 'col-span-4', properties: ['gridColumnStart', 'gridColumnEnd'] },
  { testid: 'col-span-responsive', properties: ['gridColumnStart', 'gridColumnEnd'] },
  { testid: 'col-start-3', properties: ['gridColumnStart', 'gridColumnEnd'] },
  { testid: 'row-span-2', properties: ['gridRowStart', 'gridRowEnd'] },
  { testid: 'col-span-then-alias', properties: ['gridColumnStart', 'gridColumnEnd'] },
  { testid: 'start-reset', properties: ['gridColumnStart', 'gridColumnEnd', 'gridRowStart'] },
  { testid: 'grid-gutter', properties: ['columnGap', 'rowGap'] },
  { testid: 'grid-gap-md', properties: ['columnGap', 'rowGap'] },
  { testid: 'skeleton-fraction', properties: ['width'] },
  { testid: 'width-reset', properties: ['width'] },
  { testid: 'stack', properties: ['flexDirection'] },
  { testid: 'fg-primary', properties: ['color'] },
  { testid: 'lg-font-xl', properties: ['fontSize'] },
  { testid: 'opacity-10', properties: ['opacity'] },
  { testid: 'border', properties: ['borderTopWidth', 'borderTopStyle', 'borderTopColor'] },
  { testid: 'rounded-full', properties: ['borderRadius'] }
]

// Parses a CSS color function's numeric arguments (rgb/rgba/oklab/oklch/...).
// Returns null for anything else (font-size, display, gridTemplateColumns,
// etc.), which callers then compare with plain string equality.
function parseColor(value: string): { fn: string; nums: number[] } | null {
  const m = value.match(/^([\w-]+)\(([^)]*)\)$/)
  if (!m) return null
  const nums = m[2]
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map((token) => Number.parseFloat(token))
  if (nums.length === 0 || nums.some((n) => Number.isNaN(n))) return null
  return { fn: m[1], nums }
}

// The two builds resolve relative-color expressions (`oklch(from ...)`)
// through slightly different custom-property indirection chains (the
// --cx- prefixer rewrites variable names), which can leave a same-color
// result differing in the 4th-5th decimal place -- confirmed harmless by
// comparing dist/css/chassis.css against its own Lightning-CSS-minified
// build, which shows the same-magnitude drift from minification alone, not
// from anything Tailwind-specific. A tight numeric tolerance absorbs that
// without masking a real color difference (which would show up as a
// completely different value, not a rounding-sized one).
function valuesMatch(a: string, b: string): boolean {
  if (a === b) return true
  const colorA = parseColor(a)
  const colorB = parseColor(b)
  if (!colorA || !colorB) return false
  if (colorA.fn !== colorB.fn || colorA.nums.length !== colorB.nums.length) return false
  return colorA.nums.every((n, i) => Math.abs(n - colorB.nums[i]) < 0.01)
}

async function captureComputedStyles(
  page: import('@playwright/test').Page,
  mode: 'chassis' | 'tailwind',
  curated: Curated[] = CURATED
) {
  await page.goto(`/js/tests/e2e/fixtures/tailwind-parity.html?mode=${mode}`)
  await page.waitForSelector('html[data-css-loaded]')
  return page.evaluate((curatedArg: Curated[]) => {
    const result: Record<string, Record<string, string>> = {}
    for (const { testid, properties } of curatedArg) {
      const el = document.querySelector(`[data-testid="${testid}"]`)
      if (!el) {
        result[testid] = { __missing__: 'true' }
        continue
      }
      const computed = getComputedStyle(el)
      const values: Record<string, string> = {}
      for (const property of properties) values[property] = computed[property as never]
      result[testid] = values
    }
    return result
  }, curated)
}

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  // Between md and lg, where the grid cases' md: classes are the ones in effect.
  { name: 'tablet', width: 900, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 }
]

const COLOR_SCHEMES: { name: string; setup: (page: import('@playwright/test').Page) => Promise<void> }[] = [
  { name: 'light', setup: async () => {} },
  { name: 'dark via prefers-color-scheme', setup: async (page) => { await page.emulateMedia({ colorScheme: 'dark' }) } },
  {
    name: 'dark via data-cx-theme attribute',
    setup: async (page) => {
      await page.addInitScript(() => document.documentElement.setAttribute('data-cx-theme', 'dark'))
    }
  }
]

for (const viewport of VIEWPORTS) {
  for (const scheme of COLOR_SCHEMES) {
    test(`computed styles match between chassis.css and the Tailwind build (${viewport.name}, ${scheme.name})`, async ({
      page
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await scheme.setup(page)

      const chassis = await captureComputedStyles(page, 'chassis')
      const tailwind = await captureComputedStyles(page, 'tailwind')

      const mismatches: string[] = []
      for (const { testid, properties } of CURATED) {
        for (const property of properties) {
          const chassisValue = chassis[testid]?.[property]
          const tailwindValue = tailwind[testid]?.[property]
          if (!valuesMatch(chassisValue, tailwindValue)) {
            mismatches.push(`${testid}.${property}: chassis="${chassisValue}" tailwind="${tailwindValue}"`)
          }
        }
      }
      expect(mismatches, mismatches.join('\n')).toEqual([])
    })
  }
}

test('dark:d-none matches via prefers-color-scheme, the one dark: mechanism both builds share', async ({ page }) => {
  // Chassis's own dark:d-none (like every dark-flagged display utility) is
  // media-only -- confirmed by reading dist/css/chassis-utilities.css
  // directly, it has no [data-cx-theme] attribute branch at all, unlike the
  // fuller self/descendant/media custom variant built for Tailwind in Phase
  // 3. So this checks only the media-query path; a data-cx-theme override
  // is a Tailwind-only capability here; see the CURATED comment above.
  await page.emulateMedia({ colorScheme: 'dark' })

  const darkDNone: Curated[] = [{ testid: 'dark-d-none', properties: ['display'] }]
  const chassis = await captureComputedStyles(page, 'chassis', darkDNone)
  const tailwind = await captureComputedStyles(page, 'tailwind', darkDNone)

  expect(tailwind['dark-d-none']).toEqual(chassis['dark-d-none'])
  expect(chassis['dark-d-none'].display).toEqual('none')
})

// The one known grid difference, documented in the Tailwind guide. Tailwind
// orders `gx-*`/`gy-*` after `g-*`, so the axis class wins whatever the keys;
// dist/css orders gutters by `$gutters` key, so `g-md` beats the earlier
// `gx-0`. A change here means the guide needs updating too.
test('g-* with gx-* on one element: the axis class wins in the Tailwind build only', async ({ page }) => {
  const gutter: Curated[] = [{ testid: 'gutter-axis-after-both', properties: ['paddingLeft', 'marginTop'] }]
  const chassis = await captureComputedStyles(page, 'chassis', gutter)
  const tailwind = await captureComputedStyles(page, 'tailwind', gutter)

  expect(tailwind['gutter-axis-after-both'].paddingLeft).toBe('0px')
  expect(chassis['gutter-axis-after-both'].paddingLeft).not.toBe('0px')
  expect(tailwind['gutter-axis-after-both'].marginTop).toBe(chassis['gutter-axis-after-both'].marginTop)
})

// Tailwind-only: Chassis's own CSS has no attribute-aware dark:/light:
// utilities to compare against, so this checks the custom variants directly
// on nested markup. A same-value nested attribute (a dark navbar inside a
// dark page) must not count as an override; an opposite-value one must.
test('dark:/light: follow the nearest data-cx-theme, ignoring same-value nesting', async ({ page }) => {
  const compiler = await compile('@import "@chassis-ui/css/tailwind";', {
    base: root,
    onDependency: () => {}
  })
  const css = compiler.build(['dark:d-none', 'light:d-none'])
  await page.setContent(`<style>${css}</style>
    <div data-cx-theme="dark">
      <div data-cx-theme="dark"><p data-testid="dark-in-dark" class="dark:d-none">x</p></div>
      <div data-cx-theme="light">
        <p data-testid="dark-in-light" class="dark:d-none">x</p>
        <p data-testid="light-in-dark" class="light:d-none">x</p>
      </div>
    </div>
    <div data-cx-theme="light">
      <div data-cx-theme="light"><p data-testid="light-in-light" class="light:d-none">x</p></div>
    </div>`)

  const display = (testid: string) =>
    page.getByTestId(testid).evaluate((el) => getComputedStyle(el).display)

  // The OS scheme is the opposite of each tested attribute, so only the
  // attribute branches can match.
  await page.emulateMedia({ colorScheme: 'light' })
  expect(await display('dark-in-dark')).toBe('none')
  expect(await display('dark-in-light')).toBe('block')

  await page.emulateMedia({ colorScheme: 'dark' })
  expect(await display('light-in-dark')).toBe('none')
  expect(await display('light-in-light')).toBe('none')
})
