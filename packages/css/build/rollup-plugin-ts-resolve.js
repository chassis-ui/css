import fs from 'node:fs'
import path from 'node:path'

// TypeScript sources under js/src use Node's `nodenext` module resolution, so
// relative imports keep a `.js` specifier even though the file on disk is
// `.ts` (e.g. `./base-component.js` resolving to `base-component.ts`).
// Rollup has no built-in extension aliasing, so resolve that case here —
// mirrors Bootstrap's `resolve.extensionAlias: { '.js': ['.ts', '.js'] }`.
export default function tsExtensionAlias() {
  return {
    name: 'ts-extension-alias',
    resolveId(source, importer) {
      if (!importer || !source.startsWith('.') || !source.endsWith('.js')) {
        return null
      }

      const resolvedJs = path.resolve(path.dirname(importer), source)

      if (fs.existsSync(resolvedJs)) {
        return null
      }

      const resolvedTs = resolvedJs.replace(/\.js$/, '.ts')

      return fs.existsSync(resolvedTs) ? resolvedTs : null
    }
  }
}
