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
      expect(BREAKPOINTS.small).toBe(576)
      expect(BREAKPOINTS.medium).toBe(768)
      expect(BREAKPOINTS.large).toBe(1024)
      expect(BREAKPOINTS.xlarge).toBe(1280)
      expect(BREAKPOINTS['2xlarge']).toBe(1536)
    })

    it('should resolve rem-based custom properties to pixels', () => {
      const root = document.documentElement
      root.style.setProperty('--breakpoint-small', '36rem')

      const rootFontSize = Number.parseFloat(getComputedStyle(root).fontSize)
      expect(FloatingBase.BREAKPOINTS.small).toBe(36 * rootFontSize)

      root.style.removeProperty('--breakpoint-small')
    })

    it('should use px-based custom properties as-is', () => {
      const root = document.documentElement
      root.style.setProperty('--breakpoint-small', '600px')

      expect(FloatingBase.BREAKPOINTS.small).toBe(600)

      root.style.removeProperty('--breakpoint-small')
    })

    it('should fall back to default pixels when the custom property is unset', () => {
      const root = document.documentElement
      root.style.removeProperty('--breakpoint-small')

      expect(FloatingBase.BREAKPOINTS.small).toBe(576)
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
      const result = parseResponsivePlacement('bottom medium:top')
      expect(result).toEqual({
        xsmall: 'bottom',
        medium: 'top'
      })
    })

    it('should parse responsive placement with alignments', () => {
      const result = parseResponsivePlacement('bottom-start medium:top-end large:right')
      expect(result).toEqual({
        xsmall: 'bottom-start',
        medium: 'top-end',
        large: 'right'
      })
    })

    it('should parse all breakpoints', () => {
      const result = parseResponsivePlacement('bottom small:top medium:left large:right xlarge:bottom-start 2xlarge:top-end')
      expect(result).toEqual({
        xsmall: 'bottom',
        small: 'top',
        medium: 'left',
        large: 'right',
        xlarge: 'bottom-start',
        '2xlarge': 'top-end'
      })
    })

    it('should use default placement for xs when base is not specified', () => {
      const result = parseResponsivePlacement('medium:top large:bottom', 'right')
      expect(result).toEqual({
        xsmall: 'right',
        medium: 'top',
        large: 'bottom'
      })
    })

    it('should ignore invalid breakpoints', () => {
      const result = parseResponsivePlacement('bottom invalid:top medium:left')
      expect(result).toEqual({
        xsmall: 'bottom',
        medium: 'left'
      })
      expect(result.invalid).toBeUndefined()
    })

    it('should handle placement string with only responsive prefixes', () => {
      const result = parseResponsivePlacement('medium:top')
      expect(result).toEqual({
        xsmall: 'bottom', // default
        medium: 'top'
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

    it('should return xs placement for small viewports', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(400)

      const placements = { xsmall: 'bottom', medium: 'top' }
      expect(getResponsivePlacement(placements)).toBe('bottom')
    })

    it('should return appropriate placement for small viewport', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(600)

      const placements = { xsmall: 'bottom', small: 'top', medium: 'left' }
      expect(getResponsivePlacement(placements)).toBe('top')
    })

    it('should return appropriate placement for medium viewport', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(800)

      const placements = {
        xsmall: 'bottom',
        small: 'top',
        medium: 'left',
        large: 'right'
      }
      expect(getResponsivePlacement(placements)).toBe('left')
    })

    it('should return appropriate placement for large viewport', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(1100)

      const placements = { xsmall: 'bottom', medium: 'top', large: 'right' }
      expect(getResponsivePlacement(placements)).toBe('right')
    })

    it('should return appropriate placement for xlarge viewport', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(1300)

      const placements = { xsmall: 'bottom', large: 'top', xlarge: 'left' }
      expect(getResponsivePlacement(placements)).toBe('left')
    })

    it('should return appropriate placement for 2xlarge viewport', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(1600)

      const placements = { xsmall: 'bottom', xlarge: 'top', '2xlarge': 'right-start' }
      expect(getResponsivePlacement(placements)).toBe('right-start')
    })

    it('should cascade to smaller breakpoints when larger ones are not defined', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(1600)

      const placements = { xsmall: 'bottom', medium: 'top' }
      expect(getResponsivePlacement(placements)).toBe('top')
    })

    it('should use default when xs is not defined', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(400)

      const placements = { medium: 'top' }
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
