import fs from 'node:fs'
import path from 'node:path'
import { getConfig } from './config'

// The docs directory path relative to the root of the project.
export const docsDirectory = getConfig().docsDir

// A list of all the docs paths that were generated during a build.
const generatedChassisDocsPaths: string[] = []

export function getChassisDocsPath(docsPath: string): string {
  const { docs_version } = getConfig()

  const sanitizedDocsPath = docsPath.replace(/^\//, '')

  if (import.meta.env.PROD) {
    generatedChassisDocsPaths.push(sanitizedDocsPath)
  }

  return `/docs/css/${sanitizedDocsPath}`
}

// Validate that all the generated versioned docs paths point to an existing page or asset.
// This is useful to catch typos in docs paths.
// Note: this function is only called during a production build.
// Note: this could at some point be refactored to use Astro list of generated `routes` accessible in the
// `astro:build:done` integration hook. Altho as of 03/14/2023, this is not possible due to the route's data only
// containing informations regarding the last page generated page for dynamic routes.
// @see https://github.com/withastro/astro/issues/5802
export function validateChassisDocsPaths(distUrl: URL) {
  const { docs_version } = getConfig()

  for (const docsPath of generatedChassisDocsPaths) {
    const sanitizedDocsPath = sanitizeChassisDocsPathForValidation(docsPath)
    const absoluteDocsPath = path.join(distUrl.pathname, 'docs', 'css', sanitizedDocsPath)

    const docsPathExists = fs.existsSync(absoluteDocsPath)

    if (!docsPathExists) {
      // throw new Error(`A versioned docs path was generated but does not point to a valid page or asset: '${docsPath}'.`)
      console.error(`A versioned docs path was generated but does not point to a valid page or asset: '${docsPath}'.`)
    }
  }
}

export function getDocsRelativePath(docsPath: string) {
  return path.join(docsDirectory, docsPath)
}

export function getChassisAssetsFsPath() {
  return path.join(process.cwd(), 'vendor/assets/dist/web/chassis-docs/')
}

export function getChassisTokensFsPath() {
  return path.join(process.cwd(), 'node_modules/@ozgurgunes/chassis-tokens/dist/tokens/web/chassis-docs')
}

export function getChassisIconsFsPath() {
  return path.join(process.cwd(), 'node_modules/@ozgurgunes/chassis-icons')
}

export function getDocsStaticFsPath() {
  return path.join(getDocsFsPath(), 'src/assets')
}

export function getDocsPublicFsPath() {
  return path.join(getDocsFsPath(), 'public')
}

export function getDocsFsPath() {
  return path.join(process.cwd(), docsDirectory)
}

function sanitizeChassisDocsPathForValidation(docsPath: string) {
  // Remove the hash part of the path if any.
  let sanitizedDocsPath = docsPath.split('#')[0]

  // Append the `index.html` part if the path doesn't have an extension.
  if (!sanitizedDocsPath.includes('.')) {
    sanitizedDocsPath = path.join(sanitizedDocsPath, 'index.html')
  }

  return sanitizedDocsPath
}
