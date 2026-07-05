#!/usr/bin/env node

/*!
 * check-imports.js — detect unused and unresolvable SCSS @use statements.
 *
 * Copyright 2025-2026 Ozgur Gunes
 * Licensed under MIT
 *
 * Suppression comments (placed in SCSS source):
 *   // check-imports-disable           — in leading comment block, disables whole file
 *   // check-imports-disable-next-line — on the line immediately before a @use
 *   // check-imports-disable-line      — at the end of a @use line
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'

// Use a regex so 'disable' doesn't accidentally match 'disable-next-line' or 'disable-line'
const DISABLE_FILE_RE = /\bcheck-imports-disable\b(?!-)/
const DISABLE_NEXT_LINE = 'check-imports-disable-next-line'
const DISABLE_LINE = 'check-imports-disable-line'

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

function findScssFiles(dirs) {
  const files = []
  for (const dir of dirs) {
    const resolved = path.resolve(dir)
    if (!existsSync(resolved)) {
      throw new Error(`Directory does not exist: ${dir}`)
    }

    walkDir(resolved, files)
  }

  return files.sort()
}

function walkDir(dir, acc) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkDir(full, acc)
    } else if (entry.name.endsWith('.scss')) {
      acc.push(full)
    }
  }
}

// ---------------------------------------------------------------------------
// Comment-aware content stripping
// ---------------------------------------------------------------------------

/**
 * Strip block and line comments, preserving newlines for correct line numbers.
 * Handles quoted strings so "//" inside url("...") is not treated as a comment.
 */
function stripBodyComments(content) {
  const out = []
  let i = 0
  const n = content.length

  while (i < n) {
    const ch = content[i]

    // Block comment /* ... */
    if (ch === '/' && content[i + 1] === '*') {
      const end = content.indexOf('*/', i + 2)
      const raw = end === -1 ? content.slice(i) : content.slice(i, end + 2)
      out.push(raw.replace(/[^\n]/g, ' '))
      i = end === -1 ? n : end + 2
      continue
    }

    // Quoted string — preserve verbatim so "//" inside doesn't trigger comment stripping
    if (ch === '"' || ch === "'") {
      const q = ch
      out.push(q)
      i++
      while (i < n && content[i] !== q) {
        if (content[i] === '\\') {
          out.push(content[i++])
        }

        if (i < n) {
          out.push(content[i++])
        }
      }

      if (i < n) {
        out.push(content[i++]) // closing quote
      }

      continue
    }

    // Line comment // — replace up to (but not including) the newline with spaces
    if (ch === '/' && content[i + 1] === '/') {
      const end = content.indexOf('\n', i)
      if (end === -1) {
        i = n
      } else {
        out.push(' '.repeat(end - i))
        i = end
      }

      continue
    }

    out.push(ch)
    i++
  }

  return out.join('')
}

// ---------------------------------------------------------------------------
// Parse @use statements
// ---------------------------------------------------------------------------

/**
 * Parse all @use statements from file content.
 * Skips multi-line `with (...)` configuration blocks entirely.
 *
 * @returns {Array<{lineNum, modulePath, namespace, isGlob, isBuiltin, disabled}>|null}
 *   Returns null if a file-level disable comment is found.
 */
function parseUseStatements(content) {
  const lines = content.split('\n')

  // Check for file-level disable in leading comment block
  for (const line of lines) {
    const t = line.trim()
    if (t === '' || t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) {
      if (DISABLE_FILE_RE.test(t)) {
        return null // file-level disable — skip all checks for this file
      }

      continue
    }

    break
  }

  const uses = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip @use ... with (...) blocks (single- or multi-line)
    if (trimmed.startsWith('@use ') && /\bwith\s*\(/.test(trimmed)) {
      let depth = 0
      while (i < lines.length) {
        for (const c of lines[i]) {
          if (c === '(') {
            depth++
          } else if (c === ')') {
            if (--depth === 0) {
              break
            }
          }
        }

        i++
        if (depth === 0) {
          break
        }
      }

      continue
    }

    if (trimmed.startsWith('@use ')) {
      const disabled =
        line.includes(DISABLE_LINE) || (i > 0 && lines[i - 1].trim().includes(DISABLE_NEXT_LINE))

      const match = trimmed.match(/^@use\s+["']([^"']+)["'](?:\s+as\s+(\*|[\w-]+))?/)
      if (match) {
        const modulePath = match[1]
        const asClause = match[2]

        let namespace
        let isGlob

        if (asClause === '*') {
          isGlob = true
          namespace = '*'
        } else if (asClause) {
          isGlob = false
          namespace = asClause
        } else {
          isGlob = false
          // Default namespace: sass: builtins use the name after ':', paths use the last segment
          if (modulePath.startsWith('sass:')) {
            namespace = modulePath.slice(5) // 'sass:map' → 'map'
          } else {
            const seg = modulePath.split('/').at(-1)
            namespace = seg.replace(/^_/, '').replace(/\.scss$/, '')
          }
        }

        uses.push({
          lineNum: i + 1,
          modulePath,
          namespace,
          isGlob,
          isBuiltin: modulePath.startsWith('sass:'),
          disabled
        })
      }
    }

    i++
  }

  return uses
}

