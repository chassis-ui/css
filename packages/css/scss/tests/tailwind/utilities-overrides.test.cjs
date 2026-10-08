'use strict'

// `$utilities-overrides` reaches the Tailwind entry: `scss/tailwind/utilities.scss`
// and the merge manifest generate from the `$utilities` map of the native build.

const path = require('node:path')
const sass = require('sass')

const SCSS_DIR = path.resolve(__dirname, '..', '..')
const LOAD_PATHS = [
  SCSS_DIR,
  path.join(SCSS_DIR, 'vendor'),
  path.resolve(SCSS_DIR, '..', 'node_modules')
]

const OVERRIDES = `
  @use "utilities" as chassis with (
    $utilities-overrides: (
      "float": null,
      "width": (values: (10: 10%)),
      "cursor": (property: cursor, class: cursor, values: auto pointer grab)
    )
  );
`

function compile(entry) {
  return sass.compileString(`${OVERRIDES} @use "tailwind/${entry}";`, { loadPaths: LOAD_PATHS }).css
}

describe('the Tailwind entry with $utilities-overrides', () => {
  it('emits the `@utility` rules of the merged map', () => {
    const css = compile('utilities')
    expect(css).toContain('@utility cursor-grab {')
    expect(css).toContain('@utility w-10 {')
    expect(css).toContain('@utility d-flex {')
    expect(css).not.toContain('@utility float-')
  })

  it('lists the classes of the merged map in the merge manifest', () => {
    const css = compile('merge-manifest')
    expect(css).toContain('/* MERGE|cursor|cursor-grab */')
    expect(css).toContain('/* MERGE|w|w-10 */')
    expect(css).not.toContain('|float-start */')
  })
})
