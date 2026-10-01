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
    assets: `static/astro`
  },
  integrations: [chassisDocs({ config }), ...chassis({ config, root })],
  vite: {
    plugins: [stackblitzPlugin(config)],
    environments: {
      client: {
        build: {
          rolldownOptions: {
            output: {
              entryFileNames: `static/astro/docs.[hash].js`,
              chunkFileNames: 'static/astro/docs.[hash].js'
              // assetFileNames: 'static/astro/docs.[hash][extname]'
            }
          }
        }
      }
    },
    // Required for CSS files
    build: {
      rolldownOptions: {
        output: {
          assetFileNames: 'static/astro/docs.[hash][extname]'
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
