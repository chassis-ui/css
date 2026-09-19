/**
 * --------------------------------------------------------------------------
 * Chassis CSS floating-base.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */

import {
  offset,
  flip,
  shift,
  arrow,
  type Middleware,
  type MiddlewareState,
  type Placement
} from '@floating-ui/dom'
import BaseComponent from './base-component.js'
import { cssVar, execute } from './util/index.js'
import type { ComponentConfig } from './util/config.js'

type Breakpoints = Record<string, number>
type ResponsivePlacements = Record<string, string>

interface BreakpointListener {
  mql: MediaQueryList
  handler: (event: MediaQueryListEvent) => void
}

abstract class FloatingBase extends BaseComponent {
  protected declare _config: ComponentConfig
  protected declare _floatingCleanup: (() => void) | null
  protected declare _mediaQueryListeners: BreakpointListener[]
  protected declare _responsivePlacements: ResponsivePlacements | null

  // -------------------------------------------------------------------------
  // Static utilities
  // -------------------------------------------------------------------------

  static get BREAKPOINTS(): Breakpoints {
    const rootStyle = getComputedStyle(document.documentElement)
    // Breakpoint custom properties are authored in rem (e.g. 36rem), so resolve
    // them against the root font size to get the px values matchMedia expects.
    const rootFontSize = Number.parseFloat(rootStyle.fontSize) || 16
    const toPx = (property: string, fallback: number): number => {
      const raw = rootStyle.getPropertyValue(property).trim()
      const value = Number.parseFloat(raw)

      if (Number.isNaN(value)) {
        return fallback
      }

      return /r?em$/.test(raw) ? value * rootFontSize : value
    }

    return {
      sm: toPx(cssVar('breakpoint-sm'), 576),
      md: toPx(cssVar('breakpoint-md'), 768),
      lg: toPx(cssVar('breakpoint-lg'), 1024),
      xl: toPx(cssVar('breakpoint-xl'), 1280),
      '2xl': toPx(cssVar('breakpoint-2xl'), 1536)
    }
  }

  static parseResponsivePlacement(placementString?: string | null, defaultPlacement = 'bottom'): ResponsivePlacements | null {
    if (!placementString || !placementString.includes(':')) {
      return null
    }

    const parts = placementString.split(/\s+/)
    const placements: ResponsivePlacements = { xs: defaultPlacement }
    const breakpoints = FloatingBase.BREAKPOINTS

    for (const part of parts) {
      if (part.includes(':')) {
        const [breakpoint, placement] = part.split(':')
        if (breakpoints[breakpoint] !== undefined) {
          placements[breakpoint] = placement
        }
      } else {
        placements.xs = part
      }
    }

    return placements
  }

  static getResponsivePlacement(responsivePlacements: ResponsivePlacements | null, defaultPlacement = 'bottom'): string {
    if (!responsivePlacements) {
      return defaultPlacement
    }

    const viewportWidth = window.innerWidth
    const breakpoints = FloatingBase.BREAKPOINTS
    let activePlacement = responsivePlacements.xs || defaultPlacement

    for (const breakpoint of ['sm', 'md', 'lg', 'xl', '2xl']) {
      const minWidth = breakpoints[breakpoint]
      if (viewportWidth >= minWidth && responsivePlacements[breakpoint]) {
        activePlacement = responsivePlacements[breakpoint]
      }
    }

    return activePlacement
  }

  static createBreakpointListeners(callback: (event: MediaQueryListEvent) => void): BreakpointListener[] {
    const listeners: BreakpointListener[] = []
    const breakpoints = FloatingBase.BREAKPOINTS

    for (const breakpoint of Object.keys(breakpoints)) {
      const minWidth = breakpoints[breakpoint]
      const mql = window.matchMedia(`(min-width: ${minWidth}px)`)
      mql.addEventListener('change', callback)
      listeners.push({ mql, handler: callback })
    }

    return listeners
  }

