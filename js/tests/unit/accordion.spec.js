import Accordion from '../../src/accordion.js'
import EventHandler from '../../src/dom/event-handler.js'
import { clearFixture, getFixture } from '../helpers/fixture.js'

describe('Accordion', () => {
  let fixtureEl

  beforeAll(() => {
    fixtureEl = getFixture()
  })

  afterEach(() => {
    clearFixture()
  })

  function makeAccordionHTML(open = false) {
    return [
      '<div class="accordion">',
      `  <details${open ? ' open' : ''}>`,
      '    <summary><div class="accordion-title">Title</div></summary>',
      '    <div class="accordion-body">Content</div>',
      '  </details>',
      '</div>'
    ].join('')
  }

  describe('NAME', () => {
    it('should return plugin name', () => {
      expect(Accordion.NAME).toEqual('accordion')
    })
  })

  describe('VERSION', () => {
    it('should return plugin version', () => {
      expect(Accordion.VERSION).toEqual(jasmine.any(String))
    })
  })

  describe('DATA_KEY', () => {
    it('should return plugin data key', () => {
      expect(Accordion.DATA_KEY).toEqual('cx.accordion')
    })
  })

  describe('Default', () => {
    it('should return plugin default config', () => {
      expect(Accordion.Default).toEqual(jasmine.any(Object))
    })
  })

  describe('constructor', () => {
    it('should take care of element either passed as a CSS selector or DOM element', () => {
      fixtureEl.innerHTML = makeAccordionHTML()

      const detailsEl = fixtureEl.querySelector('details')
      const accordionBySelector = new Accordion('.accordion > details')
      const accordionByElement = new Accordion(detailsEl)

      expect(accordionBySelector._element).toEqual(detailsEl)
      expect(accordionByElement._element).toEqual(detailsEl)
    })

    it('should find summary and body elements', () => {
      fixtureEl.innerHTML = makeAccordionHTML()

      const detailsEl = fixtureEl.querySelector('details')
      const summaryEl = fixtureEl.querySelector('summary')
      const bodyEl = fixtureEl.querySelector('.accordion-body')
      const accordion = new Accordion(detailsEl)

      expect(accordion._summary).toEqual(summaryEl)
      expect(accordion._content).toEqual(bodyEl)
    })

    it('should bail on malformed markup with no summary', () => {
      fixtureEl.innerHTML = [
        '<div class="accordion">',
        '  <details>',
        '    <div class="accordion-body">Content</div>',
        '  </details>',
        '</div>'
      ].join('')

      const detailsEl = fixtureEl.querySelector('details')
      const accordion = new Accordion(detailsEl)

      expect(accordion._summary).toBeNull()
      expect(accordion._observer).toBeUndefined()
    })

    it('should bail on malformed markup with no body', () => {
      fixtureEl.innerHTML = [
        '<div class="accordion">',
        '  <details>',
        '    <summary>Title</summary>',
        '  </details>',
        '</div>'
      ].join('')

      const detailsEl = fixtureEl.querySelector('details')
      const accordion = new Accordion(detailsEl)

      expect(accordion._content).toBeNull()
      expect(accordion._observer).toBeUndefined()
    })

    it('should initialise _isTransitioning to false', () => {
      fixtureEl.innerHTML = makeAccordionHTML()

      const detailsEl = fixtureEl.querySelector('details')
      const accordion = new Accordion(detailsEl)

      expect(accordion._isTransitioning).toBeFalse()
    })

    it('should create a MutationObserver', () => {
      fixtureEl.innerHTML = makeAccordionHTML()

      const detailsEl = fixtureEl.querySelector('details')
      const accordion = new Accordion(detailsEl)

      expect(accordion._observer).toEqual(jasmine.any(MutationObserver))
    })
  })

  describe('toggle', () => {
    it('should call open when details is closed', () => {
      fixtureEl.innerHTML = makeAccordionHTML(false)

      const detailsEl = fixtureEl.querySelector('details')
      const accordion = new Accordion(detailsEl)
      const spy = spyOn(accordion, 'open')

      accordion.toggle()

      expect(spy).toHaveBeenCalled()
    })

    it('should call close when details is open', () => {
      fixtureEl.innerHTML = makeAccordionHTML(true)

      const detailsEl = fixtureEl.querySelector('details')
      const accordion = new Accordion(detailsEl)
      const spy = spyOn(accordion, 'close')

      accordion.toggle()

      expect(spy).toHaveBeenCalled()
    })
  })

  describe('open', () => {
    it('should do nothing if already transitioning', () => {
      fixtureEl.innerHTML = makeAccordionHTML()

      const detailsEl = fixtureEl.querySelector('details')
      const accordion = new Accordion(detailsEl)
      accordion._isTransitioning = true

      const spy = spyOn(EventHandler, 'trigger')

      accordion.open()

      expect(spy).not.toHaveBeenCalled()
    })

    it('should do nothing if no summary', () => {
      fixtureEl.innerHTML = makeAccordionHTML()

      const detailsEl = fixtureEl.querySelector('details')
      const accordion = new Accordion(detailsEl)
      accordion._summary = null

      const spy = spyOn(EventHandler, 'trigger')

      accordion.open()

      expect(spy).not.toHaveBeenCalled()
    })

    it('should fire open.cx.accordion before opening', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = makeAccordionHTML()

        const detailsEl = fixtureEl.querySelector('details')
        const accordion = new Accordion(detailsEl)

        detailsEl.addEventListener('open.cx.accordion', () => {
          resolve()
        })

        accordion.open()
      })
    })

    it('should not fire opened when open is prevented', () => {
      return new Promise((resolve, reject) => {
        fixtureEl.innerHTML = makeAccordionHTML()

        const detailsEl = fixtureEl.querySelector('details')
        const accordion = new Accordion(detailsEl)

        const expectEnd = () => {
          setTimeout(() => {
            expect().nothing()
            resolve()
          }, 10)
        }

        detailsEl.addEventListener('open.cx.accordion', event => {
          event.preventDefault()
          expectEnd()
        })

        detailsEl.addEventListener('opened.cx.accordion', () => {
          reject(new Error('should not fire opened event'))
        })

        accordion.open()
      })
    })

    it('should fire opened.cx.accordion after transition completes', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = makeAccordionHTML()

        const detailsEl = fixtureEl.querySelector('details')
        const accordion = new Accordion(detailsEl)

        detailsEl.addEventListener('opened.cx.accordion', () => {
          resolve()
        })

        accordion.open()
      })
    })

    it('should set _isTransitioning to false after opening', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = makeAccordionHTML()

        const detailsEl = fixtureEl.querySelector('details')
        const accordion = new Accordion(detailsEl)

        detailsEl.addEventListener('opened.cx.accordion', () => {
          expect(accordion._isTransitioning).toBeFalse()
          resolve()
        })

        accordion.open()
      })
    })

    it('should set _isTransitioning to true while opening', () => {
      fixtureEl.innerHTML = makeAccordionHTML()

      const detailsEl = fixtureEl.querySelector('details')
      const accordion = new Accordion(detailsEl)

      accordion.open()

      expect(accordion._isTransitioning).toBeTrue()
    })
  })

  describe('close', () => {
    it('should do nothing if no summary', () => {
      fixtureEl.innerHTML = makeAccordionHTML(true)

      const detailsEl = fixtureEl.querySelector('details')
      const accordion = new Accordion(detailsEl)
      accordion._summary = null

      const spy = spyOn(EventHandler, 'trigger')

      accordion.close()

      expect(spy).not.toHaveBeenCalled()
    })

    it('should not start close transition if already transitioning', () => {
      fixtureEl.innerHTML = makeAccordionHTML(true)

      const detailsEl = fixtureEl.querySelector('details')
      const accordion = new Accordion(detailsEl)
      accordion._isTransitioning = true

      const spy = spyOn(accordion, '_createClone')

      accordion.close()

      expect(spy).not.toHaveBeenCalled()
    })

    it('should fire close.cx.accordion before closing', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = makeAccordionHTML(true)

        const detailsEl = fixtureEl.querySelector('details')
        const accordion = new Accordion(detailsEl)

        detailsEl.addEventListener('close.cx.accordion', () => {
          resolve()
        })

        accordion.close()
      })
    })

    it('should not fire closed when close is prevented', () => {
      return new Promise((resolve, reject) => {
        fixtureEl.innerHTML = makeAccordionHTML(true)

        const detailsEl = fixtureEl.querySelector('details')
        const accordion = new Accordion(detailsEl)

        const expectEnd = () => {
          setTimeout(() => {
            expect().nothing()
            resolve()
          }, 10)
        }

        detailsEl.addEventListener('close.cx.accordion', event => {
          event.preventDefault()
          expectEnd()
        })

        detailsEl.addEventListener('closed.cx.accordion', () => {
          reject(new Error('should not fire closed event'))
        })

        accordion.close()
      })
    })

    it('should fire closed.cx.accordion after transition completes', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = makeAccordionHTML(true)

        const detailsEl = fixtureEl.querySelector('details')
        const accordion = new Accordion(detailsEl)

        detailsEl.addEventListener('closed.cx.accordion', () => {
          resolve()
        })

        accordion.close()
      })
    })

    it('should set _isTransitioning to false after closing', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = makeAccordionHTML(true)

        const detailsEl = fixtureEl.querySelector('details')
        const accordion = new Accordion(detailsEl)

        detailsEl.addEventListener('closed.cx.accordion', () => {
          expect(accordion._isTransitioning).toBeFalse()
          resolve()
        })

        accordion.close()
      })
    })

    it('should set _isTransitioning to true while closing', () => {
      fixtureEl.innerHTML = makeAccordionHTML(true)

      const detailsEl = fixtureEl.querySelector('details')
      const accordion = new Accordion(detailsEl)

      accordion.close()

      expect(accordion._isTransitioning).toBeTrue()
    })

    it('should insert a clone as a visual stand-in during close animation', () => {
      fixtureEl.innerHTML = makeAccordionHTML(true)

      const detailsEl = fixtureEl.querySelector('details')
      const accordionEl = fixtureEl.querySelector('.accordion')
      const accordion = new Accordion(detailsEl)

      accordion.close()

      const clone = accordionEl.querySelector('details[data-accordion-clone]')
      expect(clone).not.toBeNull()
      expect(clone.inert).toBeTrue()
    })

    it('should remove clone after close animation completes', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = makeAccordionHTML(true)

        const detailsEl = fixtureEl.querySelector('details')
        const accordionEl = fixtureEl.querySelector('.accordion')
        const accordion = new Accordion(detailsEl)

        detailsEl.addEventListener('closed.cx.accordion', () => {
          const clone = accordionEl.querySelector('details[data-accordion-clone]')
          expect(clone).toBeNull()
          resolve()
        })

        accordion.close()
      })
    })
  })

  describe('dispose', () => {
    it('should destroy the accordion instance', () => {
      fixtureEl.innerHTML = makeAccordionHTML()

      const detailsEl = fixtureEl.querySelector('details')
      const accordion = new Accordion(detailsEl)

      expect(Accordion.getInstance(detailsEl)).toEqual(accordion)

      accordion.dispose()

      expect(Accordion.getInstance(detailsEl)).toBeNull()
    })

    it('should disconnect the MutationObserver', () => {
      fixtureEl.innerHTML = makeAccordionHTML()

      const detailsEl = fixtureEl.querySelector('details')
      const accordion = new Accordion(detailsEl)
      const disconnectSpy = spyOn(accordion._observer, 'disconnect')

      accordion.dispose()

      expect(disconnectSpy).toHaveBeenCalled()
    })
  })

  describe('getInstance', () => {
    it('should return the accordion instance', () => {
      fixtureEl.innerHTML = makeAccordionHTML()

      const detailsEl = fixtureEl.querySelector('details')
      const accordion = new Accordion(detailsEl)

      expect(Accordion.getInstance(detailsEl)).toEqual(accordion)
      expect(Accordion.getInstance(detailsEl)).toBeInstanceOf(Accordion)
    })

    it('should return null when there is no accordion instance', () => {
      fixtureEl.innerHTML = makeAccordionHTML()

      const detailsEl = fixtureEl.querySelector('details')

      expect(Accordion.getInstance(detailsEl)).toBeNull()
    })
  })

  describe('getOrCreateInstance', () => {
    it('should return the existing accordion instance', () => {
      fixtureEl.innerHTML = makeAccordionHTML()

      const detailsEl = fixtureEl.querySelector('details')
      const accordion = new Accordion(detailsEl)

      expect(Accordion.getOrCreateInstance(detailsEl)).toEqual(accordion)
      expect(Accordion.getOrCreateInstance(detailsEl)).toBeInstanceOf(Accordion)
    })

    it('should create a new instance when there is none', () => {
      fixtureEl.innerHTML = makeAccordionHTML()

      const detailsEl = fixtureEl.querySelector('details')

      expect(Accordion.getInstance(detailsEl)).toBeNull()
      expect(Accordion.getOrCreateInstance(detailsEl)).toBeInstanceOf(Accordion)
    })
  })

  describe('data-api', () => {
    it('should initialise accordion on click', () => {
      fixtureEl.innerHTML = makeAccordionHTML()

      const detailsEl = fixtureEl.querySelector('details')

      expect(Accordion.getInstance(detailsEl)).toBeNull()

      detailsEl.click()

      expect(Accordion.getInstance(detailsEl)).toBeInstanceOf(Accordion)
    })

    it('should initialise all named siblings when a grouped item is clicked', () => {
      fixtureEl.innerHTML = [
        '<div class="accordion">',
        '  <details name="group1">',
        '    <summary><div class="accordion-title">Item 1</div></summary>',
        '    <div class="accordion-body">Content 1</div>',
        '  </details>',
        '  <details name="group1">',
        '    <summary><div class="accordion-title">Item 2</div></summary>',
        '    <div class="accordion-body">Content 2</div>',
        '  </details>',
        '</div>'
      ].join('')

      const [details1, details2] = fixtureEl.querySelectorAll('details')

      expect(Accordion.getInstance(details1)).toBeNull()
      expect(Accordion.getInstance(details2)).toBeNull()

      details1.click()

      expect(Accordion.getInstance(details1)).toBeInstanceOf(Accordion)
      expect(Accordion.getInstance(details2)).toBeInstanceOf(Accordion)
    })
  })
})
