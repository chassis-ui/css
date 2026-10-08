'use strict'

// The deprecation notices are Sass `@warn` messages, which sass-true cannot
// capture; these specs compile the modules through the Sass API with a
// logger and assert on what it collects.

const { compile } = require('../helpers/compile.cjs')

describe('deprecate()', () => {
  it('warns with the name and both versions', () => {
    const { warnings } = compile(`
      @use "mixins/deprecate" as *;
      @include deprecate("\`old()\`", "0.6.0", "0.7.0");
    `)
    expect(warnings).toEqual([
      '`old()` has been deprecated as of 0.6.0. It will be removed entirely in 0.7.0.'
    ])
  })

  it('is silent for $ignore-warning: true', () => {
    const { warnings } = compile(`
      @use "mixins/deprecate" as *;
      @include deprecate("\`old()\`", "0.6.0", "0.7.0", $ignore-warning: true);
    `)
    expect(warnings).toEqual([])
  })

  it('is silent when $enable-deprecation-messages is false', () => {
    const { warnings } = compile(`
      @use "config" with ($enable-deprecation-messages: false);
      @use "mixins/deprecate" as *;
      @include deprecate("\`old()\`", "0.6.0", "0.7.0");
    `)
    expect(warnings).toEqual([])
  })
})

// The flexbox grid, deprecated in 0.6.0, is gone: nothing in the framework
// calls deprecate() or warns on the default configuration.
describe('grid-layout()', () => {
  const layout = (config = '') => `
    @use "config" as * ${config};
    @use "mixins" as *;
    @include grid-layout();
  `

  it('warns about nothing and emits no flexbox grid', () => {
    const { css, warnings } = compile(layout())
    expect(warnings).toEqual([])
    expect(css).not.toContain('.row {')
    expect(css).not.toContain('.col-6 {')
    expect(css).not.toContain('g-col-')
    expect(css).toContain('.grid {')
    expect(css).toContain('.col-span-6')
  })

  it('emits nothing with $enable-grid-system: false', () => {
    const { css, warnings } = compile(layout('with ($enable-grid-system: false)'))
    expect(warnings).toEqual([])
    expect(css).toBe('')
  })

  it('no longer has the option under its old name', () => {
    expect(() => compile(layout('with ($enable-cssgrid: false)'))).toThrowError(/\$enable-cssgrid/)
  })
})
