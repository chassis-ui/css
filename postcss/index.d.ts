/*!
 * Chassis CSS — PostCSS Preset, type declarations
 *
 * Written by hand for postcss/index.js, which is plain JavaScript. Keep the two in step:
 * js/tests/types/postcss.ts holds the calls these declarations must accept.
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import type { AcceptedPlugin, Plugin } from 'postcss'

export interface ChassisPrefixOptions {
  /**
   * The namespace of the custom properties: `--primary` becomes `--cx-primary`. Letters,
   * digits, `-` or `_`, starting with a letter and ending in `-` or `_`. An empty string
   * keeps the plain names, and is not allowed with `tailwind: true`.
   *
   * @default 'cx-'
   */
  prefix?: string
  /**
   * Set it when the CSS is the Tailwind entry point. Keeps the names that belong to Tailwind
   * as they are: the keys of `@theme` blocks, `--tw-*` and `--color-*`.
   *
   * @default false
   */
  tailwind?: boolean
}

/**
 * Several plugins as one entry of a PostCSS plugin list. PostCSS runs the plugins of
 * `plugins` in order.
 */
export interface ChassisPluginPack extends Plugin {
  plugins: AcceptedPlugin[]
}

/**
 * Merges the top-level `@layer` blocks that share a name into one block. The cascade is the
 * same; the output is smaller.
 */
export declare const mergeLayerBlocks: Plugin

/**
 * Adds the prefix to every custom property, and to every reference to one. Run it before
 * Tailwind's compiler.
 *
 * @throws {TypeError} When the prefix is not valid
 * @throws {Error} When the prefix is empty and `tailwind` is true
 */
export declare function chassisPrefix(options?: ChassisPrefixOptions): ChassisPluginPack

/**
 * The plugin list for a project's own PostCSS configuration: `chassisPrefix()` and
 * `mergeLayerBlocks`. It holds no Autoprefixer.
 */
export declare function chassisPostcss(options?: ChassisPrefixOptions): AcceptedPlugin[]
