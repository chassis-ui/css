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
// at the lg breakpoint), table, CSS grid-cols-2 (an `equal` clash since
// 0.6.0: one merged rule, no remedy), a container-query stack, and typical
// utilities spanning a responsive variant and two Phase 5 remedies. The
// .grid cases check Tailwind core's placement utilities (col-span-*,
// col-start-*, row-span-*, grid-cols-*, grid-rows-*) against dist/css's per-breakpoint
// classes, a start line reset with col-start-auto and row-start-auto, the
// responsive gutter of .grid at each viewport, a gap utility over it, the
// fraction widths, and a fraction reset with md:w-100 and lg:w-auto. The cq-*
// cases sit in a query container narrower than the viewport: core's @sm: /
// @md: / @lg: variants against dist/css's container classes, the gutter of
// .grid.contained, md: and @md: on one element, and layout utilities. The
// grid cases after them are the rules of the entry itself, the same Sass in
// both builds: a definite-height .grid, and .grid-fill at its default and at
// an inline minimum. The last ones are the rest of the vocabulary: end lines
// and the auto resets (core's), subgrid, grid-flow-*, auto-cols-*, the
// justify-* and place-* alignment and the ends of order (Chassis utilities
// equal to core's), a grid under dir="rtl" and a nested grid.
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
  { testid: 'grid-cols-2', properties: ['gridTemplateColumns'] },
  { testid: 'grid-cols-12', properties: ['gridTemplateColumns'] },
  { testid: 'col-span-4', properties: ['gridColumnStart', 'gridColumnEnd'] },
  { testid: 'col-span-responsive', properties: ['gridColumnStart', 'gridColumnEnd'] },
  { testid: 'col-start-3', properties: ['gridColumnStart', 'gridColumnEnd'] },
  { testid: 'row-span-2', properties: ['gridRowStart', 'gridRowEnd'] },
  { testid: 'start-reset', properties: ['gridColumnStart', 'gridColumnEnd', 'gridRowStart'] },
  { testid: 'grid-gutter', properties: ['columnGap', 'rowGap'] },
  { testid: 'grid-rows', properties: ['gridTemplateRows'] },
  { testid: 'grid-gap-md', properties: ['columnGap', 'rowGap'] },
  { testid: 'skeleton-fraction', properties: ['width'] },
  { testid: 'width-reset', properties: ['width'] },
  { testid: 'stack', properties: ['flexDirection'] },
  { testid: 'cq-grid', properties: ['gridTemplateColumns', 'columnGap', 'rowGap'] },
  { testid: 'cq-span', properties: ['gridColumnStart', 'gridColumnEnd'] },
  { testid: 'cq-start', properties: ['gridColumnStart', 'gridColumnEnd'] },
  { testid: 'cq-order', properties: ['gridColumnStart', 'gridColumnEnd'] },
  { testid: 'cq-flex', properties: ['display', 'flexDirection', 'columnGap'] },
  { testid: 'grid-tall', properties: ['gridTemplateRows', 'gridTemplateColumns'] },
  { testid: 'grid-fill', properties: ['gridTemplateColumns', 'columnGap'] },
  { testid: 'grid-fill-min', properties: ['gridTemplateColumns'] },
  { testid: 'contained-alone', properties: ['columnGap', 'gridTemplateColumns'] },
  { testid: 'col-end', properties: ['gridColumnStart', 'gridColumnEnd'] },
  { testid: 'col-auto', properties: ['gridColumnStart', 'gridColumnEnd'] },
  { testid: 'row-end', properties: ['gridRowStart', 'gridRowEnd'] },
  { testid: 'subgrid', properties: ['gridTemplateColumns'] },
  { testid: 'flow', properties: ['gridAutoFlow', 'gridAutoColumns', 'gridTemplateColumns', 'gridTemplateRows'] },
  { testid: 'align-grid', properties: ['justifyItems', 'alignContent', 'justifyContent'] },
  { testid: 'justify-self', properties: ['justifySelf'] },
  { testid: 'place-self', properties: ['alignSelf', 'justifySelf', 'order'] },
  { testid: 'order-last', properties: ['order'] },
  { testid: 'rtl-start', properties: ['gridColumnStart', 'gridColumnEnd'] },
  { testid: 'nested-grid', properties: ['gridTemplateColumns', 'columnGap'] },
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

// The parity loop above passes when both builds ignore a class alike, so this
// pins what the container cases compute to: the band of the container (three
// quarters of the viewport), never the viewport's.
const CONTAINER_BANDS = [
  // Container about 280px: no band. The unprefixed classes only.
  { width: 375, columnGap: '16px', spanEnd: '-1', start: 'auto', orderEnd: 'auto', display: 'none', direction: 'column' },
  // Container 675px, the sm band, in a viewport of the md band: the gutter of
  // sm, and md:col-span-6 without @md:col-span-4.
  { width: 900, columnGap: '16px', spanEnd: '-1', start: 'auto', orderEnd: 'span 6', display: 'flex', direction: 'column' },
  // Container 1080px, the lg band: the gutter of md and up, every @ variant.
  { width: 1440, columnGap: '24px', spanEnd: 'span 2', start: '2', orderEnd: 'span 4', display: 'flex', direction: 'row' }
]

