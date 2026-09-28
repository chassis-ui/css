import fs from 'node:fs'
import path from 'node:path'
import { getConfig } from './config'
import { fileURLToPath } from 'node:url'

// The docs directory path relative to the working directory, `packages/site`.
export const docsDirectory = getConfig().docsDir

export function getDocsFsPath() {
  return path.join(process.cwd(), docsDirectory)
}

// The path of a file of the site as `file` and `filePath` of the docs components name it:
// relative to the `sourceDir` of `config.yml`
export function getDocsRelativePath(docsPath: string) {
  const sourceDirectory = path.join(process.cwd(), getConfig().sourceDir)

  return path.relative(sourceDirectory, path.join(getDocsFsPath(), docsPath))
}

export function getChassisAssetsFsPath() {
  return path.join(getDocsFsPath(), '../../vendor/assets/dist/web/docs', 'chassis')
}

export function getChassisTokensFsPath() {
  return path.join(getDocsFsPath(), 'node_modules/@chassis-ui/tokens/dist/web/docs', 'chassis')
}

// The package of the workspace, `packages/css`, not the link to it in `node_modules`: the dev
// server watches files in it, and reports their real paths
export function getChassisCSSFsPath() {
  return path.join(getDocsFsPath(), '../css/dist')
}

export function getChassisIconsFsPath() {
  return path.join(getDocsFsPath(), 'node_modules/@chassis-ui/icons')
}

export function getDocsStaticFsPath() {
  return path.join(getDocsFsPath(), 'static')
}

export function getDocsPublicFsPath() {
  return path.join(getDocsFsPath(), 'public')
}

// A list of all the docs paths that were generated during a build.
const generatedVersionedDocsPaths: string[] = []

export function getChassisDocsPath(docsPath: string): string {
  const sanitizedDocsPath = docsPath.replace(/^\//, '')

  if (import.meta.env.PROD) {
    generatedVersionedDocsPaths.push(sanitizedDocsPath)
  }

  return path.join(getConfig().docsPath, sanitizedDocsPath)
}

// Validate that all the generated versioned docs paths point to an existing page or asset.
// This is useful to catch typos in docs paths.
// Note: this function is only called during a production build.
// Note: this could at some point be refactored to use Astro list of generated `routes` accessible in the
// `astro:build:done` integration hook. Although as of 03/14/2023, this is not possible due to the route's data only
// containing information regarding the last page generated page for dynamic routes.
// @see https://github.com/withastro/astro/issues/5802
export function validateChassisDocsPaths(distUrl: URL) {
  for (const docsPath of generatedVersionedDocsPaths) {
    const sanitizedDocsPath = sanitizeChassisDocsPathForValidation(docsPath)
    const absoluteDocsPath = fileURLToPath(
      new URL(path.join('.', getConfig().docsPath, sanitizedDocsPath), distUrl)
    )
    const docsPathExists = fs.existsSync(absoluteDocsPath)

    if (!docsPathExists) {
      console.error(
        `A docs path was generated but does not point to a valid page or asset: '${docsPath}'.`
      )
    }
  }
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