  static disposeBreakpointListeners(listeners: BreakpointListener[]): void {
    for (const { mql, handler } of listeners) {
      mql.removeEventListener('change', handler)
    }
  }

  // -------------------------------------------------------------------------
  // Instance methods
  // -------------------------------------------------------------------------

  constructor(element?: string | Element | null, config?: ComponentConfig | null) {
    super(element, config)

    this._floatingCleanup = null
    this._mediaQueryListeners = []
    this._responsivePlacements = null
  }

  protected _parseResponsivePlacements(): void {
    if (typeof this._config.placement !== 'string') {
      this._responsivePlacements = null
      return
    }

    this._responsivePlacements = FloatingBase.parseResponsivePlacement(this._config.placement, this._getDefaultPlacement())

    if (this._responsivePlacements) {
      this._setupMediaQueryListeners()
    }
  }

  // Override in subclass to set the xs/base fallback placement
  protected _getDefaultPlacement(): string {
    return 'bottom'
  }

  protected _getResponsivePlacement(): string {
    return FloatingBase.getResponsivePlacement(this._responsivePlacements, this._getDefaultPlacement())
  }

  protected _setupMediaQueryListeners(): void {
    this._disposeMediaQueryListeners()
    this._mediaQueryListeners = FloatingBase.createBreakpointListeners(() => {
      if (this._isShown()) {
        this._updateFloatingPosition()
      }
    })
  }

  protected _disposeMediaQueryListeners(): void {
    FloatingBase.disposeBreakpointListeners(this._mediaQueryListeners)
    this._mediaQueryListeners = []
  }

  // Implemented by subclasses (Menu, Tooltip) — whether the floating element is currently shown.
  protected abstract _isShown(): boolean

  // Implemented by subclasses — (re)computes and applies the floating element's position.
  protected abstract _updateFloatingPosition(): any

  protected _getOffset(): number[] | ((state: MiddlewareState) => any) {
    const { offset: offsetConfig } = this._config

    if (typeof offsetConfig === 'string') {
      return offsetConfig.split(',').map((value: string) => Number.parseInt(value, 10))
    }

    if (typeof offsetConfig === 'function') {
      return ({ placement, rects }: MiddlewareState) => {
        const result = offsetConfig({ placement, reference: rects.reference, floating: rects.floating }, this._element)
        return result
      }
    }

    return offsetConfig
  }

  // Override in subclass to provide component-specific fallback placements
  protected _getFallbackPlacements(): Placement[] {
    return this._config.fallbackPlacements || []
  }

  protected _getFloatingMiddleware(arrowElement: Element | null = null): Middleware[] {
    const offsetValue = this._getOffset()

    const middleware: Middleware[] = [
      offset(
        typeof offsetValue === 'function' ?
          offsetValue :
          { mainAxis: offsetValue[1] || 0, crossAxis: offsetValue[0] || 0 }
      ),
      flip({
        fallbackPlacements: this._getFallbackPlacements()
      }),
      shift({
        boundary: this._config.boundary === 'clippingParents' ? 'clippingAncestors' : this._config.boundary
      })
    ]

    if (arrowElement) {
      middleware.push(arrow({ element: arrowElement }))
    }

    return middleware
  }

  protected _getFloatingConfig(placement: Placement | string, middleware: Middleware[]): Record<string, any> {
    return this._mergeFloatingConfig({ placement, middleware })
  }

  // Merges a subclass-supplied default config with the user's `floatingConfig`
  // option (object or a function of the default). Subclasses that need extra
  // fields in the default (e.g. Menu's `strategy`) build their own defaultConfig
  // and call this instead of reimplementing the merge.
  protected _mergeFloatingConfig(defaultConfig: Record<string, any>): Record<string, any> {
    return {
      ...defaultConfig,
      ...execute(this._config.floatingConfig, [undefined, defaultConfig])
    }
  }

  protected _disposeFloating(): void {
    if (this._floatingCleanup) {
      this._floatingCleanup()
      this._floatingCleanup = null
    }
  }
}

export default FloatingBase
