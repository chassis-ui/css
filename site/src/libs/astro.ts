import fs from 'node:fs'
import path from 'node:path'
import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import type { AstroIntegration } from 'astro'
import autoImport from 'astro-auto-import'
import type { Element } from 'hast'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import { getConfig } from './config'
import { configurePrism } from './prism'
import { rehypeCxTable } from '@chassis-ui/docs'
import { remarkCxConfig, remarkCxDocsref } from './remark'
import {
  getDocsFsPath,
  getChassisAssetsFsPath,
  getChassisCSSFsPath,
  getChassisIconsFsPath,
  getDocsPublicFsPath,
  getDocsStaticFsPath,
  validateChassisDocsPaths
} from './path'
import chassisAutoImport from './shortcode'

// A list of static file paths that will be aliased to a different path.
const staticFileAliases = {
  '/images/apple-touch-icon.png': '/apple-touch-icon.png',
  '/images/favicon.png': '/favicon.ico'
}

// A list of pages that will be excluded from the sitemap.
const sitemapExcludes = ['/404', '/docs']

const headingsRangeRegex = new RegExp(`^h[${getConfig().anchors.min}-${getConfig().anchors.max}]$`)

export function chassis(): AstroIntegration[] {
  const sitemapExcludedUrls = sitemapExcludes.map((url) => `${getConfig().baseURL}${url}/`)
  configurePrism()

  return [
    chassisAutoImport(),
    {
      name: 'chassis-integration',
      hooks: {
        'astro:server:setup': ({ server }) => {
          if (server.config.mode !== 'development') {
            return
          }
          server.watcher.add(path.join(getDocsFsPath(), '../dist/css/chassis.css'))
          server.watcher.add(path.join(getDocsFsPath(), '../dist/js/chassis.js'))
        },
        'astro:config:setup': ({ command, addWatchFile, updateConfig }) => {
          // Reload the config when the integration is modified.
          addWatchFile(path.join(getDocsFsPath(), 'src/libs/astro.ts'))

          if (command === 'dev') {
            addWatchFile(path.join(getDocsFsPath(), '../dist/css/chassis.css'))
            addWatchFile(path.join(getDocsFsPath(), '../dist/js/chassis.js'))
          }

          // Add the remark and rehype plugins.
          updateConfig({
            markdown: {
              rehypePlugins: [
                rehypeHeadingIds,
                [
                  rehypeAutolinkHeadings,
                  {
                    behavior: 'append',
                    content: [{ type: 'text', value: ' ' }],
                    properties: { class: 'anchor-link' },
                    test: (element: Element) => element.tagName.match(headingsRangeRegex)
                  }
                ],
                rehypeCxTable
              ],
              remarkPlugins: [remarkCxConfig, remarkCxDocsref]
            }
          })
        },
        'astro:config:done': () => {
          cleanPublicDirectory()
          copyStatic()
          copyChassisCSS()
          copyChassisAssets()
          copyChassisIcons()
          aliasStatic()
        },
        'astro:build:done': ({ dir }) => {
          validateChassisDocsPaths(dir)
        }
      }
    },
    // https://github.com/withastro/astro/issues/6475
    mdx() as AstroIntegration,
    sitemap({
      filter: (page) => sitemapFilter(page, sitemapExcludedUrls)
    })
  ]
}

function cleanPublicDirectory() {
  fs.rmSync(getDocsPublicFsPath(), { force: true, recursive: true })
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
  const font_source = path.join(getChassisIconsFsPath(), 'font')
  const destination = path.join(getDocsPublicFsPath(), 'static', 'icons')

  fs.mkdirSync(destination, { recursive: true })
  fs.cpSync(font_source, destination, { recursive: true })
}

// Copy the content as-is of the `static` folder to make it available from the `/` URL.
// A folder named `[version]` will automatically be renamed to the current version of the docs extracted from the
// `config.yml` file.
function copyStatic() {
  const source = getDocsStaticFsPath()
  const destination = path.join(getDocsPublicFsPath())

  copyStaticRecursively(source, destination)
}

// Alias (copy) some static files to different paths.
function aliasStatic() {
  const source = getChassisAssetsFsPath()
  const destination = path.join(getDocsPublicFsPath())

  for (const [aliasSource, aliasDestination] of Object.entries(staticFileAliases)) {
    fs.cpSync(path.join(source, aliasSource), path.join(destination, aliasDestination))
  }
}

// See `copyStatic()` for more details.
function copyStaticRecursively(source: string, destination: string) {
  const entries = fs.readdirSync(source, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isFile()) {
      fs.cpSync(path.join(source, entry.name), path.join(destination, entry.name))
    } else if (entry.isDirectory()) {
      ;(fs.mkdirSync(path.join(destination, entry.name)), { recursive: true })

      copyStaticRecursively(path.join(source, entry.name), path.join(destination, entry.name))
    }
  }
}

function sitemapFilter(page: string, excludedUrls: string[]) {
  if (excludedUrls.includes(page)) {
    return false
  }

  return true
}
