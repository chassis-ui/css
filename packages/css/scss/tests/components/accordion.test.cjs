'use strict'

// A flush accordion shows the background of its parent, and one with a context keeps the colors
// of the context: the two rules have the same specificity, so the context has to come later.

const { compile: compileSass } = require('../helpers/compile.cjs')

function compile() {
  const { css } = compileSass(
    `
      @use "config";
      @use "accordion";
    `,
    { style: 'compressed' }
  )
  return css
}

const FLUSH_BACKGROUNDS =
  /\.accordion\.flush\{--accordion-item-bg-color:\s*transparent;--accordion-title-bg-color:\s*transparent;--accordion-title-bg-active:\s*transparent;/

describe('accordion', () => {
  it('removes the backgrounds of a flush accordion', () => {
    expect(compile()).toMatch(FLUSH_BACKGROUNDS)
  })

  it('writes the context variant after them, so a context keeps its colors', () => {
    const css = compile()
    const context = css.indexOf('.accordion.context{')

    expect(context).toBeGreaterThan(-1)
    expect(css.search(FLUSH_BACKGROUNDS)).toBeLessThan(context)
  })
})
