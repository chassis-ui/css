import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { defineConfig } from 'astro/config'
import { chassis } from './src/libs/astro'
import { getConfig } from './src/libs/config'
import { remarkCxConfig, remarkCxDocsref } from './src/libs/remark'
import { chassisAutoImportPlugin } from './src/libs/shortcode'
import { getSiteUrl, getDocsMarkdownConfig } from '@chassis-ui/docs'
import { stackblitzPlugin } from './src/plugins/stackblitz-plugin'
const site = getSiteUrl(getConfig())

// https://astro.build/config
export default defineConfig({
  site,
  outDir: '../_site',
  build: {
    assets: `static/astro`
  },
  integrations: [chassis()],
  markdown: getDocsMarkdownConfig({
    anchors: getConfig().anchors,
    remarkPlugins: [chassisAutoImportPlugin(), remarkCxConfig, remarkCxDocsref]
  }),
  vite: {
    plugins: [stackblitzPlugin()],
    environments: {
      client: {
        build: {
          rolldownOptions: {
            external: ['@chassis-ui/css'],
            output: {
              paths: { '@chassis-ui/css': '/static/js/chassis.bundle.min.js' },
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
          loadPaths: [
            // Include the `scss` directory for resolving imports in the docs styles.
            path.resolve(fileURLToPath(import.meta.url), '../../scss'),
            // Framework fallback `_chassis-tokens.scss` if no override above.
            path.resolve(fileURLToPath(import.meta.url), '../../scss/vendor')
            // Include the root `node_modules` for resolving packages like `@chassis-ui/tokens`.
            // path.resolve(fileURLToPath(import.meta.url), '../../../node_modules')
          ],
          // Resolve `@chassis-ui/css/...` imports to the local `scss/` source tree.
          // `@chassis-ui/docs` uses fully-qualified package paths (e.g. `@chassis-ui/css/scss/mixins`)
          // but this repo IS `@chassis-ui/css` and won't install itself in node_modules.
          importers: [
            {
              findFileUrl(url: string) {
                if (!url.startsWith('@chassis-ui/css/')) return null
                const subPath = url.slice('@chassis-ui/css/'.length)
                const rootDir = path.resolve(fileURLToPath(import.meta.url), '../..')
                return new URL('file://' + rootDir + '/' + subPath)
              }
            }
          ]
        }
      }
    }
  }
})
