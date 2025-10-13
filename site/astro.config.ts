import os from 'os'
import { defineConfig } from 'astro/config'
import { chassis } from './src/libs/astro'
import { getConfig } from './src/libs/config'
import { algoliaPlugin } from './src/plugins/algolia-plugin'
import { stackblitzPlugin } from './src/plugins/stackblitz-plugin'

function getLocalIp() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'localhost'
}
const hasHostFlag = process.argv.includes('--host')
const isDev = process.env.NODE_ENV === 'development'

const site = isDev
  ? hasHostFlag
    ? `http://${getLocalIp()}:4321`
    : 'http://localhost:4321'
  : process.env.VERCEL_ENV === 'production'
    ? // For production, use the baseURL from config (handles custom domains)
      getConfig().baseURL
    : process.env.VERCEL_URL !== undefined
      ? // For Vercel previews/deployments, use the VERCEL_URL
        `https://${process.env.VERCEL_URL}`
      : // Otherwise, use the baseURL value defined in the config.yml file
        getConfig().baseURL

// https://astro.build/config
export default defineConfig({
  outDir: '../_site',
  build: {
    assets: `assets`
  },
  integrations: [chassis()],
  markdown: {
    smartypants: false,
    syntaxHighlight: 'prism'
  },
  site,
  vite: {
    plugins: [algoliaPlugin(), stackblitzPlugin()],
    build: {
      rollupOptions: {
        output: {
          // chunkFileNames: 'assets/js/[name].[hash].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              return 'assets/css-docs/docs.[hash].css'
            }
            return 'assets/css-docs/[name].[hash][extname]'
          }
        }
      }
    }
  }
})
