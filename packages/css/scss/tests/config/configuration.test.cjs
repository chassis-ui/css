'use strict'

// How a project configures the framework: one `with (...)` on `config`, or on
// `config/defaults`, reaches the flags, the defaults, the token variables and
// the vendor tokens. Each case is a compilation of its own, since a module is
// configured once.

const path = require('node:path')
const sass = require('sass')

const SCSS_DIR = path.resolve(__dirname, '..', '..')
const LOAD_PATHS = [
  SCSS_DIR,
  path.join(SCSS_DIR, 'vendor'),
  path.resolve(SCSS_DIR, '..', 'node_modules')
]

function compile(source) {
  return sass.compileString(source, { loadPaths: LOAD_PATHS }).css
}

for (const entry of ['config', 'config/defaults']) {
  describe(`@use "${entry}" with (...)`, () => {
    it('configures a flag, a default, a token variable and a vendor token', () => {
      const css = compile(`
        @use "${entry}" as config with (
          $enable-negative-margins: false,
          $paragraph-margin-bottom: 2rem,
          $primary: #0074d9,
          $cx-color-base-context-light-danger-base-color: #ff4136
        );
        a {
          flag: config.$enable-negative-margins;
          default: config.$paragraph-margin-bottom;
          token: config.$primary;
          vendor: config.$danger;
        }
      `)
      expect(css).toContain('flag: false;')
      expect(css).toContain('default: 2rem;')
      expect(css).toContain('token: #0074d9;')
      expect(css).toContain('vendor: #ff4136;')
    })

    it('reaches the maps that read a token variable', () => {
      const css = compile(`
        @use "sass:map";
        @use "${entry}" with ($primary: #0074d9);
        @use "maps" as maps;
        a { primary: map.get(maps.$context-colors, "primary"); }
      `)
      expect(css).toContain('primary: #0074d9;')
    })

    it('fails on a variable that no module declares', () => {
      expect(() => compile(`@use "${entry}" with ($no-such-variable: 1);`)).toThrowError(
        /not declared with !default/
      )
    })
  })
}

// `with (...)` cannot read the default of the module it configures. A file
// adds to a map, or removes from it, by assigning to the variable of the
// loaded module before the modules that read the map load.
describe('an assignment to a map of `config`', () => {
  const ratios = (assignment) =>
    compile(`
      @use "sass:map";
      @use "config" as config;
      ${assignment}
      @use "utilities" as utilities;
      a { ratios: map.keys(map.get(utilities.$utilities, "aspect-ratio", values)); }
    `)

  it('adds a key for the modules that load after it', () => {
    const css = ratios('config.$aspect-ratios: map.merge(config.$aspect-ratios, ("2x1": "2 / 1"));')
    expect(css).toContain('ratios: "auto", "1x1", "4x3", "16x9", "21x9", "2x1";')
  })

  it('removes a key for the modules that load after it', () => {
    const css = ratios('config.$aspect-ratios: map.remove(config.$aspect-ratios, "4x3", "21x9");')
    expect(css).toContain('ratios: "auto", "1x1", "16x9";')
  })
})
