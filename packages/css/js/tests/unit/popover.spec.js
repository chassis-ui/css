import EventHandler from '../../src/dom/event-handler.js'
import Popover from '../../src/popover.js'
import {
  clearFixture, getFixture, createEvent
} from '../helpers/fixture.js'

describe('Popover', () => {
  let fixtureEl

  beforeAll(() => {
    fixtureEl = getFixture()
  })

  afterEach(() => {
    clearFixture()

    const popoverList = document.querySelectorAll('.popover')

    for (const popoverEl of popoverList) {
      popoverEl.remove()
    }
  })

  describe('VERSION', () => {
    it('should return plugin version', () => {
      expect(Popover.VERSION).toEqual(jasmine.any(String))
    })
  })

  describe('Default', () => {
    it('should return plugin default config', () => {
      expect(Popover.Default).toEqual(jasmine.any(Object))
    })
  })

  describe('NAME', () => {
    it('should return plugin name', () => {
      expect(Popover.NAME).toEqual(jasmine.any(String))
    })
  })

  describe('DATA_KEY', () => {
    it('should return plugin data key', () => {
      expect(Popover.DATA_KEY).toEqual('cx.popover')
    })
  })

  describe('EVENT_KEY', () => {
    it('should return plugin event key', () => {
      expect(Popover.EVENT_KEY).toEqual('.cx.popover')
    })
  })

  describe('DefaultType', () => {
    it('should return plugin default type', () => {
      expect(Popover.DefaultType).toEqual(jasmine.any(Object))
    })
  })

  describe('show', () => {
    it('should toggle a popover after show', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<a href="#" title="Popover" data-x-content="https://x.com/chassis_ui">Chassis UI X</a>'

        const popoverEl = fixtureEl.querySelector('a')
        const popover = new Popover(popoverEl)

        popoverEl.addEventListener('shown.cx.popover', () => {
          expect(document.querySelector('.popover')).not.toBeNull()
          popover.toggle()
        })
        popoverEl.addEventListener('hidden.cx.popover', () => {
          expect(document.querySelector('.popover')).toBeNull()
          resolve()
        })

        popover.show()
      })
    })

    it('should show a popover', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<a href="#" title="Popover" data-cx-content="https://github.io/chassis-ui/css/">Chassis CSS</a>'

        const popoverEl = fixtureEl.querySelector('a')
        const popover = new Popover(popoverEl)

        popoverEl.addEventListener('shown.cx.popover', () => {
          expect(document.querySelector('.popover')).not.toBeNull()
          resolve()
        })

        popover.show()
      })
    })

    it('should set title and content from functions', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<a href="#">Chassis CSS</a>'

        const popoverEl = fixtureEl.querySelector('a')
        const popover = new Popover(popoverEl, {
          title: () => 'Chassis',
          content: () => 'loves writing tests （╯°□°）╯︵ ┻━┻'
        })

        popoverEl.addEventListener('shown.cx.popover', () => {
          const popoverDisplayed = document.querySelector('.popover')

          expect(popoverDisplayed).not.toBeNull()
          expect(popoverDisplayed.querySelector('.popover-header').textContent).toEqual('Chassis')
          expect(popoverDisplayed.querySelector('.popover-body').textContent).toEqual('loves writing tests （╯°□°）╯︵ ┻━┻')
          resolve()
        })

        popover.show()
      })
    })

    it('should call content and title functions with trigger element', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<a href="#" data-foo="bar">Chassis UI X</a>'

        const popoverEl = fixtureEl.querySelector('a')
        const popover = new Popover(popoverEl, {
          title(el) {
            return el.dataset.foo
          },
          content(el) {
            return el.dataset.foo
          }
        })

        popoverEl.addEventListener('shown.cx.popover', () => {
          const popoverDisplayed = document.querySelector('.popover')

          expect(popoverDisplayed).not.toBeNull()
          expect(popoverDisplayed.querySelector('.popover-header').textContent).toEqual('bar')
          expect(popoverDisplayed.querySelector('.popover-body').textContent).toEqual('bar')
          resolve()
        })

        popover.show()
      })
    })

    it('should call content and title functions with correct this value', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<a href="#" data-foo="bar">Chassis UI X</a>'

        const popoverEl = fixtureEl.querySelector('a')
        const popover = new Popover(popoverEl, {
          title() {
            return this.dataset.foo
          },
          content() {
            return this.dataset.foo
          }
        })

        popoverEl.addEventListener('shown.cx.popover', () => {
          const popoverDisplayed = document.querySelector('.popover')

          expect(popoverDisplayed).not.toBeNull()
          expect(popoverDisplayed.querySelector('.popover-header').textContent).toEqual('bar')
          expect(popoverDisplayed.querySelector('.popover-body').textContent).toEqual('bar')
          resolve()
        })

        popover.show()
      })
    })

    it('should show a popover with just content without having header', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<a href="#">Nice link</a>'

        const popoverEl = fixtureEl.querySelector('a')
        const popover = new Popover(popoverEl, {
          content: 'Some beautiful content :)'
        })

        popoverEl.addEventListener('shown.cx.popover', () => {
          const popoverDisplayed = document.querySelector('.popover')

          expect(popoverDisplayed).not.toBeNull()
          expect(popoverDisplayed.querySelector('.popover-header')).toBeNull()
          expect(popoverDisplayed.querySelector('.popover-body').textContent).toEqual('Some beautiful content :)')
          resolve()
        })

        popover.show()
      })
    })

    it('should show a popover with just title without having body', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<a href="#">Nice link</a>'

        const popoverEl = fixtureEl.querySelector('a')
        const popover = new Popover(popoverEl, {
          title: 'Title which does not require content'
        })

        popoverEl.addEventListener('shown.cx.popover', () => {
          const popoverDisplayed = document.querySelector('.popover')

          expect(popoverDisplayed).not.toBeNull()
          expect(popoverDisplayed.querySelector('.popover-body')).toBeNull()
          expect(popoverDisplayed.querySelector('.popover-header').textContent).toEqual('Title which does not require content')
          resolve()
        })

        popover.show()
      })
    })

    it('should show a popover with just title without having body using data-attribute to get config', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<a href="#" data-cx-content="" title="Title which does not require content">Nice link</a>'

        const popoverEl = fixtureEl.querySelector('a')
        const popover = new Popover(popoverEl)

        popoverEl.addEventListener('shown.cx.popover', () => {
          const popoverDisplayed = document.querySelector('.popover')

          expect(popoverDisplayed).not.toBeNull()
          expect(popoverDisplayed.querySelector('.popover-body')).toBeNull()
          expect(popoverDisplayed.querySelector('.popover-header').textContent).toEqual('Title which does not require content')
          resolve()
        })

        popover.show()
      })
    })

    it('should NOT show a popover without `title` and `content`', () => {
      fixtureEl.innerHTML = '<a href="#" data-cx-content="" title="">Nice link</a>'

      const popoverEl = fixtureEl.querySelector('a')
      const popover = new Popover(popoverEl, { animation: false })
      const spy = spyOn(EventHandler, 'trigger').and.callThrough()

      popover.show()

      expect(spy).not.toHaveBeenCalledWith(popoverEl, Popover.eventName('show'))
      expect(document.querySelector('.popover')).toBeNull()
    })

    it('"setContent" should keep the initial template', () => {
      fixtureEl.innerHTML = '<a href="#" title="Popover" data-cx-content="https://x.com/chassis_ui" data-cx-custom-class="custom-class">Chassis UI X</a>'

      const popoverEl = fixtureEl.querySelector('a')
      const popover = new Popover(popoverEl)

      popover.setContent({ '.tooltip-inner': 'foo' })
      const tip = popover._getTipElement()

      expect(tip).toHaveClass('popover')
      expect(tip).toHaveClass('cx-popover-auto')
      expect(tip.querySelector('.popover-arrow')).not.toBeNull()
      expect(tip.querySelector('.popover-header')).not.toBeNull()
      expect(tip.querySelector('.popover-body')).not.toBeNull()
    })

    it('should call setContent once', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<a href="#">Chassis CSS</a>'

        const popoverEl = fixtureEl.querySelector('a')
        const popover = new Popover(popoverEl, {
          content: 'Popover content'
        })
        expect(popover._templateFactory).toBeNull()
        let spy = null
        let times = 1

        popoverEl.addEventListener('hidden.cx.popover', () => {
          popover.show()
        })

        popoverEl.addEventListener('shown.cx.popover', () => {
          spy = spy || spyOn(popover._templateFactory, 'constructor').and.callThrough()
          const popoverDisplayed = document.querySelector('.popover')

          expect(popoverDisplayed).not.toBeNull()
          expect(popoverDisplayed.querySelector('.popover-body').textContent).toEqual('Popover content')
          expect(spy).toHaveBeenCalledTimes(0)
          if (times > 1) {
            resolve()
          }

          times++
          popover.hide()
        })
        popover.show()
      })
    })

    it('should show a popover with provided custom class', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<a href="#" title="Popover" data-cx-content="https://x.com/chassis_ui" data-cx-custom-class="custom-class">Chassis UI X</a>'

        const popoverEl = fixtureEl.querySelector('a')
        const popover = new Popover(popoverEl)

        popoverEl.addEventListener('shown.cx.popover', () => {
          const tip = document.querySelector('.popover')
          expect(tip).not.toBeNull()
          expect(tip).toHaveClass('custom-class')
          resolve()
        })

        popover.show()
      })
    })

    it('should keep popover open when mouse leaves after click trigger', () => {
      return new Promise(resolve => {
        // <button> instead of <a href="#"> because the popover instance is
        // created manually (no `data-cx-toggle`), so the document-level
        // data-api handler (which would call preventDefault) doesn't run on
        // click — and the instance's own click handler doesn't preventDefault
        // either. Clicking a bare `<a href="#">` would navigate to the empty
        // hash and Karma flags that as a "full page reload".
        fixtureEl.innerHTML = '<button type="button" title="Popover" data-cx-content="https://x.com/chassis_ui" data-cx-trigger="hover click">Chassis UI X</button>'

        const popoverEl = fixtureEl.querySelector('button')
        new Popover(popoverEl) // eslint-disable-line no-new

        popoverEl.addEventListener('shown.cx.popover', () => {
          popoverEl.dispatchEvent(createEvent('mouseout'))

          popoverEl.addEventListener('hide.cx.popover', () => {
            throw new Error('Popover should not hide when mouse leaves after click')
          })

          expect(document.querySelector('.popover')).not.toBeNull()
          resolve()
        })

        popoverEl.click()
      })
    })
  })

  describe('hide', () => {
    it('should hide a popover', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<a href="#" title="Popover" data-cx-content="https://x.com/chassis_ui">Chassis UI X</a>'

        const popoverEl = fixtureEl.querySelector('a')
        const popover = new Popover(popoverEl)

        popoverEl.addEventListener('shown.cx.popover', () => {
          popover.hide()
        })

        popoverEl.addEventListener('hidden.cx.popover', () => {
          expect(document.querySelector('.popover')).toBeNull()
          resolve()
        })

        popover.show()
      })
    })
  })

  describe('getInstance', () => {
    it('should return popover instance', () => {
      fixtureEl.innerHTML = '<a href="#" title="Popover" data-cx-content="https://x.com/chassis_ui">Chassis UI X</a>'

      const popoverEl = fixtureEl.querySelector('a')
      const popover = new Popover(popoverEl)

      expect(Popover.getInstance(popoverEl)).toEqual(popover)
      expect(Popover.getInstance(popoverEl)).toBeInstanceOf(Popover)
    })

    it('should return null when there is no popover instance', () => {
      fixtureEl.innerHTML = '<a href="#" title="Popover" data-cx-content="https://x.com/chassis_ui">Chassis UI X</a>'

      const popoverEl = fixtureEl.querySelector('a')

      expect(Popover.getInstance(popoverEl)).toBeNull()
    })
  })

  describe('getOrCreateInstance', () => {
    it('should return popover instance', () => {
      fixtureEl.innerHTML = '<div></div>'

      const div = fixtureEl.querySelector('div')
      const popover = new Popover(div)

      expect(Popover.getOrCreateInstance(div)).toEqual(popover)
      expect(Popover.getInstance(div)).toEqual(Popover.getOrCreateInstance(div, {}))
      expect(Popover.getOrCreateInstance(div)).toBeInstanceOf(Popover)
    })

    it('should return new instance when there is no popover instance', () => {
      fixtureEl.innerHTML = '<div></div>'

      const div = fixtureEl.querySelector('div')

      expect(Popover.getInstance(div)).toBeNull()
      expect(Popover.getOrCreateInstance(div)).toBeInstanceOf(Popover)
    })

    it('should return new instance when there is no popover instance with given configuration', () => {
      fixtureEl.innerHTML = '<div></div>'

      const div = fixtureEl.querySelector('div')

      expect(Popover.getInstance(div)).toBeNull()
      const popover = Popover.getOrCreateInstance(div, {
        placement: 'top'
      })
      expect(popover).toBeInstanceOf(Popover)

      expect(popover._config.placement).toEqual('top')
    })

    it('should return the instance when exists without given configuration', () => {
      fixtureEl.innerHTML = '<div></div>'

      const div = fixtureEl.querySelector('div')
      const popover = new Popover(div, {
        placement: 'top'
      })
      expect(Popover.getInstance(div)).toEqual(popover)

      const popover2 = Popover.getOrCreateInstance(div, {
        placement: 'bottom'
      })
      expect(popover).toBeInstanceOf(Popover)
      expect(popover2).toEqual(popover)

      expect(popover2._config.placement).toEqual('top')
    })
  })

  describe('data attributes', () => {
    it('should read data-cx-content as content config', () => {
      fixtureEl.innerHTML = '<a href="#" data-cx-content="Popover content">Link</a>'

      const popoverEl = fixtureEl.querySelector('a')
      const popover = new Popover(popoverEl)

      expect(popover._getContent()).toEqual('Popover content')
    })

    it('should read data-cx-title as title config', () => {
      fixtureEl.innerHTML = '<a href="#" data-cx-title="Popover title" data-cx-content="Body content">Link</a>'

      const popoverEl = fixtureEl.querySelector('a')
      const popover = new Popover(popoverEl)

      expect(popover._getTitle()).toEqual('Popover title')
    })

    it('should read data-cx-custom-class as customClass config', () => {
      fixtureEl.innerHTML = '<a href="#" title="Pop" data-cx-content="content" data-cx-custom-class="my-class">Link</a>'

      const popoverEl = fixtureEl.querySelector('a')
      const popover = new Popover(popoverEl)

      expect(popover._config.customClass).toEqual('my-class')
    })

    it('should read data-cx-placement as placement config', () => {
      fixtureEl.innerHTML = '<a href="#" title="Pop" data-cx-content="content" data-cx-placement="bottom">Link</a>'

      const popoverEl = fixtureEl.querySelector('a')
      const popover = new Popover(popoverEl)

      expect(popover._config.placement).toEqual('bottom')
    })

    it('should read data-cx-trigger as trigger config', () => {
      fixtureEl.innerHTML = '<button type="button" title="Pop" data-cx-content="content" data-cx-trigger="hover">Button</button>'

      const popoverEl = fixtureEl.querySelector('button')
      const popover = new Popover(popoverEl)

      expect(popover._config.trigger).toEqual('hover')
    })

    it('should read data-cx-html as html config', () => {
      fixtureEl.innerHTML = '<a href="#" title="Pop" data-cx-content="content" data-cx-html="true">Link</a>'

      const popoverEl = fixtureEl.querySelector('a')
      const popover = new Popover(popoverEl)

      expect(popover._config.html).toBeTrue()
    })

    it('should not read disallowed data-cx-sanitize attribute', () => {
      fixtureEl.innerHTML = '<a href="#" title="Pop" data-cx-content="content" data-cx-sanitize="false">Link</a>'

      const popoverEl = fixtureEl.querySelector('a')
      const popover = new Popover(popoverEl)

      expect(popover._config.sanitize).toBeTrue()
    })

    it('should read options from data-cx-config JSON attribute', () => {
      fixtureEl.innerHTML = '<a href="#" title="Pop" data-cx-content="content" data-cx-config=\'{"placement":"bottom","animation":false}\'></a>'

      const popoverEl = fixtureEl.querySelector('a')
      const popover = new Popover(popoverEl)

      expect(popover._config.placement).toEqual('bottom')
      expect(popover._config.animation).toBeFalse()
    })

    it('should not apply disallowed options from data-cx-config', () => {
      fixtureEl.innerHTML = '<a href="#" title="Pop" data-cx-content="content" data-cx-config=\'{"sanitize":false,"allowList":{},"sanitizeFn":"evil"}\'></a>'

      const popoverEl = fixtureEl.querySelector('a')
      const popover = new Popover(popoverEl)

      expect(popover._config.sanitize).toBeTrue()
      expect(popover._config.allowList).not.toEqual({})
      expect(popover._config.sanitizeFn).toBeNull()
    })

    it('should give individual data-cx-* attributes priority over data-cx-config', () => {
      fixtureEl.innerHTML = '<a href="#" title="Pop" data-cx-content="content" data-cx-config=\'{"placement":"bottom"}\' data-cx-placement="top"></a>'

      const popoverEl = fixtureEl.querySelector('a')
      const popover = new Popover(popoverEl)

      expect(popover._config.placement).toEqual('top')
    })

    it('should give JavaScript constructor options priority over data-cx-config', () => {
      fixtureEl.innerHTML = '<a href="#" title="Pop" data-cx-content="content" data-cx-config=\'{"placement":"bottom"}\'></a>'

      const popoverEl = fixtureEl.querySelector('a')
      const popover = new Popover(popoverEl, { placement: 'left' })

      expect(popover._config.placement).toEqual('left')
    })
  })

  describe('data-api', () => {
    it('should toggle popover on click via data-api', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<a href="#" data-cx-toggle="popover" title="Popover Title" data-cx-content="Popover content">Click me</a>'

        const popoverEl = fixtureEl.querySelector('[data-cx-toggle="popover"]')

        popoverEl.addEventListener('shown.cx.popover', () => {
          expect(document.querySelector('.popover')).not.toBeNull()
          resolve()
        })

        popoverEl.click()
      })
    })

    it('should do nothing when clicking on element without data-cx-toggle', () => {
      // Use a <button> rather than <a href="#"> because the test asserts NO
      // popover is created — meaning no popover-owned click handler runs to
      // call preventDefault. Clicking a bare `<a href="#">` would let the
      // browser follow the empty hash and Karma flags that as a "full page
      // reload", aborting the rest of the suite.
      fixtureEl.innerHTML = '<button type="button" title="Not a popover">Click me</button>'

      const linkEl = fixtureEl.querySelector('button')
      linkEl.click()

      expect(document.querySelector('.popover')).toBeNull()
      expect(Popover.getInstance(linkEl)).toBeNull()
    })

    it('should show popover on focusin via data-api', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<button data-cx-toggle="popover" data-cx-trigger="focus" title="Popover Title" data-cx-content="Popover content">Focus me</button>'

        const popoverEl = fixtureEl.querySelector('[data-cx-toggle="popover"]')

        popoverEl.addEventListener('shown.cx.popover', () => {
          expect(document.querySelector('.popover')).not.toBeNull()
          resolve()
        })

        // The data-api's `initPopover` handler at document level lazily creates
        // the Popover instance on first interaction; the instance's
        // `_setListeners()` then registers the element-level focusin listener
        // that calls `_enter()`. Per DOM spec, listeners registered during
        // event dispatch do NOT fire for that same dispatch. So a single
        // synthetic focusin only initializes the instance — a second dispatch
        // is needed to actually trigger `_enter`. In real browsers, this is
        // invisible because user-initiated focus is followed by other events
        // that drive subsequent enters.
        popoverEl.dispatchEvent(createEvent('focusin'))
        popoverEl.dispatchEvent(createEvent('focusin'))
      })
    })

    it('should prevent default on click via data-api', () => {
      fixtureEl.innerHTML = '<a href="#test" data-cx-toggle="popover" title="Popover Title" data-cx-content="Popover content">Click me</a>'

      const popoverEl = fixtureEl.querySelector('[data-cx-toggle="popover"]')
      const clickEvent = createEvent('click')
      const preventDefaultSpy = spyOn(clickEvent, 'preventDefault').and.callThrough()

      popoverEl.dispatchEvent(clickEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })
})
