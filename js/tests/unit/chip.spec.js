import Chip from '../../src/chip.js'
import { clearFixture, getFixture } from '../helpers/fixture.js'

describe('Chip', () => {
  let fixtureEl

  beforeAll(() => {
    fixtureEl = getFixture()
  })

  afterEach(() => {
    clearFixture()
  })

  describe('VERSION', () => {
    it('should return plugin version', () => {
      expect(Chip.VERSION).toEqual(jasmine.any(String))
    })
  })

  describe('DATA_KEY', () => {
    it('should return plugin data key', () => {
      expect(Chip.DATA_KEY).toEqual('cx.chip')
    })
  })

  describe('constructor', () => {
    it('should accept a CSS selector', () => {
      fixtureEl.innerHTML = '<span class="chip">Tag</span>'

      const chipEl = fixtureEl.querySelector('.chip')
      const chip = new Chip('.chip')

      expect(chip._element).toEqual(chipEl)
    })

    it('should accept a DOM element', () => {
      fixtureEl.innerHTML = '<span class="chip">Tag</span>'

      const chipEl = fixtureEl.querySelector('.chip')
      const chip = new Chip(chipEl)

      expect(chip._element).toEqual(chipEl)
    })
  })

  describe('close', () => {
    it('should remove the element from the DOM', () => {
      fixtureEl.innerHTML = '<span class="chip">Tag</span>'

      const chipEl = fixtureEl.querySelector('.chip')
      const chip = new Chip(chipEl)

      chip.close()

      expect(fixtureEl.querySelector('.chip')).toBeNull()
    })

    it('should fire close event while element is still in the DOM', () => {
      fixtureEl.innerHTML = '<span class="chip">Tag</span>'

      const chipEl = fixtureEl.querySelector('.chip')
      const chip = new Chip(chipEl)
      let elementPresentDuringEvent = false

      chipEl.addEventListener('close.cx.chip', () => {
        elementPresentDuringEvent = fixtureEl.contains(chipEl)
      })

      chip.close()

      expect(elementPresentDuringEvent).toBeTrue()
    })

    it('should not remove element if close event is prevented', () => {
      fixtureEl.innerHTML = '<span class="chip">Tag</span>'

      const chipEl = fixtureEl.querySelector('.chip')
      const chip = new Chip(chipEl)

      chipEl.addEventListener('close.cx.chip', event => event.preventDefault())
      chip.close()

      expect(fixtureEl.querySelector('.chip')).not.toBeNull()
    })

    it('should dispose instance after removal', () => {
      fixtureEl.innerHTML = '<span class="chip">Tag</span>'

      const chipEl = fixtureEl.querySelector('.chip')
      const chip = new Chip(chipEl)

      chip.close()

      expect(Chip.getInstance(chipEl)).toBeNull()
    })

    it('should be triggered by data-cx-dismiss click', () => {
      fixtureEl.innerHTML = [
        '<span class="chip">',
        '  Tag',
        '  <button type="button" data-cx-dismiss="chip">x</button>',
        '</span>'
      ].join('')

      new Chip(fixtureEl.querySelector('.chip')) // eslint-disable-line no-new
      fixtureEl.querySelector('button').click()

      expect(fixtureEl.querySelector('.chip')).toBeNull()
    })
  })

  describe('toggle', () => {
    it('should add active class', () => {
      fixtureEl.innerHTML = '<span class="chip">Tag</span>'

      const chipEl = fixtureEl.querySelector('.chip')
      const chip = new Chip(chipEl)

      chip.toggle()

      expect(chipEl).toHaveClass('active')
    })

    it('should remove active class on second call', () => {
      fixtureEl.innerHTML = '<span class="chip active">Tag</span>'

      const chipEl = fixtureEl.querySelector('.chip')
      const chip = new Chip(chipEl)

      chip.toggle()

      expect(chipEl).not.toHaveClass('active')
    })

    it('should set aria-selected to true when activating', () => {
      fixtureEl.innerHTML = '<span class="chip">Tag</span>'

      const chipEl = fixtureEl.querySelector('.chip')
      const chip = new Chip(chipEl)

      chip.toggle()

      expect(chipEl.getAttribute('aria-selected')).toEqual('true')
    })

    it('should set aria-selected to false when deactivating', () => {
      fixtureEl.innerHTML = '<span class="chip active">Tag</span>'

      const chipEl = fixtureEl.querySelector('.chip')
      const chip = new Chip(chipEl)

      chip.toggle()

      expect(chipEl.getAttribute('aria-selected')).toEqual('false')
    })

    it('should fire toggle event with active state', () => {
      fixtureEl.innerHTML = '<span class="chip">Tag</span>'

      const chipEl = fixtureEl.querySelector('.chip')
      const chip = new Chip(chipEl)
      let capturedEvent

      chipEl.addEventListener('toggle.cx.chip', event => { capturedEvent = event })
      chip.toggle()

      expect(capturedEvent).toBeDefined()
      expect(capturedEvent.active).toBeTrue()
    })

    it('should fire toggle event with active=false when deactivating', () => {
      fixtureEl.innerHTML = '<span class="chip active">Tag</span>'

      const chipEl = fixtureEl.querySelector('.chip')
      const chip = new Chip(chipEl)
      let capturedEvent

      chipEl.addEventListener('toggle.cx.chip', event => { capturedEvent = event })
      chip.toggle()

      expect(capturedEvent.active).toBeFalse()
    })

    it('should be triggered by data-cx-toggle click', () => {
      fixtureEl.innerHTML = '<span class="chip" data-cx-toggle="chip">Tag</span>'

      const chipEl = fixtureEl.querySelector('.chip')
      let toggled = false
      chipEl.addEventListener('toggle.cx.chip', () => { toggled = true })
      chipEl.click()

      expect(toggled).toBeTrue()
    })
  })

  describe('dispose', () => {
    it('should remove instance from registry', () => {
      fixtureEl.innerHTML = '<span class="chip">Tag</span>'

      const chipEl = fixtureEl.querySelector('.chip')
      const chip = new Chip(chipEl)

      expect(Chip.getInstance(chipEl)).not.toBeNull()

      chip.dispose()

      expect(Chip.getInstance(chipEl)).toBeNull()
    })
  })

  describe('getInstance', () => {
    it('should return existing instance', () => {
      fixtureEl.innerHTML = '<span class="chip">Tag</span>'

      const chipEl = fixtureEl.querySelector('.chip')
      const chip = new Chip(chipEl)

      expect(Chip.getInstance(chipEl)).toEqual(chip)
      expect(Chip.getInstance(chipEl)).toBeInstanceOf(Chip)
    })

    it('should return null when no instance exists', () => {
      fixtureEl.innerHTML = '<span class="chip">Tag</span>'

      const chipEl = fixtureEl.querySelector('.chip')

      expect(Chip.getInstance(chipEl)).toBeNull()
    })
  })

  describe('getOrCreateInstance', () => {
    it('should return existing instance', () => {
      fixtureEl.innerHTML = '<span class="chip">Tag</span>'

      const chipEl = fixtureEl.querySelector('.chip')
      const chip = new Chip(chipEl)

      expect(Chip.getOrCreateInstance(chipEl)).toEqual(chip)
      expect(Chip.getOrCreateInstance(chipEl)).toBeInstanceOf(Chip)
    })

    it('should create new instance when none exists', () => {
      fixtureEl.innerHTML = '<span class="chip">Tag</span>'

      const chipEl = fixtureEl.querySelector('.chip')

      expect(Chip.getInstance(chipEl)).toBeNull()
      expect(Chip.getOrCreateInstance(chipEl)).toBeInstanceOf(Chip)
    })
  })
})
