#!/usr/bin/env node

/*!
 * update-tailwind-source-exclusions.mjs — regenerates
 * scss/tailwind/_source-exclusions.scss from a fresh dist/tailwind/ build.
 *
 * Run this only after `pnpm css:tailwind` reports a source-exclusion drift
 * error AND you've confirmed the drift is a deliberate source change (a
 * component, grid, or reboot class was added, renamed, or removed) rather
 * than a bug in the detection itself. It writes the file unconditionally,
 * with no drift check of its own.
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import { compileTailwindDist } from './build-tailwind.mjs'
import { updateSourceExclusions } from './tailwind-clashes.mjs'

await compileTailwindDist()
await updateSourceExclusions()
