'use strict'

// `$enable-prose-scale` and `$enable-display-scale`: the size and line-height
// scales of the two families, in the custom properties of `:root` and in their
// family classes. Their families and weights are there either way, since the
// text roles use them.

const { compile } = require('../helpers/compile.cjs')

const build = (settings = '') =>
  compile(`${settings ? `@use "config" with (${settings});` : ''}@use "chassis-utilities";`).css

// The declarations of the rule of `selector`, without its nested rules
const rule = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = css.match(new RegExp(`(?:^|[}\\s])${escaped}\\s*\\{([^}]*)\\}`))
  return match ? match[1] : ''
}

describe('the prose and display scales', () => {
  describe('off, the default', () => {
    const css = build()

    it('leave the sizes and line heights of prose and display out of :root', () => {
      expect(css).not.toMatch(/--(font-size|line-height)-(prose|display)-/)
    })

    it('keep their families and weights, which the text roles use', () => {
      expect(css).toMatch(/--font-family-prose:/)
      expect(css).toMatch(/--font-family-display:/)
      expect(css).toMatch(/--font-weight-prose-strong:/)
      expect(css).toMatch(/--font-weight-display-strong:/)
    })

    it('leave a family class its family and weights only', () => {
      for (const family of ['prose', 'display']) {
        const body = rule(css, `.font-${family}`)
        expect(body).toMatch(new RegExp(`font-family: var\\(--font-family-${family}\\)`))
        expect(body).toMatch(
          new RegExp(`--font-weight-strong: var\\(--font-weight-${family}-strong\\)`)
        )
        expect(body).not.toMatch(/--font-size-|--line-height-/)
      }
    })
  })

  describe('on', () => {
    const css = build('$enable-prose-scale: true, $enable-display-scale: true')

    it('put the sizes and line heights of prose and display in :root', () => {
      expect(css).toMatch(/--font-size-prose-6xl:/)
      expect(css).toMatch(/--line-height-prose-2xs:/)
      expect(css).toMatch(/--font-size-display-md:/)
      expect(css).toMatch(/--line-height-display-6xl:/)
    })

    it('point the size utilities at the scale of the family', () => {
      for (const family of ['prose', 'display']) {
        const body = rule(css, `.font-${family}`)
        expect(body).toMatch(new RegExp(`--font-size-lg: var\\(--font-size-${family}-lg\\)`))
        expect(body).toMatch(new RegExp(`--line-height-6xl: var\\(--line-height-${family}-6xl\\)`))
      }
    })
  })

  it('are independent of each other', () => {
    const css = build('$enable-display-scale: true')
    expect(css).not.toMatch(/--font-size-prose-/)
    expect(rule(css, '.font-display')).toMatch(/--font-size-lg: var\(--font-size-display-lg\)/)
  })
})
