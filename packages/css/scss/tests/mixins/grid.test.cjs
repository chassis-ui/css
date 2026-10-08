'use strict'

// What sass-true cannot assert on: the `@error` and `@warn` of the grid
// mixins, and whole entry points compiled with a configuration.

const { compile } = require('../helpers/compile.cjs')

const BREAKPOINTS = '(xs: 0, md: 768px, lg: 992px)'

describe('grid-root-vars()', () => {
  const root = (gutters) => `
    @use "mixins" as *;
    :root {
      @include grid-root-vars(
        $gutters: ${gutters},
        $paddings: (xs: 1rem),
        $columns: (xs: 12),
        $breakpoints: ${BREAKPOINTS}
      );
    }
  `

  it('fails on a map with no value for the first breakpoint', () => {
    expect(() => compile(root('(md: 1.5rem)'))).toThrowError(
      /grid-root-vars\(\): \$gutters has no value for `xs`, the first breakpoint/
    )
  })

  it('warns about a key that is no breakpoint, and ignores it', () => {
    const { css, warnings } = compile(root('(xs: 1rem, tablet: 2rem)'))
    expect(warnings).toEqual([
      'grid-root-vars(): $gutters has a value for `tablet`, which is not a breakpoint of $breakpoints. It is ignored.'
    ])
    expect(css).not.toContain('2rem')
  })

  it('is silent on the default maps', () => {
    const { warnings } = compile(`
      @use "mixins" as *;
      :root { @include grid-root-vars(); }
      .test { @include grid-container-vars(); }
    `)
    expect(warnings).toEqual([])
  })
})

describe('grid-container-vars()', () => {
  const contained = (columns) => `
    @use "mixins" as *;
    .test {
      @include grid-container-vars(
        $gutters: (xs: 1rem),
        $columns: ${columns},
        $breakpoints: ${BREAKPOINTS}
      );
    }
  `

  it('fails on a map with no value for the first breakpoint', () => {
    expect(() => compile(contained('(lg: 12)'))).toThrowError(
      /grid-container-vars\(\): \$columns has no value for `xs`, the first breakpoint/
    )
  })

  it('warns about a key that is no breakpoint', () => {
    const { warnings } = compile(contained('(xs: 4, wide: 12)'))
    expect(warnings).toEqual([
      'grid-container-vars(): $columns has a value for `wide`, which is not a breakpoint of $breakpoints. It is ignored.'
    ])
  })
})

describe('map-get-multiple()', () => {
  it('warns about a key the map lacks, and leaves it out', () => {
    const { css, warnings } = compile(`
      @use "sass:meta";
      @use "functions" as *;
      .test { content: meta.inspect(map-get-multiple((a: 1, b: 2), (a, x))); }
    `)
    expect(warnings).toEqual(['map-get-multiple(): the map has no key `x`.'])
    expect(css).toContain('content: (a: 1)')
  })

  it('is silent about a key of $optional that the map lacks', () => {
    const { css, warnings } = compile(`
      @use "sass:meta";
      @use "functions" as *;
      .test { content: meta.inspect(map-get-multiple((a: 1, b: 2), (a, x, y), $optional: (x, b))); }
    `)
    expect(warnings).toEqual(['map-get-multiple(): the map has no key `y`.'])
    expect(css).toContain('content: (a: 1)')
  })
})

// The grid bundle picks its utilities by key, and a key that names nothing
// was skipped in silence before map-get-multiple() warned.
describe('chassis-grid.scss', () => {
  let result

  beforeAll(() => {
    result = compile('@use "chassis-grid";')
  })

  it('names only utilities that exist', () => {
    expect(result.warnings).toEqual([])
  })

  it('has the grid, the query container and the fraction widths', () => {
    for (const selector of [
      '.grid {',
      '.grid.contained,',
      '.col-span-6 {',
      '.\\@md\\:col-span-4 {',
      '.contains-inline {',
      '.w-6\\/12 {',
      '.\\@md\\:w-6\\/12 {',
      '.col-end-13 {',
      '.grid-cols-subgrid {',
      '.grid-flow-col-dense {',
      '.auto-rows-fr {',
      '.justify-items-center {',
      '.place-self-end {',
      '.container {'
    ]) {
      expect(result.css).toContain(selector)
    }
  })
})

describe('$grid-rows: 0', () => {
  it('emits no row class, and none and subgrid for the row counts only', () => {
    const { css, warnings } = compile(`
      @use "sass:map";
      @use "config" with ($grid-rows: 0);
      @use "mixins" as *;
      @use "utilities" as *;
      @include grid-layout();
      @include generate-utility(map.get($utilities, "grid-row-counts"));
    `)
    expect(warnings).toEqual([])
    expect(css).toContain('.col-span-6')
    expect(css).not.toContain('row-span-')
    expect(css).not.toContain('row-start-')
    expect(css).not.toContain('row-end-')
    expect(css).not.toContain('.row-auto')
    expect(css).not.toMatch(/\.grid-rows-\d/)
    expect(css).toContain('.grid-rows-none')
    expect(css).toContain('.grid-rows-subgrid')
  })
})

describe('chassis.scss with $enable-grid-system: false', () => {
  let css

  beforeAll(() => {
    ;({ css } = compile(`
      @use "config" with ($enable-grid-system: false);
      @use "chassis";
    `))
  })

  it('leaves out the grid, its placement classes and the grid utilities', () => {
    for (const absent of [
      '.grid {',
      '.grid-fill',
      '.contained',
      'col-span-',
      'col-start-',
      'row-span-',
      '.grid-cols-',
      '.grid-rows-',
      '.grid-flow-',
      '.auto-cols-',
      '.auto-rows-'
    ]) {
      expect(css).not.toContain(absent)
    }
  })

  it('keeps the containers, the gap and width utilities and the :root grid variables', () => {
    for (const present of ['.container {', '.gap-md {', '.w-6\\/12 {', '--grid-gutter:']) {
      expect(css).toContain(present)
    }
  })
})
