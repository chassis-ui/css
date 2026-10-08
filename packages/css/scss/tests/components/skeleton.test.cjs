'use strict'

// The reduced-motion rule of the skeleton, on the partial itself and with
// `$enable-reduced-motion` on and off: a module is configured once per
// compilation, so each case is a compilation of its own.

const path = require('node:path')
const sass = require('sass')

const SCSS_DIR = path.resolve(__dirname, '..', '..')
const LOAD_PATHS = [
  SCSS_DIR,
  path.join(SCSS_DIR, 'vendor'),
  path.resolve(SCSS_DIR, '..', 'node_modules')
]

function compile(config = '') {
  const { css } = sass.compileString(
    `
      @use "config" ${config};
      @use "skeleton";
    `,
    { loadPaths: LOAD_PATHS, style: 'compressed' }
  )
  return css
}

const REDUCED_MOTION =
  '@media(prefers-reduced-motion: reduce){' +
  '.skeleton-glow.skeleton,.skeleton-glow .skeleton{animation:none}' +
  '.skeleton-wave{mask-image:none;animation:none}' +
  '}'

describe('skeleton', () => {
  it('animates the glow and the wave', () => {
    const css = compile()
    expect(css).toContain(
      '.skeleton-glow.skeleton,.skeleton-glow .skeleton{animation:skeleton-glow 2s ease-in-out infinite}'
    )
    expect(css).toContain('animation:skeleton-wave 2s linear infinite}')
  })

  it('stops both animations and removes the mask of the wave under reduced motion', () => {
    expect(compile()).toContain(REDUCED_MOTION)
  })

  it('writes the reduced-motion rule after the animations, in the components layer', () => {
    const css = compile()
    expect(css.indexOf(REDUCED_MOTION)).toBeGreaterThan(css.indexOf('@keyframes skeleton-wave'))
    expect(css.endsWith(`${REDUCED_MOTION}}`)).toBeTrue()
  })

  it('writes no reduced-motion rule with `$enable-reduced-motion: false`', () => {
    const css = compile('with ($enable-reduced-motion: false)')
    expect(css).not.toContain('prefers-reduced-motion')
    expect(css).toContain('animation:skeleton-glow 2s ease-in-out infinite')
    expect(css).toContain('animation:skeleton-wave 2s linear infinite')
  })
})
