/**
 * --------------------------------------------------------------------------
 * Chassis CSS type-level tests of the PostCSS preset
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 * Compile-time assertions for `@chassis-ui/css/postcss`, whose declarations in
 * postcss/index.d.ts are written by hand. This file is only type-checked
 * (`pnpm js:typecheck`); it is never executed or bundled.
 */

import postcss, { type AcceptedPlugin } from 'postcss'
import { chassisPostcss, chassisPrefix, mergeLayerBlocks } from '../../../postcss/index.js'

// Every option is optional, and so is the options object
const defaults: AcceptedPlugin = chassisPrefix()
const renamed: AcceptedPlugin = chassisPrefix({ prefix: 'acme-' })
const forTailwind: AcceptedPlugin = chassisPrefix({ prefix: 'acme-', tailwind: true })
const plain: AcceptedPlugin = chassisPrefix({ prefix: '' })

// The preset is a plugin list; a project adds its own plugins to it
const preset: AcceptedPlugin[] = [...chassisPostcss({ tailwind: true }), mergeLayerBlocks]

// PostCSS takes all of them as they are
postcss([defaults, renamed, forTailwind, plain, ...preset, ...chassisPostcss()])
postcss(chassisPostcss())

// @ts-expect-error - the prefix is a string
chassisPrefix({ prefix: 1 })

// @ts-expect-error - there is no such option
chassisPostcss({ autoprefixer: true })
