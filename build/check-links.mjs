#!/usr/bin/env node

/**
 * Checks links, so a moved page or a renamed file shows up before a reader finds it.
 *
 *   node build/check-links.mjs            the repository's Markdown files: relative paths,
 *                                         heading anchors and external URLs
 *   node build/check-links.mjs --offline  the same without the external URLs
 *   node build/check-links.mjs --site     the links of the built docs site (`_site/`) to its
 *                                         own pages and assets, anchors included
 *
 * `--root <directory>` checks the files of that directory instead of the repository's; the
 * tests of this script use it.
 *
 * Exits 1 and lists every broken link when one is found.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import GithubSlugger from 'github-slugger'

const { values: options } = parseArgs({
  options: {
    offline: { type: 'boolean', default: false },
    site: { type: 'boolean', default: false },
    root: { type: 'string' }
  }
})

const root = path.resolve(
  options.root ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
)

// Markdown files that readers open on GitHub or npm. Docs pages are checked through the
// built site instead, since their links are only resolved by the build.
const MARKDOWN_FILES = [
  'README.md',
  'AGENTS.md',
  'WRITING.md',
  'VERSIONING.md',
  'packages/css/README.md',
  'packages/css/js/tests/README.md',
  '.changeset/README.md',
  '.github/CONTRIBUTING.md',
  '.github/SECURITY.md',
  '.github/CODE_OF_CONDUCT.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.github/ISSUE_TEMPLATE/bug_report.md',
  '.github/ISSUE_TEMPLATE/feature_request.md'
]

// The part of chassis-ui.com that this repository builds. Links elsewhere on the domain
// belong to the sites of other repositories.
const SITE_DIR = '_site'
const SITE_BASE = '/css/'

// A file of this repository on GitHub, which the README of the package has to name by its URL
// because npm shows it outside the repository. Checked in the working tree: `main` gets a file
// that a change adds or moves only when the change is released.
const OWN_FILE_RE = /^https:\/\/github\.com\/chassis-ui\/css\/(?:blob|tree)\/main\/([^#?]+)/

const broken = []

function report(file, link, reason) {
  broken.push(`${file}: ${link} (${reason})`)
}

// Markdown ------------------------------------------------------------------

function stripCodeBlocks(markdown) {
  return markdown.replace(/^(```|~~~)[\s\S]*?^\1/gm, '')
}

function stripCode(markdown) {
  return stripCodeBlocks(markdown).replace(/`[^`\n]*`/g, '')
}

function markdownLinks(markdown) {
  const text = stripCode(markdown)
  const links = []
  for (const match of text.matchAll(/\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
    links.push(match[1])
  }

  for (const match of text.matchAll(/^\s*\[[^\]]+\]:\s*<?(\S+?)>?(?:\s|$)/gm)) {
    links.push(match[1])
  }

  return [...new Set(links)]
}

function markdownAnchors(markdown) {
  const slugger = new GithubSlugger()
  const anchors = new Set()
  for (const match of stripCodeBlocks(markdown).matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    anchors.add(slugger.slug(match[1].replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')))
  }

  return anchors
}

// npmjs.com answers scripts with 403. The registry has the same answer to "does the
// package exist" and does not block them.
function checkableUrl(url) {
  const npmPackage = url.match(/^https:\/\/www\.npmjs\.com\/package\/(.+?)\/?$/)
  return npmPackage ? `https://registry.npmjs.org/${npmPackage[1]}` : url
}

async function fetchStatus(url) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt++) {
    for (const method of ['HEAD', 'GET']) {
      try {
        const response = await fetch(checkableUrl(url), {
          method,
          redirect: 'follow',
          signal: AbortSignal.timeout(15_000),
          headers: { 'user-agent': 'chassis-css-link-check' }
        })
        if (response.ok) {
          return response.status
        }

        // Some servers refuse HEAD but answer GET; a 404 is final.
        lastError = response.status
        if (response.status === 404 || response.status === 410) {
          return response.status
        }
      } catch (error) {
        lastError = error.cause?.code ?? error.name
      }
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 1000 * attempt)
    })
  }

  return lastError
}

async function checkMarkdown({ offline }) {
  const external = new Map()

  for (const file of MARKDOWN_FILES) {
    const absolute = path.join(root, file)
    const markdown = readFileSync(absolute, 'utf8')

    for (const link of markdownLinks(markdown)) {
      const ownFile = OWN_FILE_RE.exec(link)
      if (ownFile) {
        if (!existsSync(path.join(root, decodeURI(ownFile[1])))) {
          report(file, link, 'no such file')
        }

        continue
      }

      if (/^https?:\/\//.test(link)) {
        if (!external.has(link)) {
          external.set(link, [])
        }

        external.get(link).push(file)
        continue
      }

      if (/^[a-z]+:/i.test(link)) {
        continue
      }

      const [target, anchor] = link.split('#')
      const targetFile = target ? path.resolve(path.dirname(absolute), decodeURI(target)) : absolute
      if (!existsSync(targetFile)) {
        report(file, link, 'no such file')
        continue
      }

      if (
        anchor &&
        targetFile.endsWith('.md') &&
        !markdownAnchors(readFileSync(targetFile, 'utf8')).has(anchor)
      ) {
        report(file, link, 'no such heading')
      }
    }
  }

  if (offline) {
    return
  }

  await Promise.all(
    [...external].map(async ([url, files]) => {
      const status = await fetchStatus(url)
      if (typeof status !== 'number' || status >= 400) {
        for (const file of files) {
          report(file, url, String(status))
        }
      }
    })
  )
}

// Built site ----------------------------------------------------------------

function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      return htmlFiles(entryPath)
    }

    return entry.name.endsWith('.html') ? [entryPath] : []
  })
}

function pageFile(siteDir, pathname) {
  const candidate = path.join(siteDir, decodeURIComponent(pathname))
  for (const file of [candidate, path.join(candidate, 'index.html'), `${candidate}.html`]) {
    if (existsSync(file) && statSync(file).isFile()) {
      return file
    }
  }

  return null
}

function pageIds(html) {
  const ids = new Set()
  for (const match of html.matchAll(/\s(?:id|name)="([^"]+)"/g)) {
    ids.add(match[1])
  }

  return ids
}

function checkSite() {
  const siteDir = path.join(root, SITE_DIR)
  if (!existsSync(path.join(siteDir, SITE_BASE))) {
    console.error(`${SITE_DIR}${SITE_BASE} does not exist. Run \`pnpm site:build\` first.`)
    process.exit(1)
  }

  const idCache = new Map()
  const idsOf = (file) => {
    if (!idCache.has(file)) {
      idCache.set(file, pageIds(readFileSync(file, 'utf8')))
    }

    return idCache.get(file)
  }

  for (const file of htmlFiles(path.join(siteDir, SITE_BASE))) {
    const html = readFileSync(file, 'utf8')
    const pageUrl = new URL(
      `https://site/${path.relative(siteDir, file).split(path.sep).join('/')}`
    )
    const relativeFile = path.relative(root, file)

    for (const match of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
      const link = match[1].replaceAll('&amp;', '&')
      if (/^[a-z]+:/i.test(link) || link.startsWith('//')) {
        continue
      }

      const url = new URL(link, pageUrl)
      if (!url.pathname.startsWith(SITE_BASE) && url.pathname !== SITE_BASE.slice(0, -1)) {
        continue
      }

      const target = pageFile(siteDir, url.pathname)
      if (!target) {
        report(relativeFile, link, 'no such page or file')
        continue
      }

      const anchor = decodeURIComponent(url.hash.slice(1))
      if (anchor && target.endsWith('.html') && !idsOf(target).has(anchor)) {
        report(relativeFile, link, 'no such anchor')
      }
    }
  }
}

if (options.site) {
  checkSite()
} else {
  await checkMarkdown({ offline: options.offline })
}

if (broken.length > 0) {
  console.error(`${broken.length} broken link${broken.length === 1 ? '' : 's'}:`)
  for (const line of broken.sort()) {
    console.error(`  ${line}`)
  }

  process.exit(1)
}

console.log(
  options.site
    ? `All links of ${SITE_DIR}${SITE_BASE} resolve.`
    : `All links of ${MARKDOWN_FILES.join(', ')} resolve.`
)
