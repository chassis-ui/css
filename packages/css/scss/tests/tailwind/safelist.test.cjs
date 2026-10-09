'use strict'

// The settings reach the opt-in safelist of the Tailwind entry:
// `scss/tailwind/safelist.scss` lists what the native build generates at the
// breakpoints with the same settings.

const { compile: compileSass } = require('../helpers/compile.cjs')

const compile = (config = '') =>
  compileSass(`${config ? `@use "config" with (${config});` : ''} @use "tailwind/safelist";`).css

describe('the safelist of the Tailwind entry', () => {
  it('holds only `@source inline()` rules: the grid classes and the layout utilities', () => {
    const css = compile()
    const rules = css.trim().split('\n')
    expect(rules.length).toBe(21)
    expect(css).toContain('}{flex-row,flex-column,flex-row-reverse,flex-column-reverse}");')
    expect(css).toContain('}{w-1/12,')
    expect(css).not.toMatch(/[{,](?:p|m|-m|d|order|float|font|space-x)-/)
    for (const rule of rules) {
      expect(rule).toMatch(/^@source inline\("[^"\s]+"\);$/)
    }
  })

  it('follows `$breakpoints`, `$grid-columns` and `$grid-rows`', () => {
    const css = compile(`
      $breakpoints: (xs: 0, md: 48rem, 3xl: 120rem),
      $grid-columns: 16,
      $grid-rows: 0
    `)
    expect(css).toContain('@source inline("{,md:,3xl:,@md:,@3xl:}col-span-{1..16}");')
    expect(css).toContain('@source inline("{,md:,3xl:,@md:,@3xl:}col-end-{1..17}");')
    expect(css).toContain('@source inline("{,md:,3xl:,@md:,@3xl:}{gap-zero,')
    expect(css).not.toContain('row-span-')
    expect(css).not.toContain('sm:')
    expect(css).not.toContain('2xl:')
  })

  it('has no container-query prefix with `$enable-container-queries: false`', () => {
    const css = compile('$enable-container-queries: false')
    expect(css).toContain('@source inline("{,sm:,md:,lg:,xl:,2xl:}col-span-{1..12}");')
    expect(css).toContain('@source inline("{,sm:,md:,lg:,xl:,2xl:}{gap-zero,')
    expect(css).not.toContain('@sm:')
  })

  it('has no grid class with `$enable-grid-system: false`', () => {
    const css = compile('$enable-grid-system: false')
    expect(css).not.toMatch(/col-span-|row-start-|grid-cols-|grid-flow-/)
    expect(css).toContain('}{gap-zero,')
  })

  it('lists the classes of the map merged with `$utilities-overrides`', () => {
    const css = compileSass(`
      @use "utilities" with (
        $utilities-overrides: (
          "flex-fill": null,
          "flex-wrap": (values: wrap nowrap)
        )
      );
      @use "tailwind/safelist";
    `).css
    expect(css).toContain('}{flex-wrap,flex-nowrap}");')
    expect(css).not.toContain('flex-fill')
  })

  it("lists the utilities of a project's own `$safelist-utilities`", () => {
    const css = compileSass(`
      @use "tailwind/safelist" with (
        $safelist-utilities: ("gap", "padding", "opacity")
      );
    `).css
    expect(css).toContain(
      '@source inline("{,sm:,md:,lg:,xl:,2xl:,@sm:,@md:,@lg:,@xl:,@2xl:}{gap-zero,'
    )
    expect(css).toContain('@source inline("{,sm:,md:,lg:,xl:,2xl:}{p-zero,')
    expect(css).toMatch(/@source inline\("\{opacity-[^}]+\}"\);/)
    expect(css).not.toContain('flex-row')
    expect(css).toContain('col-span-{1..12}')
  })

  it('adds the utilities of `$safelist-utilities-extra` after the ones of the list', () => {
    const css = compileSass(`
      @use "tailwind/safelist" with (
        $safelist-utilities-extra: ("padding", "gap")
      );
    `).css
    const rules = css.trim().split('\n')
    expect(rules.length).toBe(22)
    expect(rules[21]).toContain('@source inline("{,sm:,md:,lg:,xl:,2xl:}{p-zero,')
    expect(css.match(/\{gap-zero,/g).length).toBe(1)
    expect(css).toContain('}{flex-row,flex-column,flex-row-reverse,flex-column-reverse}");')
  })

  it('takes a single key for `$safelist-utilities-extra`', () => {
    const css = compileSass(
      '@use "tailwind/safelist" with ($safelist-utilities-extra: "padding");'
    ).css
    expect(css.trim().split('\n').length).toBe(22)
  })
})
