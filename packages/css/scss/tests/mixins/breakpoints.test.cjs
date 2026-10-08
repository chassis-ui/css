'use strict'

// What sass-true cannot assert on: the `@error` of a name that is no
// breakpoint. Without it the lookup gave no width, and a query mixin wrote its
// content with no query around it.

const { compile } = require('../helpers/compile.cjs')

const BREAKPOINTS = '(xs: 0, md: 768px, lg: 992px)'

const mixins = (body) => `
  @use "mixins" as *;
  ${body}
`

describe('a name that is no breakpoint', () => {
  const notFound = (name) => new RegExp(`breakpoint \`${name}\` not found in \`xs, md, lg\``)

  it('stops breakpoint-min() and breakpoint-max()', () => {
    for (const fn of ['breakpoint-min', 'breakpoint-max']) {
      expect(() => compile(mixins(`.test { width: ${fn}(tablet, ${BREAKPOINTS}); }`))).toThrowError(
        notFound('tablet')
      )
    }
  })

  it('stops the media query mixins', () => {
    for (const include of [
      'media-breakpoint-up(lgg, $bp)',
      'media-breakpoint-down(lgg, $bp)',
      'media-breakpoint-only(lgg, $bp)',
      'media-breakpoint-between(md, lgg, $bp)',
      'media-breakpoint-between(lgg, lg, $bp)'
    ]) {
      const source = mixins(`$bp: ${BREAKPOINTS}; .test { @include ${include} { color: red; } }`)
      expect(() => compile(source))
        .withContext(include)
        .toThrowError(notFound('lgg'))
    }
  })

  it('stops the container query mixins', () => {
    for (const include of [
      'container-breakpoint-up(lgg, null, $bp)',
      'container-breakpoint-down(lgg, null, $bp)',
      'container-breakpoint-only(lgg, null, $bp)',
      'container-breakpoint-between(md, lgg, null, $bp)'
    ]) {
      const source = mixins(`$bp: ${BREAKPOINTS}; .test { @include ${include} { color: red; } }`)
      expect(() => compile(source))
        .withContext(include)
        .toThrowError(notFound('lgg'))
    }
  })

  it('stops breakpoint-prefix()', () => {
    expect(() =>
      compile(mixins(`.test { content: breakpoint-prefix(tablet, ${BREAKPOINTS}); }`))
    ).toThrowError(notFound('tablet'))
  })

  it('writes the query of a name that is one', () => {
    const { css } = compile(
      mixins(`.test { @include media-breakpoint-up(md, ${BREAKPOINTS}) { color: red; } }`)
    )
    expect(css).toContain('@media (width >= 768px)')
  })
})

// An unquoted `2xl` is a number to Sass, and a quoted one a string.
describe('a name the map has in another Sass type', () => {
  const QUOTED = '(xs: 0, "2xl": 1536px)'
  const UNQUOTED = '(xs: 0, 2xl: 1536px)'

  it('stops with both types, for a quoted key', () => {
    const source = mixins(`.test { @include media-breakpoint-up(2xl, ${QUOTED}) { color: red; } }`)
    expect(() => compile(source)).toThrowError(
      /breakpoint `2xl` is a number here and a string in \$breakpoints, two keys to Sass\. Write `2xl` without quotes in both places\./
    )
  })

  it('stops with both types, for a quoted name', () => {
    const source = mixins(
      `.test { @include media-breakpoint-down("2xl", ${UNQUOTED}) { color: red; } }`
    )
    expect(() => compile(source)).toThrowError(
      /breakpoint `2xl` is a string here and a number in \$breakpoints/
    )
  })

  it('stops is-breakpoint() and breakpoint-next()', () => {
    for (const fn of ['is-breakpoint', 'breakpoint-next']) {
      expect(() => compile(mixins(`.test { content: ${fn}(2xl, ${QUOTED}); }`)))
        .withContext(fn)
        .toThrowError(/breakpoint `2xl` is a number here and a string in \$breakpoints/)
    }
  })

  it('stops the grid mixins on a key of their maps', () => {
    const source = mixins(`
      :root {
        @include grid-root-vars(
          $gutters: (xs: 1rem, 2xl: 2rem),
          $paddings: (xs: 1rem),
          $columns: (xs: 12),
          $breakpoints: ${QUOTED}
        );
      }
    `)
    expect(() => compile(source)).toThrowError(
      /breakpoint `2xl` is a number here and a string in \$breakpoints/
    )
  })

  it('stops the framework for a quoted key of $breakpoints', () => {
    const source = `
      @use "config" with (
        $breakpoints: (xs: 0, sm: 36rem, md: 48rem, lg: 64rem, xl: 80rem, "2xl": 96rem)
      );
      @use "chassis";
    `
    expect(() => compile(source)).toThrowError(
      /breakpoint `2xl` is a number here and a string in \$breakpoints/
    )
  })
})

// The breakpoints a project removes from `$breakpoints` stay in the maps that
// have a value for each of them.
describe('containers, with breakpoints removed from $breakpoints', () => {
  let result

  beforeAll(() => {
    result = compile(`
      @use "config" with (
        $breakpoints: (xs: 0, sm: 36rem, md: 48rem, lg: 64rem),
        $container-max-widths: (sm: 34rem, md: 45rem, lg: 60rem, xl: 71rem, 2xl: 82rem)
      );
      @use "containers";
    `)
  })

  it('warns about the max-widths of the removed breakpoints', () => {
    expect(result.warnings).toEqual([
      '$container-max-widths has a value for `xl`, which is not a breakpoint of $breakpoints. It is ignored.',
      '$container-max-widths has a value for `2xl`, which is not a breakpoint of $breakpoints. It is ignored.'
    ])
  })

  it('leaves them out, where they were written with no query around them', () => {
    expect(result.css).toContain('max-width: 60rem')
    expect(result.css).not.toContain('max-width: 71rem')
    expect(result.css).not.toContain('max-width: 82rem')
  })

  it('is silent on the default maps', () => {
    expect(compile('@use "containers";').warnings).toEqual([])
  })
})

describe('a breakpoint the components name', () => {
  it('stops the framework when $breakpoints has no sm', () => {
    const source = `
      @use "config" with ($breakpoints: (xs: 0, md: 48rem, lg: 64rem));
      @use "chassis";
    `
    expect(() => compile(source)).toThrowError(/breakpoint `sm` not found in `xs, md, lg`/)
  })
})
