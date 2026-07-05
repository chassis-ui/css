import fs from 'node:fs'
import path from 'node:path'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import type { AstroIntegration } from 'astro'
import { chassisBundlePlugin } from '@chassis-ui/docs'
import { getConfig } from './config'
import {
  getDocsFsPath,
  getChassisAssetsFsPath,
  getChassisCSSFsPath,
  getChassisIconsFsPath,
  getDocsPublicFsPath,
  getDocsStaticFsPath,
  validateChassisDocsPaths
} from './path'
import { chassisAutoImportIntegration } from './shortcode'

// A list of static file paths that will be aliased to a different path.
const staticFileAliases = {
  '/images/apple-touch-icon.png': '/apple-touch-icon.png',
  '/images/favicon.png': '/favicon.ico'
}

// A list of pages that will be excluded from the sitemap.
const sitemapExcludes = ['/404', '/docs']

export function chassis(): AstroIntegration[] {
  const config = getConfig()
  const sitemapExcludedUrls = sitemapExcludes.map((url) => `${config.baseURL}${url}/`)

  // `astro check` / `astro sync` doesn't need static assets copied into _site.
  // Track the command so the config:done hook can skip expensive file copies.
  let command = 'dev'

  const watchPairs: Array<[string, string]> = [
    [
      path.join(getDocsFsPath(), '../dist/css/chassis.css'),
      path.join(getDocsPublicFsPath(), 'static/css/chassis.css')
    ],
    [
      path.join(getDocsFsPath(), '../dist/js/chassis.js'),
      path.join(getDocsPublicFsPath(), 'static/js/chassis.js')
    ]
  ]

  return [
    chassisAutoImportIntegration(),
    {
      name: 'chassis-integration',
      hooks: {
        'astro:server:setup': ({ server }) => {
          if (server.config.mode !== 'development') {
            return
          }

          for (const [src] of watchPairs) {
            server.watcher.add(src)
          }

          server.watcher.on('change', (changedPath) => {
            const pair = watchPairs.find(([src]) => src === changedPath)
            if (!pair) return
            const [src, dest] = pair
            fs.mkdirSync(path.dirname(dest), { recursive: true })
            fs.copyFileSync(src, dest)
            server.ws.send({ type: 'full-reload' })
          })
        },
        'astro:config:setup': ({ addWatchFile, command: cmd, updateConfig }) => {
          command = cmd
          // Reload the config when these integration files are modified.
          addWatchFile(path.join(getDocsFsPath(), 'src/libs/astro.ts'))

          const { plugin, define } = chassisBundlePlugin(getChassisCSSFsPath)
          updateConfig({ vite: { plugins: [plugin], define } })
        },
        'astro:config:done': () => {
          if (command === 'sync') return
          cleanPublicDirectory()
          copyStatic()
          copyChassisCSS()
          copyChassisAssets()
          copyChassisIcons()
          aliasStatic()
          copyPagefindIndex()
        },
        'astro:build:done': ({ dir }) => {
          validateChassisDocsPaths(dir)
        }
      }
    },
    // https://github.com/withastro/astro/issues/6475
    mdx() as AstroIntegration,
    sitemap({
      filter: (page) => !sitemapExcludedUrls.includes(page)
    })
  ]
}

// Copy the previously-generated Pagefind search index from `_site/pagefind/`
// into `site/public/pagefind/` so `astro dev` can serve it at `/pagefind/`.
// No-op if no build has been run yet; dev simply has no search results until then.
function copyPagefindIndex() {
  const source = path.join(process.cwd(), '_site', 'pagefind')
  if (!fs.existsSync(source)) return
  const destination = path.join(getDocsPublicFsPath(), 'pagefind')

  fs.mkdirSync(destination, { recursive: true })
  fs.cpSync(source, destination, { recursive: true })
}

function cleanPublicDirectory() {
  const dir = getDocsPublicFsPath()
  if (!fs.existsSync(dir)) return
  // Delete contents rather than the directory itself to avoid ENOTEMPTY on the root public dir.
  for (const entry of fs.readdirSync(dir)) {
    const entryPath = path.join(dir, entry)
    try {
      fs.rmSync(entryPath, { force: true, recursive: true })
    } catch {
      // ignore
    }
  }
}

// Copy the `dist` folder from the root of the repo containing the latest version of Chassis to make it available from
// the `/docs/${docs_version}/dist` URL.
function copyChassisCSS() {
  const source = getChassisCSSFsPath()
  const destination = path.join(getDocsPublicFsPath(), 'static')

  fs.mkdirSync(destination, { recursive: true })
  fs.cpSync(source, destination, { recursive: true })
}

function copyChassisAssets() {
  const source = getChassisAssetsFsPath()
  const destination = path.join(getDocsPublicFsPath(), 'static')

  fs.mkdirSync(destination, { recursive: true })
  fs.cpSync(source, destination, { recursive: true })
}

// Copy the `icons` folder from the chassis-tokens repo to make it available from the `/icons` URL.
function copyChassisIcons() {
  const source = path.join(getChassisIconsFsPath(), 'icons')
  const destination = path.join(getDocsPublicFsPath(), 'static', 'icons')

  fs.mkdirSync(destination, { recursive: true })
  fs.cpSync(source, destination, { recursive: true })
}

// Copy the content as-is of the `static` folder to make it available from the `/` URL.
function copyStatic() {
  const source = getDocsStaticFsPath()
  const destination = getDocsPublicFsPath()

  fs.cpSync(source, destination, { recursive: true })
}

// Alias (copy) some static files to different paths.
function aliasStatic() {
  const source = getChassisAssetsFsPath()
  const destination = getDocsPublicFsPath()

  for (const [aliasSource, aliasDestination] of Object.entries(staticFileAliases)) {
    fs.cpSync(path.join(source, aliasSource), path.join(destination, aliasDestination))
  }
}
