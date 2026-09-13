import FloatingBase from '../../src/floating-base.js'

const {
  BREAKPOINTS,
  parseResponsivePlacement,
  getResponsivePlacement,
  createBreakpointListeners,
  disposeBreakpointListeners
} = FloatingBase

describe('FloatingBase', () => {
  describe('BREAKPOINTS', () => {
    it('should export breakpoint values', () => {
      expect(BREAKPOINTS).toEqual(jasmine.any(Object))
      expect(BREAKPOINTS.sm).toBe(576)
      expect(BREAKPOINTS.md).toBe(768)
      expect(BREAKPOINTS.lg).toBe(1024)
      expect(BREAKPOINTS.xl).toBe(1280)
      expect(BREAKPOINTS['2xl']).toBe(1536)
    })

    it('should resolve rem-based custom properties to pixels', () => {
      const root = document.documentElement
      root.style.setProperty('--breakpoint-sm', '36rem')

      const rootFontSize = Number.parseFloat(getComputedStyle(root).fontSize)
      expect(FloatingBase.BREAKPOINTS.sm).toBe(36 * rootFontSize)

      root.style.removeProperty('--breakpoint-sm')
    })

    it('should use px-based custom properties as-is', () => {
      const root = document.documentElement
      root.style.setProperty('--breakpoint-sm', '600px')

      expect(FloatingBase.BREAKPOINTS.sm).toBe(600)

      root.style.removeProperty('--breakpoint-sm')
    })

    it('should fall back to default pixels when the custom property is unset', () => {
      const root = document.documentElement
      root.style.removeProperty('--breakpoint-sm')

      expect(FloatingBase.BREAKPOINTS.sm).toBe(576)
    })
  })

  describe('parseResponsivePlacement', () => {
    it('should return null for non-responsive placement strings', () => {
      expect(parseResponsivePlacement('bottom')).toBeNull()
      expect(parseResponsivePlacement('top-start')).toBeNull()
      expect(parseResponsivePlacement('left-end')).toBeNull()
      expect(parseResponsivePlacement('')).toBeNull()
      expect(parseResponsivePlacement(null)).toBeNull()
      expect(parseResponsivePlacement(undefined)).toBeNull()
    })

    it('should parse simple responsive placement', () => {
      const result = parseResponsivePlacement('bottom md:top')
      expect(result).toEqual({
        xs: 'bottom',
        md: 'top'
      })
    })

    it('should parse responsive placement with alignments', () => {
      const result = parseResponsivePlacement('bottom-start md:top-end lg:right')
      expect(result).toEqual({
        xs: 'bottom-start',
        md: 'top-end',
        lg: 'right'
      })
    })

    it('should parse all breakpoints', () => {
      const result = parseResponsivePlacement('bottom sm:top md:left lg:right xl:bottom-start 2xl:top-end')
      expect(result).toEqual({
        xs: 'bottom',
        sm: 'top',
        md: 'left',
        lg: 'right',
        xl: 'bottom-start',
        '2xl': 'top-end'
      })
    })

    it('should use default placement for xs when base is not specified', () => {
      const result = parseResponsivePlacement('md:top lg:bottom', 'right')
      expect(result).toEqual({
        xs: 'right',
        md: 'top',
        lg: 'bottom'
      })
    })

    it('should ignore invalid breakpoints', () => {
      const result = parseResponsivePlacement('bottom invalid:top md:left')
      expect(result).toEqual({
        xs: 'bottom',
        md: 'left'
      })
      expect(result.invalid).toBeUndefined()
    })

    it('should handle placement string with only responsive prefixes', () => {
      const result = parseResponsivePlacement('md:top')
      expect(result).toEqual({
        xs: 'bottom', // default
        md: 'top'
      })
    })
  })

  describe('getResponsivePlacement', () => {
    it('should return default placement when responsivePlacements is null', () => {
      expect(getResponsivePlacement(null)).toBe('bottom')
      expect(getResponsivePlacement(null, 'top')).toBe('top')
    })

    it('should return default placement when responsivePlacements is undefined', () => {
      expect(getResponsivePlacement(undefined)).toBe('bottom')
      expect(getResponsivePlacement(undefined, 'left')).toBe('left')
    })

    it('should return xs placement for sm viewports', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(400)

      const placements = { xs: 'bottom', md: 'top' }
      expect(getResponsivePlacement(placements)).toBe('bottom')
    })

    it('should return appropriate placement for sm viewport', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(600)

      const placements = { xs: 'bottom', sm: 'top', md: 'left' }
      expect(getResponsivePlacement(placements)).toBe('top')
    })

    it('should return appropriate placement for md viewport', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(800)

      const placements = {
        xs: 'bottom',
        sm: 'top',
        md: 'left',
        lg: 'right'
      }
      expect(getResponsivePlacement(placements)).toBe('left')
    })

    it('should return appropriate placement for lg viewport', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(1100)

      const placements = { xs: 'bottom', md: 'top', lg: 'right' }
      expect(getResponsivePlacement(placements)).toBe('right')
    })

    it('should return appropriate placement for xl viewport', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(1300)

      const placements = { xs: 'bottom', lg: 'top', xl: 'left' }
      expect(getResponsivePlacement(placements)).toBe('left')
    })

    it('should return appropriate placement for 2xl viewport', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(1600)

      const placements = { xs: 'bottom', xl: 'top', '2xl': 'right-start' }
      expect(getResponsivePlacement(placements)).toBe('right-start')
    })

    it('should cascade to smaller breakpoints when larger ones are not defined', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(1600)

      const placements = { xs: 'bottom', md: 'top' }
      expect(getResponsivePlacement(placements)).toBe('top')
    })

    it('should use default when xs is not defined', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(400)

      const placements = { md: 'top' }
      expect(getResponsivePlacement(placements, 'left')).toBe('left')
    })
  })

  describe('createBreakpointListeners', () => {
    it('should create listeners for all breakpoints', () => {
      const callback = jasmine.createSpy('callback')
      const listeners = createBreakpointListeners(callback)

      expect(listeners).toEqual(jasmine.any(Array))
      expect(listeners.length).toBe(Object.keys(BREAKPOINTS).length)

      for (const listener of listeners) {
        expect(listener.mql).toBeDefined()
        expect(listener.handler).toBe(callback)
      }

      disposeBreakpointListeners(listeners)
    })

    it('should create MediaQueryList objects with correct queries', () => {
      const callback = jasmine.createSpy('callback')
      const listeners = createBreakpointListeners(callback)

      expect(listeners[0].mql.media).toContain('min-width')

      disposeBreakpointListeners(listeners)
    })
  })

  describe('disposeBreakpointListeners', () => {
    it('should remove all event listeners', () => {
      const callback = jasmine.createSpy('callback')
      const listeners = createBreakpointListeners(callback)

      const spies = listeners.map(listener =>
        spyOn(listener.mql, 'removeEventListener').and.callThrough()
      )

      disposeBreakpointListeners(listeners)

      for (const spy of spies) {
        expect(spy).toHaveBeenCalledWith('change', callback)
      }
    })

    it('should handle empty array', () => {
      expect(() => disposeBreakpointListeners([])).not.toThrow()
    })
  })
})
