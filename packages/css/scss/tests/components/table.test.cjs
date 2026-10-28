'use strict'

// The wrapper of a responsive table is the containing block of what it scrolls (issue 79): an
// absolutely positioned descendant, such as a `.visually-hidden` header, is clipped by it instead
// of widening the page.

const { compile: compileSass } = require('../helpers/compile.cjs')

function compile() {
  const { css } = compileSass(
    `
      @use "config";
      @use "table";
    `,
    { style: 'compressed' }
  )
  return css
}

describe('table', () => {
  it('positions the wrapper of a responsive table at every breakpoint', () => {
    const css = compile()
    const match = css.match(
      /([^{}]*\.table-responsive)\{position:relative;container-type:inline-size\}/
    )

    expect(match).not.toBeNull()
    for (const breakpoint of ['sm', 'md', 'lg', 'xl', '2xl']) {
      expect(match[1]).toContain(`.max-${breakpoint}\\:table-responsive`)
    }
  })
})