// ---------------------------------------------------------------------------
// Module resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a @use/@forward module path to an absolute file path.
 *
 * Returns:
 *   string  — resolved absolute path (file exists)
 *   null    — skip: sass: builtin, or bare specifier not found locally
 *             (may exist via a Sass loadPath; can't validate without knowing loadPaths)
 *   false   — relative path (starts with ./) that should exist but doesn't → unresolvable error
 */
function resolveModule(modulePath, fromFile) {
  if (modulePath.startsWith('sass:')) {
    return null
  }

  const fromDir = path.dirname(fromFile)
  const isRelative = modulePath.startsWith('.') || path.isAbsolute(modulePath)

  const target = path.resolve(fromDir, modulePath)
  const dir = path.dirname(target)
  const base = path.basename(target)

  const candidates = [
    path.join(dir, `_${base}.scss`),
    `${target}.scss`,
    path.join(target, '_index.scss'),
    path.join(target, 'index.scss'),
    target // exact path (already has extension)
  ]

  for (const c of candidates) {
    if (existsSync(c)) {
      return c
    }
  }

  // Relative path specified but no file found on disk — definite error
  if (isRelative) {
    return false
  }

  // Bare specifier not found in the local directory — may be resolved via a Sass loadPath;
  // we can't validate without knowing the load paths, so skip conservatively.
  return null
}

// ---------------------------------------------------------------------------
// Module export introspection
// ---------------------------------------------------------------------------

const exportCache = new Map()

/**
 * Collect all symbols exported by a SCSS file, following @forward chains.
 * Respects `show` and `hide` filters on @forward statements.
 *
 * @returns {{ variables: Set<string>, mixins: Set<string>, functions: Set<string> }}
 */
function getModuleExports(filePath) {
  if (!filePath || !existsSync(filePath)) {
    return { variables: new Set(), mixins: new Set(), functions: new Set() }
  }

  const real = path.resolve(filePath)
  if (exportCache.has(real)) {
    return exportCache.get(real)
  }

  const exports = { variables: new Set(), mixins: new Set(), functions: new Set() }
  exportCache.set(real, exports) // register before recursing to handle circular refs

  const content = readFileSync(real, 'utf8')
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (t.startsWith('//') || t.startsWith('*')) {
      continue
    }

    const v = t.match(/^\$([a-zA-Z][\w-]*)\s*:/)
    if (v) {
      exports.variables.add(v[1])
    }

    const m = t.match(/^@mixin\s+([a-zA-Z][\w-]*)/)
    if (m) {
      exports.mixins.add(m[1])
    }

    const f = t.match(/^@function\s+([a-zA-Z][\w-]*)/)
    if (f) {
      exports.functions.add(f[1])
    }

    // Follow @forward, respecting show/hide filters
    const fwd = t.match(/^@forward\s+["']([^"']+)["'](.*?)(?:;|$)/)
    if (fwd) {
      const resolved = resolveModule(fwd[1], real)
      if (!resolved) {
        continue
      }

      const sub = getModuleExports(resolved)
      const rest = fwd[2]
      const showM = rest.match(/\bshow\s+([\w$,\s-]+)/)
      const hideM = rest.match(/\bhide\s+([\w$,\s-]+)/)

      if (showM) {
        const shown = parseNameList(showM[1])
        for (const n of shown.variables) {
          if (sub.variables.has(n)) {
            exports.variables.add(n)
          }
        }

        for (const n of shown.mixins) {
          if (sub.mixins.has(n)) {
            exports.mixins.add(n)
          }
        }

        for (const n of shown.functions) {
          if (sub.functions.has(n)) {
            exports.functions.add(n)
          }
        }
      } else if (hideM) {
        const hidden = parseNameList(hideM[1])
        for (const n of sub.variables) {
          if (!hidden.variables.has(n)) {
            exports.variables.add(n)
          }
        }

        for (const n of sub.mixins) {
          if (!hidden.mixins.has(n)) {
            exports.mixins.add(n)
          }
        }

        for (const n of sub.functions) {
          if (!hidden.functions.has(n)) {
            exports.functions.add(n)
          }
        }
      } else {
        for (const n of sub.variables) {
          exports.variables.add(n)
        }

        for (const n of sub.mixins) {
          exports.mixins.add(n)
        }

        for (const n of sub.functions) {
          exports.functions.add(n)
        }
      }
    }
  }

  return exports
}

