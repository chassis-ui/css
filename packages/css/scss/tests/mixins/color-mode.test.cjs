'use strict'

// `color-mode()` with each `$color-mode-type`, and the theme rules of the
// root. sass-true writes its output inside `.test-output`, so it cannot show
// what the mixin writes outside a rule, and a module is configured once per
// compilation: each case is a compilation of its own.

const { compile: compileSass } = require('../helpers/compile.cjs')

function compile(source, config = '') {
  const { css } = compileSass(
    `
      @use "config" ${config};
      @use "mixins/color-mode" as *;
      ${source}
    `,
    { style: 'compressed' }
  )
  return css
}

const DARK = '[data-cx-theme=dark]'
const LIGHT = '[data-cx-theme=light]'

describe('color-mode() with the default $color-mode-type', () => {
  it('follows the nearest theme and the system preference inside a rule', () => {
    const css = compile(`
      .element {
        color: black;
        @include color-mode(dark) { color: white; }
      }
    `)
    expect(css).toBe(
      '.element{color:#000}' +
        `.element${DARK},.element:where(${DARK} *):not(:where(${DARK} ${LIGHT} *)){color:#fff}` +
        `@media(prefers-color-scheme: dark){.element:not(:where(${LIGHT},${LIGHT} *)){color:#fff}}`
    )
  })

  it('names the other mode for light', () => {
    const css = compile(`
      .element {
        @include color-mode(light) { color: black; }
      }
    `)
    expect(css).toBe(
      `.element${LIGHT},.element:where(${LIGHT} *):not(:where(${LIGHT} ${DARK} *)){color:#000}` +
        `@media(prefers-color-scheme: light){.element:not(:where(${DARK},${DARK} *)){color:#000}}`
    )
  })

  it('puts the condition on the element of a pseudo-element, in every selector of a list', () => {
    const css = compile(`
      .a > .b::after, .c:hover {
        @include color-mode(dark) { color: white; }
      }
    `)
    expect(css).toContain(`.a>.b${DARK}::after,.c:hover${DARK},`)
    expect(css).toContain(
      `.a>.b:where(${DARK} *):not(:where(${DARK} ${LIGHT} *))::after,` +
        `.c:hover:where(${DARK} *):not(:where(${DARK} ${LIGHT} *)){color:#fff}`
    )
    expect(css).toContain(
      `{.a>.b:not(:where(${LIGHT},${LIGHT} *))::after,.c:hover:not(:where(${LIGHT},${LIGHT} *)){color:#fff}}`
    )
  })

  it('takes a rule of a pseudo-element alone', () => {
    const css = compile(`
      ::selection {
        @include color-mode(dark) { color: white; }
      }
    `)
    expect(css).toContain(
      `${DARK}::selection,:where(${DARK} *):not(:where(${DARK} ${LIGHT} *))::selection{`
    )
  })

  it('writes the theme and the system preference of the root outside a rule', () => {
    const css = compile(`
      @include color-mode(dark) {
        --accent: black;
        .element { color: white; }
      }
    `)
    expect(css).toBe(
      `${DARK}{--accent: black}${DARK} .element{color:#fff}` +
        '@media(prefers-color-scheme: dark){' +
        `:root:where(:not(${LIGHT})){--accent: black}` +
        `:root:where(:not(${LIGHT})) .element{color:#fff}` +
        '}'
    )
  })

  it('follows the attribute alone for a theme of a project', () => {
    const inside = compile(`
      .element {
        @include color-mode(primary) { color: white; }
      }
    `)
    expect(inside).toBe(
      '.element[data-cx-theme=primary],.element:where([data-cx-theme=primary] *){color:#fff}'
    )

    const outside = compile(`
      @include color-mode(primary) {
        .element { color: white; }
      }
    `)
    expect(outside).toBe('[data-cx-theme=primary] .element{color:#fff}')
  })
})

describe('color-mode() with $color-mode-type: data', () => {
  it('writes the attribute selector alone, inside and outside a rule', () => {
    const css = compile(
      `
        @include color-mode(dark) {
          .element { color: white; }
        }
        .other {
          @include color-mode(dark) { color: white; }
        }
      `,
      'with ($color-mode-type: data)'
    )
    expect(css).toBe(`${DARK} .element{color:#fff}.other ${DARK}{color:#fff}`)
  })
})

describe('color-mode() with $color-mode-type: media-query', () => {
  it('writes the media query alone', () => {
    const css = compile(
      `
        @include color-mode(dark) {
          .element { color: white; }
        }
      `,
      'with ($color-mode-type: media-query)'
    )
    expect(css).toBe('@media(prefers-color-scheme: dark){.element{color:#fff}}')
  })

  it('puts declarations in :root with $root: true', () => {
    const css = compile(
      `
        @include color-mode(dark, true) { --accent: black; }
      `,
      'with ($color-mode-type: media-query)'
    )
    expect(css).toBe('@media(prefers-color-scheme: dark){:root{--accent: black}}')
  })
})

// The icons of the form controls are images with their color written in:
// `light-dark()` cannot reach them, so the root declares them for each mode.
describe('the form icons of the root', () => {
  function root(config = '') {
    const { css } = compileSass(
      `
        @use "config" ${config};
        @use "root";
      `,
      { style: 'compressed' }
    )
    return css
  }

  // The fill of the caret of a select, in the default tokens
  const LIGHT_CARET =
    "--form-caret: url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='%23161a1b'"
  const DARK_CARET =
    "--form-caret: url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='%23e9eced'"

  it('takes the dark icons under the system preference, unless the root has the light theme', () => {
    const css = root()
    const system = `@media(prefers-color-scheme: dark){:root:not(${LIGHT}){${DARK_CARET}`
    expect(css).toContain(`:root,${LIGHT}{${LIGHT_CARET}`)
    expect(css).toContain(system)
    expect(css).toContain(`${DARK}{color-scheme:dark;${DARK_CARET}`)
  })

  it('writes the rule of the system preference after the light icons and before the themes', () => {
    const css = root()
    const light = css.indexOf(`:root,${LIGHT}{--form-caret`)
    const system = css.indexOf(`@media(prefers-color-scheme: dark){:root:not(${LIGHT})`)
    const dark = css.indexOf(`${DARK}{color-scheme:dark`)
    expect(light).toBeGreaterThan(-1)
    expect(system).toBeGreaterThan(light)
    expect(dark).toBeGreaterThan(system)
  })

  it('declares the light icons alone with $enable-dark-mode: false', () => {
    const css = root('with ($enable-dark-mode: false)')
    expect(css).toContain(LIGHT_CARET)
    expect(css).not.toContain(DARK_CARET)
    expect(css).not.toContain('prefers-color-scheme')
    expect(css).not.toContain('data-cx-theme')
  })
})
