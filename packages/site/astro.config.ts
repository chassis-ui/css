import path from 'node:path'
import { defineConfig } from 'astro/config'
import { loadConfig } from '@chassis-ui/docs'
import { chassisDocs } from '@chassis-ui/docs/integration'
import { chassis } from './src/libs/astro'
import { siteConfigSchema } from './src/libs/config'
import { stackblitzPlugin } from './src/plugins/stackblitz-plugin'

const root = import.meta.dirname
const config = loadConfig({ root, schema: siteConfigSchema })

// https://astro.build/config
export default defineConfig({
  outDir: '../../_site',
  build: {
    // The files of the build are written to _site/css/static/astro/ and requested as
    // /css/static/astro/…, which chassis-ui.com routes to this site by path. Under /static it
    // routes by the `Referer` header, and that of a script another script imports names no
    // site. The shared files stay on /static. Keep this folder in every name pattern below.
    assets: `css/static/astro`
  },
  integrations: [chassisDocs({ config }), ...chassis({ config, root })],
  vite: {
    plugins: [stackblitzPlugin(config)],
    environments: {
      client: {
        build: {
          rolldownOptions: {
            output: {
              entryFileNames: `css/static/astro/docs.[hash].js`,
              chunkFileNames: 'css/static/astro/docs.[hash].js'
              // assetFileNames: 'css/static/astro/docs.[hash][extname]'
            }
          }
        }
      }
    },
    // Required for CSS files
    build: {
      rolldownOptions: {
        output: {
          assetFileNames: 'css/static/astro/docs.[hash][extname]'
        }
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          // Include the `scss` directory for resolving imports in the docs styles. The
          // integration adds the fallback `_chassis-tokens.scss`, `scss/vendor` of the package.
          loadPaths: [path.resolve(root, '../css/scss')],
          // Resolve `@chassis-ui/css/...` imports to the workspace package in `packages/css/`.
          // `@chassis-ui/docs` uses fully-qualified package paths
          // (e.g. `@chassis-ui/css/scss/mixins`).
          importers: [
            {
              findFileUrl(url: string) {
                if (!url.startsWith('@chassis-ui/css/')) return null
                const subPath = url.slice('@chassis-ui/css/'.length)
                const rootDir = path.resolve(root, '../css')
                return new URL('file://' + rootDir + '/' + subPath)
              }
            }
          ]
        }
      }
    }
  }
})
