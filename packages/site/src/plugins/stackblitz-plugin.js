/**
 * Vite plugin to replace placeholder values in stackblitz.js with actual configuration values
 *
 * @param {import('../libs/config').SiteConfig} config The parsed `config.yml`
 */
export function stackblitzPlugin(config) {
  return {
    name: 'stackblitz-config-replacer',
    transform(code, id) {
      if (id.includes('stackblitz.js')) {
        return code
          .replace(/__CSS_CDN__/g, config.cdn.css)
          .replace(/__JS_BUNDLE_CDN__/g, config.cdn.jsBundle)
      }

      return code
    }
  }
}