for (const mode of ['chassis', 'tailwind'] as const) {
  for (const band of CONTAINER_BANDS) {
    test(`the container cases follow the container, not the viewport (${mode}, ${band.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: band.width, height: 900 })
      const styles = await captureComputedStyles(page, mode)

      expect(styles['cq-grid'].columnGap).toEqual(band.columnGap)
      expect(styles['cq-span'].gridColumnEnd).toEqual(band.spanEnd)
      expect(styles['cq-start'].gridColumnStart).toEqual(band.start)
      expect(styles['cq-order'].gridColumnEnd).toEqual(band.orderEnd)
      expect(styles['cq-flex'].display).toEqual(band.display)
      expect(styles['cq-flex'].flexDirection).toEqual(band.direction)
    })
  }
}

// What the layout rules of the entry compute to, in both builds: the parity
// loop alone would pass on a defect the two builds share.
for (const mode of ['chassis', 'tailwind'] as const) {
  test(`.grid has no explicit row and .grid-fill wraps at its minimum (${mode})`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const styles = await captureComputedStyles(page, mode)
    const tracks = (value: string) => value.split(' ')

    // Six items in three columns, 300px tall: two implicit rows of the same
    // height. An explicit `minmax(0, 1fr)` row took all the free space.
    const rows = tracks(styles['grid-tall'].gridTemplateRows)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual(rows[1])

    // 1000px wide, a 24px gutter: four columns of at least 12rem, so the
    // fifth item wraps; two columns of at least 20rem.
    expect(styles['grid-fill'].columnGap).toEqual('24px')
    expect(tracks(styles['grid-fill'].gridTemplateColumns)).toHaveLength(4)
    expect(tracks(styles['grid-fill-min'].gridTemplateColumns)).toHaveLength(2)
  })

  test(`the end lines, the flow, the alignment, order, RTL and nesting compute as named (${mode})`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const styles = await captureComputedStyles(page, mode)
    const edges = (testid: string) =>
      page.getByTestId(testid).evaluate((el) => {
        const { left, right } = el.getBoundingClientRect()
        return { left: Math.round(left), right: Math.round(right) }
      })

    // `col-span-3 col-end-13`: three tracks against the end edge.
    expect(styles['col-end']).toEqual({ gridColumnStart: 'span 3', gridColumnEnd: '13' })
    expect((await edges('col-end')).right).toEqual((await edges('end-grid')).right)
    // `md:col-auto` takes the span of `col-span-6` back.
    expect(styles['col-auto']).toEqual({ gridColumnStart: 'auto', gridColumnEnd: 'auto' })
    expect(styles['row-end']).toEqual({ gridRowStart: '2', gridRowEnd: 'auto' })

    // `md:grid-flow-row` over `grid-flow-col-dense`.
    expect(styles.flow.gridAutoFlow).toEqual('row')
    expect(styles.flow.gridAutoColumns).toEqual('minmax(0px, 1fr)')

    expect(styles['align-grid'].justifyItems).toEqual('center')
    expect(styles['align-grid'].alignContent).toEqual('space-between')
    expect(styles['justify-self'].justifySelf).toEqual('start')
    expect(styles['place-self']).toEqual({ alignSelf: 'end', justifySelf: 'end', order: '-9999' })
    expect(styles['order-last'].order).toEqual('9999')

    // Under dir="rtl" line 1 is the right edge.
    expect((await edges('rtl-start')).right).toEqual((await edges('rtl-grid')).right)

    // Six columns and an 8px gap from the ancestor, in the nested grid too.
    expect(styles['nested-grid'].gridTemplateColumns.split(' ')).toHaveLength(6)
    expect(styles['nested-grid'].columnGap).toEqual('8px')
  })

  test(`.contained with no query container keeps the gutter of the viewport (${mode})`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await captureComputedStyles(page, mode)

    const columnGap = () =>
      page.getByTestId('contained-alone').evaluate((el) => getComputedStyle(el).columnGap)

    // The body of the fixture is a query container of the md band and up.
    expect(await columnGap()).toEqual('24px')

    // Without it no `@container` rule matches, the one of the first
    // breakpoint included, and the grid reads the gutter of `:root`.
    await page.evaluate(() => {
      document.body.style.containerType = 'normal'
    })
    expect(await columnGap()).toEqual('24px')

    // A container narrower than md under a wide viewport: its own gutter.
    await page.evaluate(() => {
      document.body.style.containerType = 'inline-size'
      document.body.style.width = '600px'
    })
    expect(await columnGap()).toEqual('16px')
  })
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
