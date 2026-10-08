'use strict'

// What sass-true cannot assert on: the `@error` and `@warn` of
// `$utilities-overrides`, and the complete framework compiled with a changed
// utility map.

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

const overrides = (map) => `@use "utilities" with ($utilities-overrides: ${map});`

describe('$utilities-overrides, checked', () => {
  it('fails on a value that is not a map', () => {
    expect(() => compile(overrides('responsive'))).toThrowError(
      /`\$utilities-overrides` should be a map of utility names and definitions, got: responsive/
    )
  })

  it('fails on a utility that is neither a map nor null', () => {
    expect(() => compile(overrides('("border": true)'))).toThrowError(
      /`\$utilities-overrides`: `border` should be a map of utility options or `null`, got: true/
    )
  })

  it('fails on a new utility without `property` and `values`, a misspelled name', () => {
    expect(() => compile(overrides('("boder": (responsive: true))'))).toThrowError(
      /`boder` is not a utility of `\$utilities`, and a new utility needs `property` and `values`/
    )
  })

  it('warns about the removal of a utility the map does not have', () => {
    const { warnings } = compile(overrides('("flaot": null)'))
    expect(warnings).toEqual([
      '`$utilities-overrides` removes `flaot`, which is not a utility of `$utilities`.'
    ])
  })

  it('is silent for the default, and for the overrides of a utility the map has', () => {
    expect(compile('@use "utilities";').warnings).toEqual([])
    expect(compile(overrides('("float": null, "border": (responsive: true))')).warnings).toEqual([])
  })

  it('is applied to a configured `$utilities` map, too', () => {
    const { css } = compile(`
      @use "sass:meta";
      @use "utilities" as utilities with (
        $utilities: (
          "opacity": (property: opacity, values: (0: 0, 50: .5)),
          "float": (property: float, values: none)
        ),
        $utilities-overrides: (
          "float": null,
          "opacity": (values: (100: 1))
        )
      );
      a { content: meta.inspect(utilities.$utilities); }
    `)
    expect(css).toContain(
      'content: ("opacity": (property: opacity, values: (0: 0, 50: 0.5, 100: 1)))'
    )
  })
})

describe('chassis.scss with $utilities-overrides', () => {
  let result

  beforeAll(() => {
    result = compile(`
      @use "utilities" with (
        $utilities-overrides: (
          "float": null,
          "border": (responsive: true),
          "padding": (container: true),
          "margin-start": (class: ml),
          "width": (values: (10: 10%, 25: null)),
          "cursor": (property: cursor, class: cursor, values: auto pointer grab)
        )
      );
      @use "chassis";
    `)
  })

  it('warns about nothing', () => {
    expect(result.warnings).toEqual([])
  })

  it('has the changed and the added utilities', () => {
    for (const selector of [
      '.border {',
      '.md\\:border {',
      '.md\\:border-0 {',
      '.\\@md\\:p-lg {',
      '.ml-auto {',
      '.md\\:ml-auto {',
      '.w-10 {',
      '.w-50 {',
      '.cursor-grab {'
    ]) {
      expect(result.css).toContain(selector)
    }
  })

  it('has none of the removed and the renamed ones', () => {
    for (const absent of ['.float-start', '.float-none', '.ms-auto', '.w-25 {']) {
      expect(result.css).not.toContain(absent)
    }
  })

  it('keeps the utilities in the utilities layer', () => {
    const layer = result.css.slice(result.css.lastIndexOf('@layer utilities {'))
    expect(layer).toContain('.cursor-grab {')
    expect(layer).toContain('.md\\:border {')
  })

  it('cannot be configured after the framework has loaded', () => {
    expect(() =>
      compile(`
        @use "chassis";
        @use "utilities" with ($utilities-overrides: ("float": null));
      `)
    ).toThrowError(/already loaded/)
  })
})

// A file can assign to `$utilities` of the loaded module, which is how
// `chassis-grid.scss` picks its utilities. The framework generates from the
// map as it is when `utilities-api` loads.
describe('chassis.scss after an assignment to $utilities', () => {
  let result

  beforeAll(() => {
    result = compile(`
      @use "functions" as *;
      @use "utilities" as utilities;

      utilities.$utilities: map-get-multiple(utilities.$utilities, ("display", "opacity"));

      @use "chassis";
    `)
  })

  it('generates the utilities of the assigned map only', () => {
    const layer = result.css.slice(result.css.lastIndexOf('@layer utilities {'))
    expect(result.warnings).toEqual([])
    expect(layer).toContain('.d-flex {')
    expect(layer).toContain('.md\\:d-flex {')
    expect(layer).toContain('.opacity-50 {')
    expect(layer).not.toContain('.float-start')
    expect(layer).not.toContain('.p-lg')
    expect(layer).not.toContain('.border {')
  })
})
