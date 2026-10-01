import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import type { AstroIntegration } from 'astro'
import {
  getChassisAssetsFsPath,
  getChassisCSSFsPath,
  getChassisIconsFsPath
} from '@chassis-ui/docs'
import type { ChassisConfig } from '@chassis-ui/docs/schema'

// A list of static file paths that will be aliased to a different path.
const staticFileAliases = {
  '/images/apple-touch-icon.png': '/apple-touch-icon.png',
  '/images/favicon.png': '/favicon.ico'
}

// A list of pages that will be excluded from the sitemap.
const sitemapExcludes = ['/404']

// The `dist` folder of the workspace package, `packages/css`, not the link to it in
// `node_modules`: the dev server watches files in it, and reports their real paths
const chassisCSSDir = '../css/dist'

/**
 * Returns the site's own Astro integrations, added after `chassisDocs()` of `@chassis-ui/docs`.
 */
export function chassis({
  config,
  root
}: {
  config: ChassisConfig
  root: string
}): AstroIntegration[] {
  const baseURL = config.baseURL.replace(/\/$/, '')
  const sitemapExcludedUrls = sitemapExcludes.map((url) => `${baseURL}${url}/`)
  const publicDir = path.join(root, 'public')
  const chassisCSS = getChassisCSSFsPath({ root, dir: chassisCSSDir })

  // `astro check` / `astro sync` doesn't need static assets copied into _site.
  // Track the command so the config:done hook can skip expensive file copies.
  let cmd = 'dev'
  let outDir = path.join(root, 'dist')

  const watchPairs: Array<[string, string]> = [
    [path.join(chassisCSS, 'css/chassis.css'), path.join(publicDir, 'static/css/chassis.css')],
    [path.join(chassisCSS, 'js/chassis.js'), path.join(publicDir, 'static/js/chassis.js')]
  ]

  return [
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
        'astro:config:setup': ({ addWatchFile, command, config: astroConfig }) => {
          cmd = command
          outDir = fileURLToPath(astroConfig.outDir)
          // Reload the config when the integration is modified.
          addWatchFile(path.join(root, 'src/libs/astro.ts'))
        },
        'astro:config:done': () => {
          if (cmd === 'sync') return
          cleanPublicDirectory(publicDir)
          copyStatic(path.join(root, 'static'), publicDir)
          copyChassisCSS(chassisCSS, publicDir)
          copyChassisAssets(root, publicDir)
          copyChassisIcons(root, publicDir)
          aliasStatic(root, publicDir)
          copyPagefindIndex(outDir, publicDir)
        }
      }
    },
    // https://github.com/withastro/astro/issues/6475
    mdx() as AstroIntegration,
    sitemap({
      filter: (page) => !sitemapExcludedUrls.includes(page)
    }),
    {
      // Must run after `@astrojs/sitemap` has written the sitemap.
      name: 'chassis-sitemap-postprocess',
      hooks: {
        'astro:build:done': ({ dir }) => {
          const builtDir = fileURLToPath(dir)

          removeRedirectsFromSitemap(builtDir)
          rebaseSitemapIndex(builtDir, baseURL)
        }
      }
    }
  ]
}

// Remove the redirect pages from the sitemap: the pages of `aliases` in the frontmatter, `/`
// and `/css/docs/`. `@astrojs/sitemap` lists every page that was built, and a redirect is not
// a page to index. Those outside `/css` do not exist on chassis-ui.com at all.
function removeRedirectsFromSitemap(builtDir: string) {
  const sitemaps = fs.readdirSync(builtDir).filter((file) => /^sitemap-\d+\.xml$/.test(file))

  for (const file of sitemaps) {
    const sitemapPath = path.join(builtDir, file)
    const content = fs.readFileSync(sitemapPath, 'utf8')

    const updated = content.replace(/<url><loc>([^<]+)<\/loc>.*?<\/url>/g, (entry, loc: string) => {
      const page = path.join(builtDir, decodeURIComponent(new URL(loc).pathname), 'index.html')
      const isRedirect =
        fs.existsSync(page) && fs.readFileSync(page, 'utf8').includes('<meta http-equiv="refresh"')

      return isRedirect ? '' : entry
    })

    fs.writeFileSync(sitemapPath, updated)
  }
}

// Rewrite the sitemaps listed in `sitemap-index.xml` to the URLs they are served from.
// `@astrojs/sitemap` lists them at the origin, `https://chassis-ui.com/sitemap-0.xml`, which is
// the sitemap of the main site. This site is proxied under the path of `baseURL`, so its own
// sitemap is `https://chassis-ui.com/css/sitemap-0.xml`.
function rebaseSitemapIndex(builtDir: string, baseURL: string) {
  const sitemapIndexPath = path.join(builtDir, 'sitemap-index.xml')
  if (!fs.existsSync(sitemapIndexPath)) return

  const origin = new URL(baseURL).origin
  const content = fs.readFileSync(sitemapIndexPath, 'utf8')

  fs.writeFileSync(
    sitemapIndexPath,
    content.replaceAll(`<loc>${origin}/sitemap-`, `<loc>${baseURL}/sitemap-`)
  )
}

// Copy the previously-generated Pagefind search index from `_site/css/pagefind/`
// into `packages/site/public/css/pagefind/` so `astro dev` can serve it at `/css/pagefind/`,
// matching the path prefix this site is proxied under in production.
// No-op if no build has been run yet; dev simply has no search results until then.
function copyPagefindIndex(outDir: string, publicDir: string) {
  const source = path.join(outDir, 'css', 'pagefind')
  if (!fs.existsSync(source)) return
  const destination = path.join(publicDir, 'css', 'pagefind')

  fs.mkdirSync(destination, { recursive: true })
  fs.cpSync(source, destination, { recursive: true })
}

function cleanPublicDirectory(dir: string) {
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

// Copy the `dist` folder of the workspace package, the latest build of Chassis CSS, to make it
// available from the `/static` URL.
function copyChassisCSS(source: string, publicDir: string) {
  const destination = path.join(publicDir, 'static')

  fs.mkdirSync(destination, { recursive: true })
  fs.cpSync(source, destination, { recursive: true })
}

function copyChassisAssets(root: string, publicDir: string) {
  const source = getChassisAssetsFsPath({ root })
  const destination = path.join(publicDir, 'static')

  fs.mkdirSync(destination, { recursive: true })
  fs.cpSync(source, destination, { recursive: true })
}

// Copy the `icons` folder of `@chassis-ui/icons` to make it available from the `/static/icons` URL.
function copyChassisIcons(root: string, publicDir: string) {
  const source = path.join(getChassisIconsFsPath({ root }), 'icons')
  const destination = path.join(publicDir, 'static', 'icons')

  fs.mkdirSync(destination, { recursive: true })
  fs.cpSync(source, destination, { recursive: true })
}

// Copy the content as-is of the `static` folder to make it available from the `/` URL.
function copyStatic(source: string, publicDir: string) {
  fs.mkdirSync(publicDir, { recursive: true })
  fs.cpSync(source, publicDir, { recursive: true })
}

// Alias (copy) some static files to different paths.
function aliasStatic(root: string, publicDir: string) {
  const source = getChassisAssetsFsPath({ root })

  for (const [aliasSource, aliasDestination] of Object.entries(staticFileAliases)) {
    fs.cpSync(path.join(source, aliasSource), path.join(publicDir, aliasDestination))
  }
}