/**
 * Parse a comma-separated show/hide name list into variable/mixin/function sets.
 * Variables are prefixed with $; mixins and functions share the same identifier space.
 */
function parseNameList(str) {
  const variables = new Set()
  const mixins = new Set()
  const functions = new Set()

  for (const raw of str.split(',')) {
    const name = raw.trim()
    if (!name) {
      continue
    }

    if (name.startsWith('$')) {
      variables.add(name.slice(1))
    } else {
      // Sass doesn't distinguish mixin vs function names in show/hide,
      // so add to both sets — the has() check in the caller resolves it.
      mixins.add(name)
      functions.add(name)
    }
  }

  return { variables, mixins, functions }
}

// ---------------------------------------------------------------------------
// Body extraction
// ---------------------------------------------------------------------------

/**
 * Return the effective body for usage analysis:
 * strips @use/@forward declarations (including multi-line with() blocks)
 * and all comments, while preserving newlines for accurate line references.
 */
function getBody(content) {
  const noComments = stripBodyComments(content)
  const lines = noComments.split('\n')
  const out = []
  let i = 0

  while (i < lines.length) {
    const trimmed = lines[i].trim()

    if (trimmed.startsWith('@forward ')) {
      out.push('')
      i++
      continue
    }

    if (trimmed.startsWith('@use ')) {
      if (/\bwith\s*\(/.test(trimmed)) {
        // consume all lines of the multi-line with() block
        let depth = 0
        while (i < lines.length) {
          for (const c of lines[i]) {
            if (c === '(') {
              depth++
            } else if (c === ')') {
              if (--depth === 0) {
                break
              }
            }
          }

          out.push('')
          i++
          if (depth === 0) {
            break
          }
        }
      } else {
        out.push('')
        i++
      }

      continue
    }

    out.push(lines[i])
    i++
  }

  return out.join('\n')
}

// ---------------------------------------------------------------------------
// Usage detection
// ---------------------------------------------------------------------------

function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Test whether `namespace.something` appears in the body text. */
function isNamespaceUsed(namespace, body) {
  return new RegExp(`(?<![\\w$-])${esc(namespace)}\\.`).test(body)
}

/**
 * Extract function/mixin names from meta.get-function("name") and
 * meta.get-mixin("name") calls where the name is a string literal.
 * These are static references that bypass normal call-site detection.
 */
function getMetaStringRefs(body) {
  const names = new Set()
  for (const m of body.matchAll(/meta\.get-(?:function|mixin)\s*\(\s*["']([^"']+)["']/g)) {
    names.add(m[1])
  }

  return names
}

/**
 * Test whether any symbol from a glob-imported module is used in the body.
 * Detects: variable references, @include calls, direct function calls,
 * and meta.get-function/meta.get-mixin string-literal references.
 */
function isGlobImportUsed(moduleExports, body) {
  for (const name of moduleExports.variables) {
    if (new RegExp(`\\$${esc(name)}(?![\\w-])`).test(body)) {
      return true
    }
  }

  for (const name of moduleExports.mixins) {
    if (new RegExp(`@include\\s+${esc(name)}(?![\\w.-])`).test(body)) {
      return true
    }
  }

  for (const name of moduleExports.functions) {
    if (new RegExp(`(?<![\\w-])${esc(name)}\\s*\\(`).test(body)) {
      return true
    }
  }

  // Also detect meta.get-function("name") / meta.get-mixin("name") literal string refs —
  // these are runtime lookups that bypass the normal function-call syntax.
  const metaRefs = getMetaStringRefs(body)
  for (const name of moduleExports.functions) {
    if (metaRefs.has(name)) {
      return true
    }
  }

  for (const name of moduleExports.mixins) {
    if (metaRefs.has(name)) {
      return true
    }
  }

  return false
}

// ---------------------------------------------------------------------------
// Missing import detection
// ---------------------------------------------------------------------------

/**
 * Extract locally-defined functions and mixins from the file's raw content.
 * These are always in scope and never require an import.
 */
function getLocalSymbols(content) {
  const mixins = new Set()
  const functions = new Set()
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (t.startsWith('//') || t.startsWith('*')) continue
    const m = t.match(/^@mixin\s+([a-zA-Z][\w-]*)/)
    if (m) mixins.add(m[1])
    const f = t.match(/^@function\s+([a-zA-Z][\w-]*)/)
    if (f) functions.add(f[1])
  }

  return { mixins, functions }
}

/**
 * Build a project-wide index mapping each function and mixin name to the
 * SCSS files where it is directly defined (via @function / @mixin).
 * Built once per run in main() and passed to checkFile().
 *
 * @param {string[]} allFiles
 * @returns {{ mixins: Map<string, string[]>, functions: Map<string, string[]> }}
 */
function buildSymbolIndex(allFiles) {
  const mixins = new Map()
  const functions = new Map()
  for (const file of allFiles) {
    const content = readFileSync(file, 'utf8')
    for (const line of content.split('\n')) {
      const t = line.trim()
      if (t.startsWith('//') || t.startsWith('*')) continue
      const m = t.match(/^@mixin\s+([a-zA-Z][\w-]*)/)
      if (m) {
        if (!mixins.has(m[1])) mixins.set(m[1], [])
        mixins.get(m[1]).push(file)
      }

      const f = t.match(/^@function\s+([a-zA-Z][\w-]*)/)
      if (f) {
        if (!functions.has(f[1])) functions.set(f[1], [])
        functions.get(f[1]).push(file)
      }
    }
  }

  return { mixins, functions }
}

/**
 * Union of all functions and mixins exported by the file's current glob imports.
 * Used to determine which symbols are already in scope without further imports.
 */
function getGlobAvailableSymbols(file, uses) {
  const mixins = new Set()
  const functions = new Set()
  for (const use of uses) {
    if (!use.isGlob || use.disabled) continue
    const resolved = resolveModule(use.modulePath, file)
    if (!resolved) continue
    const exp = getModuleExports(resolved)
    for (const n of exp.mixins) mixins.add(n)
    for (const n of exp.functions) functions.add(n)
  }

  return { mixins, functions }
}

/**
 * Extract all unqualified function calls and @include references from the body,
 * mapped to the first line number (1-based) where each appears.
 *
 * "Unqualified" means the name is not preceded by a namespace dot, so
 * `map.get(` is excluded but `escape-svg(` is included.
 *
 * @param {string} body - Comment-stripped, @use/@forward-stripped body text
 * @returns {{ functions: Map<string, number>, mixins: Map<string, number> }}
 */
function extractUnqualifiedRefs(body) {
  const functions = new Map()
  const mixins = new Map()
  const lines = body.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNum = i + 1

    // Unqualified function calls: name( not preceded by a namespace dot or $
    for (const m of line.matchAll(/(?<![.$\w-])([a-zA-Z][\w-]+)\s*\(/g)) {
      if (!functions.has(m[1])) functions.set(m[1], lineNum)
    }

    // @include name — unqualified only (exclude namespace.name)
    const inc = line.match(/@include\s+([a-zA-Z][\w-]*)(?!\.)/)
    if (inc && !mixins.has(inc[1])) mixins.set(inc[1], lineNum)
  }

  return { functions, mixins }
}

// ---------------------------------------------------------------------------
// Per-file analysis
// ---------------------------------------------------------------------------

/**
 * @param {string} file
 * @param {{ mixins: Map<string, string[]>, functions: Map<string, string[]> }} symbolIndex
 * @returns {{ unused: Array<{line, path}>, unresolvable: Array<{line, path}>, missing: Array<{line, type, name, hint}> }}
 */
function checkFile(file, symbolIndex) {
  const content = readFileSync(file, 'utf8')
  const uses = parseUseStatements(content)
  const unused = []
  const unresolvable = []
  const missing = []

  // null means the file has a file-level disable comment — skip all checks
  if (uses === null) {
    return { unused, unresolvable, missing }
  }

  const body = getBody(content)

  for (const use of uses) {
    if (use.disabled) {
      continue
    }

    // --- Check: unresolvable path ---
    if (!use.isBuiltin) {
      const resolved = resolveModule(use.modulePath, file)
      if (resolved === false) {
        unresolvable.push({ line: use.lineNum, path: use.modulePath })
        continue // can't check usage if the file doesn't exist
      }
    }

    // --- Check: unused import ---
    let isUsed

    if (!use.isGlob) {
      // Namespaced import (including sass: builtins): look for `namespace.` in body
      isUsed = isNamespaceUsed(use.namespace, body)
    } else {
      // Glob import (@use "..." as *): check if any exported symbol is referenced
      const resolved = resolveModule(use.modulePath, file)
      if (resolved === null) {
        // Bare specifier resolved via loadPaths — can't introspect, skip conservatively
        continue
      }

      const moduleExports = getModuleExports(resolved)
      const hasExports =
        moduleExports.variables.size > 0 ||
        moduleExports.mixins.size > 0 ||
        moduleExports.functions.size > 0

      // Side-effect-only module (generates CSS, no exported symbols) — never flag as unused
      if (!hasExports) {
        continue
      }

      isUsed = isGlobImportUsed(moduleExports, body)
    }

    if (!isUsed) {
      unused.push({ line: use.lineNum, path: use.modulePath })
    }
  }

  // --- Check: missing imports ---
  // Detect function calls and @include references that aren't covered by any
  // current import. Only reports symbols positively identified in the project's
  // SCSS source — prevents false positives for CSS built-ins and externals.
  const local = getLocalSymbols(content)
  const globAvail = getGlobAvailableSymbols(file, uses)
  const refs = extractUnqualifiedRefs(body)
  const selfPath = path.resolve(file)

  for (const [name, lineNum] of refs.functions) {
    if (local.functions.has(name) || globAvail.functions.has(name)) continue
    const sources = symbolIndex.functions.get(name)
    if (!sources) continue
    const external = sources.filter((f) => path.resolve(f) !== selfPath)
    if (external.length > 0) {
      missing.push({
        line: lineNum,
        type: 'function',
        name,
        hint: path.relative(process.cwd(), external[0])
      })
    }
  }

  for (const [name, lineNum] of refs.mixins) {
    if (local.mixins.has(name) || globAvail.mixins.has(name)) continue
    const sources = symbolIndex.mixins.get(name)
    if (!sources) continue
    const external = sources.filter((f) => path.resolve(f) !== selfPath)
    if (external.length > 0) {
      missing.push({
        line: lineNum,
        type: 'mixin',
        name,
        hint: path.relative(process.cwd(), external[0])
      })
    }
  }

  return { unused, unresolvable, missing }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('Usage: node build/check-imports.js <dir1> [dir2] ...')
    process.exit(2)
  }

  let files
  try {
    files = findScssFiles(args)
  } catch (error) {
    console.error(error.message)
    process.exit(2)
  }

  const symbolIndex = buildSymbolIndex(files)

  let unusedCount = 0
  let unresolvableCount = 0
  let missingCount = 0

  for (const file of files) {
    const { unused, unresolvable, missing } = checkFile(file, symbolIndex)
    const rel = path.relative(process.cwd(), file)

    for (const issue of unresolvable) {
      console.log(`${rel}:${issue.line}\tUnresolvable @use "${issue.path}"`)
      unresolvableCount++
    }

    for (const issue of unused) {
      console.log(`${rel}:${issue.line}\tUnused @use "${issue.path}"`)
      unusedCount++
    }

    for (const issue of missing) {
      console.log(
        `${rel}:${issue.line}\tMissing import for ${issue.type} '${issue.name}' (defined in ${issue.hint})`
      )
      missingCount++
    }
  }

  const total = unusedCount + unresolvableCount + missingCount
  if (total > 0) {
    const parts = []
    if (unresolvableCount > 0) parts.push(`${unresolvableCount} unresolvable`)
    if (unusedCount > 0) parts.push(`${unusedCount} unused`)
    if (missingCount > 0) parts.push(`${missingCount} missing`)
    console.log(`\nFound ${parts.join(', ')} import issue${total === 1 ? '' : 's'}`)
    process.exit(1)
  }
}

main()
