#!/usr/bin/env node

/*!
 * update-tailwind-clash-policy.mjs — regenerates
 * scss/tailwind/_clash-policy.scss from build/tailwind/tailwind-utility-clashes.json
 * and build/tailwind/tailwind-bridge-clashes.json.
 *
 * Unlike update-tailwind-source-exclusions.mjs, this needs no fresh
 * dist/tailwind/ build first -- it's a pure, mechanical re-derivation of the
 * two JSON policy files, which stay the reviewed source of truth. Run this
 * after hand-editing either JSON file (adding/removing a same-name clash
 * entry, or changing a remedy).
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import { updateClashPolicy } from './tailwind-clashes.mjs'

updateClashPolicy()
