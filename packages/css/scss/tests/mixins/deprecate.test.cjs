'use strict'

// The deprecation notices are Sass `@warn` messages, which sass-true cannot
// capture; these specs compile the modules through the Sass API with a
// logger and assert on what it collects.

const path = require('node:path')
const sass = require('sass')

const SCSS_DIR = path.resolve(__dirname, '..', '..')
const LOAD_PATHS = [
  SCSS_DIR,
  path.join(SCSS_DIR, 'vendor'),
  path.resolve(SCSS_DIR, '..', 'node_modules')
]

function compile(source) {
  const warnings = []
  const { css } = sass.compileString(source, {
    loadPaths: LOAD_PATHS,
    logger: {
      warn: (message) => warnings.push(message),
      debug() {}
    }
  })
  return { css, warnings }
}

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

describe('grid-layout()', () => {
  const layout = (config = '') => `
    @use "config" as * ${config};
    @use "mixins" as *;
    @include grid-layout();
  `

  it('warns once per compile that the flexbox grid is deprecated, with $enable-grid-classes', () => {
    const { css, warnings } = compile(layout())
    const notices = warnings.filter((message) => message.includes('flexbox grid'))
    expect(notices.length).toBe(1)
    expect(notices[0]).toContain('deprecated as of 0.6.0')
    expect(notices[0]).toContain('$enable-grid-classes: false')
    // The framework's own calls of the deprecated column mixins are silenced.
    expect(warnings.length).toBe(1)
    expect(css).toContain('.row {')
    expect(css).toContain('.col-6 {')
  })

  it('warns about nothing without the flexbox grid', () => {
    const { css, warnings } = compile(layout('with ($enable-grid-classes: false)'))
    expect(warnings).toEqual([])
    expect(css).not.toContain('.row {')
    expect(css).toContain('.grid {')
    expect(css).toContain('.col-span-6')
  })

  it('emits nothing with both grids off', () => {
    const { css, warnings } = compile(
      layout('with ($enable-grid-classes: false, $enable-cssgrid: false)')
    )
    expect(warnings).toEqual([])
    expect(css).toBe('')
  })

  it('warns when a deprecated flexbox variable is configured', () => {
    const { warnings } = compile(layout('with ($grid-gutter-y: 1rem, $grid-row-columns: 4)'))
    expect(warnings.filter((message) => message.startsWith('`$grid-gutter-y`')).length).toBe(1)
    expect(warnings.filter((message) => message.startsWith('`$grid-row-columns`')).length).toBe(1)
  })

  it('warns when a deprecated column mixin is called directly', () => {
    const { warnings } = compile(`
      @use "config" as * with ($enable-grid-classes: false);
      @use "mixins" as *;
      .a { @include make-col(4); }
      .b { @include make-col-offset(2); }
    `)
    expect(warnings).toEqual([
      '`make-col()` has been deprecated as of 0.6.0. It will be removed entirely in 0.7.0.',
      '`make-col-offset()` has been deprecated as of 0.6.0. It will be removed entirely in 0.7.0.'
    ])
  })
})

describe('$container-padding-x', () => {
  const root = (config) => `
    @use "config" as * with (${config});
    @use "mixins" as *;
    :root { @include grid-root-vars(); }
  `

  it('feeds half its value to every breakpoint of $container-paddings, and warns', () => {
    const { css, warnings } = compile(root('$container-padding-x: 2rem'))
    expect(warnings.length).toBe(1)
    expect(warnings[0]).toContain('`$container-padding-x` has been deprecated as of 0.6.0')
    expect(warnings[0]).toContain('$container-paddings')
    expect(css).toContain('--container-padding: 1rem;')
    // The same value at every breakpoint: declared once, on the first.
    expect(css.match(/--container-padding:/g).length).toBe(1)
  })

  it('leaves $container-paddings alone at its default', () => {
    // Paddings of its own, so that the test does not depend on the margin tokens.
    const paddings = '$container-paddings: (xs: 3rem, md: 4rem)'
    const { css, warnings } = compile(root(`$enable-grid-classes: false, ${paddings}`))
    expect(warnings).toEqual([])
    expect(css).toContain('--container-padding: 3rem;')
    expect(css).toContain('--container-padding: 4rem;')
  })
})
