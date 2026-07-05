import Combobox from '../../src/combobox.js'
import Menu from '../../src/menu.js'
import { clearFixture, getFixture } from '../helpers/fixture.js'

describe('Combobox', () => {
  let fixtureEl

  beforeAll(() => {
    fixtureEl = getFixture()
  })

  afterEach(() => {
    // Combobox owns a Menu instance internally. Without explicit cleanup,
    // each test leaks: (1) a stale entry in `Menu._openInstances` (a static
    // Set), (2) Floating UI autoUpdate handlers, (3) event listeners on the
    // (about-to-be-detached) menu element. Properly disposing each combobox
    // unwinds all of that, keeping later specs (e.g. menu.spec.js) clean and
    // the suite running at full speed.
    for (const toggleEl of fixtureEl.querySelectorAll('[data-cx-toggle="combobox"]')) {
      Combobox.getInstance(toggleEl)?.dispose()
    }

    // Defensive: if a test bypassed the data-api toggle and somehow left an
    // entry in the static Set, drop it.
    Menu._openInstances.clear()

    clearFixture()
  })

  // ---------------------------------------------------------------------------
  // Fixture helpers — keep test bodies readable by centralising the markup.
  // Combobox markup requires a `[data-cx-toggle="combobox"]` element whose
  // immediate next sibling is a `.menu` (per `SelectorEngine.next` lookup).
  // ---------------------------------------------------------------------------

  const buildButtonTrigger = ({
    placeholder = '',
    name = '',
    preSelected = null,
    disabled = false
  } = {}) => {
    const attrs = [
      'class="form-input combobox"',
      'type="button"',
      'data-cx-toggle="combobox"',
      name ? `data-cx-name="${name}"` : '',
      placeholder ? `data-cx-placeholder="${placeholder}"` : '',
      disabled ? 'disabled' : ''
    ].filter(Boolean).join(' ')

    const items = ['1', '2', '3'].map(value => {
      const isSelected = String(preSelected) === value
      return `<button class="menu-item${isSelected ? ' selected' : ''}" type="button" role="option"${isSelected ? ' aria-selected="true"' : ''} data-cx-value="${value}">Option ${value}</button>`
    }).join('')

    return [
      `<button ${attrs}>`,
      '  <span class="combobox-value"></span>',
      '</button>',
      '<div class="menu" role="listbox">',
      `  ${items}`,
      '</div>'
    ].join('')
  }

  const buildInputTrigger = ({
    placeholder = 'Select an item…',
    name = '',
    inputDisabled = false
  } = {}) => {
    const wrapperAttrs = [
      'class="form-input combobox"',
      'data-cx-toggle="combobox"',
      name ? `data-cx-name="${name}"` : ''
    ].filter(Boolean).join(' ')

    return [
      `<div ${wrapperAttrs}>`,
      `  <input type="text" class="combobox-value" placeholder="${placeholder}" autocomplete="off"${inputDisabled ? ' disabled' : ''}>`,
      '</div>',
      '<div class="menu" role="listbox">',
      '  <button class="menu-item" type="button" role="option" data-cx-value="1">Option one</button>',
      '  <button class="menu-item" type="button" role="option" data-cx-value="2">Option two</button>',
      '  <button class="menu-item" type="button" role="option" data-cx-value="3">Option three</button>',
      '</div>'
    ].join('')
  }

  // ---------------------------------------------------------------------------
  // Static getters
  // ---------------------------------------------------------------------------

  describe('VERSION', () => {
    it('should return plugin version', () => {
      expect(Combobox.VERSION).toEqual(jasmine.any(String))
    })
  })

  describe('DATA_KEY', () => {
    it('should return plugin data key', () => {
      expect(Combobox.DATA_KEY).toEqual('cx.combobox')
    })
  })

  describe('Default', () => {
    it('should return plugin default config', () => {
      expect(Combobox.Default).toEqual(jasmine.any(Object))
    })

    it('should default to single-select (multiple: false)', () => {
      expect(Combobox.Default.multiple).toBeFalse()
    })

    it('should default to no hidden input (name: null)', () => {
      expect(Combobox.Default.name).toBeNull()
    })

    it('should default placement to bottom-start', () => {
      expect(Combobox.Default.placement).toEqual('bottom-start')
    })

    it('should default searchNormalize to false', () => {
      expect(Combobox.Default.searchNormalize).toBeFalse()
    })
  })

  describe('DefaultType', () => {
    it('should return plugin default type config', () => {
      expect(Combobox.DefaultType).toEqual(jasmine.any(Object))
    })
  })

  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------

  describe('constructor', () => {
    it('should take an element passed as a CSS selector', () => {
      fixtureEl.innerHTML = buildButtonTrigger()

      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const combobox = new Combobox('[data-cx-toggle="combobox"]')

      expect(combobox._element).toEqual(toggleEl)
    })

    it('should take an element passed as a DOM node', () => {
      fixtureEl.innerHTML = buildButtonTrigger()

      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const combobox = new Combobox(toggleEl)

      expect(combobox._element).toEqual(toggleEl)
    })

    it('should locate the menu as the next sibling of the toggle', () => {
      fixtureEl.innerHTML = buildButtonTrigger()

      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const menuEl = fixtureEl.querySelector('.menu')
      const combobox = new Combobox(toggleEl)

      expect(combobox._menu).toEqual(menuEl)
    })

    it('should set _comboInput when .combobox-value is an HTMLInputElement', () => {
      fixtureEl.innerHTML = buildInputTrigger()

      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const inputEl = fixtureEl.querySelector('input.combobox-value')
      const combobox = new Combobox(toggleEl)

      expect(combobox._comboInput).toEqual(inputEl)
    })

    it('should leave _comboInput null when .combobox-value is not an input', () => {
      fixtureEl.innerHTML = buildButtonTrigger()

      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const combobox = new Combobox(toggleEl)

      expect(combobox._comboInput).toBeNull()
    })

    it('should ignore .combobox-search-input when _comboInput is present', () => {
      // Button-trigger combobox with a search input inside the menu uses
      // _searchInput. Input-trigger combobox filters via the toggle input
      // itself, so _searchInput must be ignored even if present in markup
      // (defensive: prevents both filtering paths firing at once).
      fixtureEl.innerHTML = [
        '<div class="form-input combobox" data-cx-toggle="combobox">',
        '  <input type="text" class="combobox-value" autocomplete="off">',
        '</div>',
        '<div class="menu" role="listbox">',
        '  <div class="combobox-search">',
        '    <input type="text" class="combobox-search-input">',
        '  </div>',
        '  <button class="menu-item" type="button" data-cx-value="1">Option one</button>',
        '</div>'
      ].join('')

      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const combobox = new Combobox(toggleEl)

      expect(combobox._comboInput).not.toBeNull()
      expect(combobox._searchInput).toBeNull()
    })

    it('should set _searchInput when .combobox-search-input is in the menu and no comboInput', () => {
      fixtureEl.innerHTML = [
        '<button class="form-input combobox" type="button" data-cx-toggle="combobox">',
        '  <span class="combobox-value"></span>',
        '</button>',
        '<div class="menu" role="listbox">',
        '  <div class="combobox-search">',
        '    <input type="text" class="combobox-search-input">',
        '  </div>',
        '  <button class="menu-item" type="button" data-cx-value="1">Option one</button>',
        '</div>'
      ].join('')

      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const searchInputEl = fixtureEl.querySelector('.combobox-search-input')
      const combobox = new Combobox(toggleEl)

      expect(combobox._searchInput).toEqual(searchInputEl)
    })

    it('should create a Menu plugin instance for floating positioning', () => {
      fixtureEl.innerHTML = buildButtonTrigger()

      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const combobox = new Combobox(toggleEl)

      expect(combobox._menuInstance).not.toBeNull()
      expect(combobox._menuInstance.constructor.NAME).toEqual('menu')
    })

    it('should sync aria-selected from .selected class on initialisation', () => {
      fixtureEl.innerHTML = buildButtonTrigger({ preSelected: '2' })

      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      // eslint-disable-next-line no-new
      new Combobox(toggleEl)

      const items = fixtureEl.querySelectorAll('.menu-item')
      expect(items[0].getAttribute('aria-selected')).toEqual('false')
      expect(items[1].getAttribute('aria-selected')).toEqual('true')
      expect(items[2].getAttribute('aria-selected')).toEqual('false')
    })
  })

  // ---------------------------------------------------------------------------
  // toggle / show / hide
  // ---------------------------------------------------------------------------

  describe('toggle', () => {
    it('should call show() when the menu is hidden', () => {
      fixtureEl.innerHTML = buildButtonTrigger()

      const combobox = new Combobox(fixtureEl.querySelector('[data-cx-toggle="combobox"]'))
      spyOn(combobox, 'show')
      spyOn(combobox, 'hide')

      combobox.toggle()
      expect(combobox.show).toHaveBeenCalled()
      expect(combobox.hide).not.toHaveBeenCalled()
    })

    it('should call hide() when the menu is shown', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const combobox = new Combobox(fixtureEl.querySelector('[data-cx-toggle="combobox"]'))

        combobox.show()

        setTimeout(() => {
          spyOn(combobox, 'show')
          spyOn(combobox, 'hide')

          combobox.toggle()
          expect(combobox.hide).toHaveBeenCalled()
          expect(combobox.show).not.toHaveBeenCalled()
          resolve()
        }, 20)
      })
    })
  })

  describe('show', () => {
    it('should add .show to the menu', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const menuEl = fixtureEl.querySelector('.menu')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          expect(menuEl).toHaveClass('show')
          resolve()
        })

        combobox.show()
      })
    })

    it('should fire show.cx.combobox then shown.cx.combobox events', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const combobox = new Combobox(toggleEl)

        const calls = []
        toggleEl.addEventListener('show.cx.combobox', () => calls.push('show'))
        toggleEl.addEventListener('shown.cx.combobox', () => {
          calls.push('shown')
          expect(calls).toEqual(['show', 'shown'])
          resolve()
        })

        combobox.show()
      })
    })

    it('should NOT show when show.cx.combobox is prevented', () => {
      fixtureEl.innerHTML = buildButtonTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const menuEl = fixtureEl.querySelector('.menu')
      const combobox = new Combobox(toggleEl)

      toggleEl.addEventListener('show.cx.combobox', event => event.preventDefault())

      combobox.show()
      expect(menuEl).not.toHaveClass('show')
    })

    it('should be a no-op when the menu is already shown', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          // Now try showing again — the show event must not re-fire
          let secondShownFired = false
          toggleEl.addEventListener('shown.cx.combobox', () => { secondShownFired = true })

          combobox.show()

          setTimeout(() => {
            expect(secondShownFired).toBeFalse()
            resolve()
          }, 20)
        }, { once: true })

        combobox.show()
      })
    })

    it('should be a no-op when the toggle is disabled', () => {
      fixtureEl.innerHTML = buildButtonTrigger({ disabled: true })
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const menuEl = fixtureEl.querySelector('.menu')
      const combobox = new Combobox(toggleEl)

      combobox.show()
      expect(menuEl).not.toHaveClass('show')
    })
  })

  describe('hide', () => {
    it('should remove .show from the menu', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const menuEl = fixtureEl.querySelector('.menu')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          combobox.hide()
        })

        toggleEl.addEventListener('hidden.cx.combobox', () => {
          expect(menuEl).not.toHaveClass('show')
          resolve()
        })

        combobox.show()
      })
    })

    it('should fire hide.cx.combobox then hidden.cx.combobox events', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const combobox = new Combobox(toggleEl)

        const calls = []
        toggleEl.addEventListener('hide.cx.combobox', () => calls.push('hide'))
        toggleEl.addEventListener('hidden.cx.combobox', () => {
          calls.push('hidden')
          expect(calls).toEqual(['hide', 'hidden'])
          resolve()
        })

        toggleEl.addEventListener('shown.cx.combobox', () => combobox.hide())
        combobox.show()
      })
    })

    it('should NOT hide when hide.cx.combobox is prevented', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const menuEl = fixtureEl.querySelector('.menu')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('hide.cx.combobox', event => event.preventDefault())

        toggleEl.addEventListener('shown.cx.combobox', () => {
          combobox.hide()
          // hide() should have been intercepted
          expect(menuEl).toHaveClass('show')
          resolve()
        })

        combobox.show()
      })
    })

    it('should be a no-op when the menu is already hidden', () => {
      fixtureEl.innerHTML = buildButtonTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const combobox = new Combobox(toggleEl)

      let hideFired = false
      toggleEl.addEventListener('hide.cx.combobox', () => { hideFired = true })

      combobox.hide()
      expect(hideFired).toBeFalse()
    })
  })

  // ---------------------------------------------------------------------------
  // disable / enable
  // ---------------------------------------------------------------------------

  describe('disable / enable', () => {
    it('should add .disabled class and aria-disabled="true" on disable()', () => {
      fixtureEl.innerHTML = buildButtonTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const combobox = new Combobox(toggleEl)

      combobox.disable()
      expect(toggleEl).toHaveClass('disabled')
      expect(toggleEl.getAttribute('aria-disabled')).toEqual('true')
    })

    it('should remove .disabled class and aria-disabled on enable()', () => {
      fixtureEl.innerHTML = buildButtonTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const combobox = new Combobox(toggleEl)

      combobox.disable()
      combobox.enable()
      expect(toggleEl).not.toHaveClass('disabled')
      expect(toggleEl.hasAttribute('aria-disabled')).toBeFalse()
    })

    it('should sync the comboInput disabled property when present', () => {
      fixtureEl.innerHTML = buildInputTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const inputEl = fixtureEl.querySelector('input.combobox-value')
      const combobox = new Combobox(toggleEl)

      combobox.disable()
      expect(inputEl.disabled).toBeTrue()

      combobox.enable()
      expect(inputEl.disabled).toBeFalse()
    })

    it('should sync the hidden input disabled property when present', () => {
      fixtureEl.innerHTML = buildButtonTrigger({ name: 'option' })
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const combobox = new Combobox(toggleEl)

      combobox.disable()
      expect(combobox._hiddenInput.disabled).toBeTrue()

      combobox.enable()
      expect(combobox._hiddenInput.disabled).toBeFalse()
    })

    it('should hide an open menu when disable() is called', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const menuEl = fixtureEl.querySelector('.menu')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          combobox.disable()
          expect(menuEl).not.toHaveClass('show')
          expect(toggleEl).toHaveClass('disabled')
          resolve()
        })

        combobox.show()
      })
    })

    it('should detect existing disabled state from .disabled class on construction', () => {
      fixtureEl.innerHTML = buildInputTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const inputEl = fixtureEl.querySelector('input.combobox-value')
      toggleEl.classList.add('disabled')

      // eslint-disable-next-line no-new
      new Combobox(toggleEl)

      // Construction calls _syncDisabledState() which mirrors to the input
      expect(inputEl.disabled).toBeTrue()
      expect(toggleEl.getAttribute('aria-disabled')).toEqual('true')
    })

    it('should detect existing disabled state from input disabled prop on construction', () => {
      fixtureEl.innerHTML = buildInputTrigger({ inputDisabled: true })
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')

      // eslint-disable-next-line no-new
      new Combobox(toggleEl)

      // Sync goes the other direction too: input.disabled propagates to toggle
      expect(toggleEl).toHaveClass('disabled')
      expect(toggleEl.getAttribute('aria-disabled')).toEqual('true')
    })
  })

  // ---------------------------------------------------------------------------
  // dispose
  // ---------------------------------------------------------------------------

  describe('dispose', () => {
    it('should remove the instance from the data store', () => {
      fixtureEl.innerHTML = buildButtonTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const combobox = new Combobox(toggleEl)

      expect(Combobox.getInstance(toggleEl)).toEqual(combobox)

      combobox.dispose()
      expect(Combobox.getInstance(toggleEl)).toBeNull()
    })

    it('should remove the hidden input from the DOM', () => {
      fixtureEl.innerHTML = buildButtonTrigger({ name: 'option' })
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const combobox = new Combobox(toggleEl)

      const hiddenInput = combobox._hiddenInput
      expect(hiddenInput.parentNode).not.toBeNull()

      combobox.dispose()
      expect(hiddenInput.parentNode).toBeNull()
    })

    it('should dispose the underlying Menu plugin instance', () => {
      fixtureEl.innerHTML = buildButtonTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const combobox = new Combobox(toggleEl)

      const menuInstance = combobox._menuInstance
      const menuDisposeSpy = spyOn(menuInstance, 'dispose').and.callThrough()

      combobox.dispose()
      expect(menuDisposeSpy).toHaveBeenCalled()
      expect(combobox._menuInstance).toBeNull()
    })
  })

  // ---------------------------------------------------------------------------
  // Single-select behaviour
  // ---------------------------------------------------------------------------

  describe('single-select', () => {
    it('should mark a clicked item as .selected with aria-selected="true"', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[1].click()
          expect(items[1]).toHaveClass('selected')
          expect(items[1].getAttribute('aria-selected')).toEqual('true')
          resolve()
        })

        combobox.show()
      })
    })

    it('should clear the previous selection when a new item is selected', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger({ preSelected: '1' })
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[2].click()
          expect(items[0]).not.toHaveClass('selected')
          expect(items[0].getAttribute('aria-selected')).toEqual('false')
          expect(items[2]).toHaveClass('selected')
          expect(items[2].getAttribute('aria-selected')).toEqual('true')
          resolve()
        })

        combobox.show()
      })
    })

    it('should update the .combobox-value text with the selected item label', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const valueEl = fixtureEl.querySelector('.combobox-value')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[1].click()
          expect(valueEl.textContent.trim()).toEqual('Option 2')
          resolve()
        })

        combobox.show()
      })
    })

    it('should fire change.cx.combobox with {value, item} payload on selection', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('change.cx.combobox', event => {
          expect(event.value).toEqual('2')
          expect(event.item).toEqual(items[1])
          resolve()
        })

        toggleEl.addEventListener('shown.cx.combobox', () => items[1].click())
        combobox.show()
      })
    })

    it('should close the menu after a single-select selection', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const menuEl = fixtureEl.querySelector('.menu')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('hidden.cx.combobox', () => {
          expect(menuEl).not.toHaveClass('show')
          resolve()
        })

        toggleEl.addEventListener('shown.cx.combobox', () => items[0].click())
        combobox.show()
      })
    })

    it('should NOT mark a disabled item as selected or fire change when clicked', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const items = fixtureEl.querySelectorAll('.menu-item')
        items[1].classList.add('disabled')
        const combobox = new Combobox(toggleEl)

        let changeFired = false
        toggleEl.addEventListener('change.cx.combobox', () => { changeFired = true })

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[1].click()
          expect(items[1]).not.toHaveClass('selected')
          expect(items[1].getAttribute('aria-selected')).not.toEqual('true')
          expect(changeFired).toBeFalse()
          // Note: the menu still closes via the document-level Menu.clearMenus
          // capture-phase handler, which fires regardless of whether the click
          // matched a selectable item. That's the standard autoClose behavior;
          // disabled-item handling is purely about whether selection happens.
          resolve()
        })

        combobox.show()
      })
    })

    it('should leave the current selection in place when the same item is re-clicked', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger({ preSelected: '2' })
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[1].click()
          expect(items[1]).toHaveClass('selected')
          expect(items[1].getAttribute('aria-selected')).toEqual('true')
          resolve()
        })

        combobox.show()
      })
    })

    it('should restore placeholder text when no item is selected on construction', () => {
      fixtureEl.innerHTML = buildButtonTrigger({ placeholder: 'Pick one…' })
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const valueEl = fixtureEl.querySelector('.combobox-value')

      // eslint-disable-next-line no-new
      new Combobox(toggleEl, { placeholder: 'Pick one…' })

      expect(valueEl.textContent.trim()).toEqual('Pick one…')
      expect(valueEl).toHaveClass('combobox-placeholder')
    })
  })

  // ---------------------------------------------------------------------------
  // Multiple-select behaviour
  // ---------------------------------------------------------------------------

  describe('multiple-select', () => {
    it('should toggle .selected on click instead of replacing', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl, { multiple: true })

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[0].click()
          items[1].click()
          expect(items[0]).toHaveClass('selected')
          expect(items[1]).toHaveClass('selected')
          expect(items[2]).not.toHaveClass('selected')
          resolve()
        })

        combobox.show()
      })
    })

    it('should deselect an already-selected item when clicked again', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl, { multiple: true })

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[0].click()
          expect(items[0]).toHaveClass('selected')
          expect(items[0].getAttribute('aria-selected')).toEqual('true')

          items[0].click()
          expect(items[0]).not.toHaveClass('selected')
          expect(items[0].getAttribute('aria-selected')).toEqual('false')
          resolve()
        })

        combobox.show()
      })
    })

    it('should fire change.cx.combobox with an array value', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl, { multiple: true })

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[0].click()

          let secondChange = null
          toggleEl.addEventListener('change.cx.combobox', event => {
            secondChange = event
          })

          items[2].click()
          expect(secondChange.value).toEqual(['1', '3'])
          resolve()
        })

        combobox.show()
      })
    })

    it('should display "N selected" when more than one item is selected', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const valueEl = fixtureEl.querySelector('.combobox-value')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl, { multiple: true })

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[0].click()
          items[1].click()
          items[2].click()
          expect(valueEl.textContent.trim()).toEqual('3 selected')
          resolve()
        })

        combobox.show()
      })
    })

    it('should display the single item label when only one is selected', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const valueEl = fixtureEl.querySelector('.combobox-value')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl, { multiple: true })

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[1].click()
          expect(valueEl.textContent.trim()).toEqual('Option 2')
          resolve()
        })

        combobox.show()
      })
    })

    it('should keep the menu open after selection (autoClose: outside)', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const menuEl = fixtureEl.querySelector('.menu')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl, { multiple: true })

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[0].click()
          items[1].click()

          // After selections, menu should still be open
          expect(menuEl).toHaveClass('show')
          resolve()
        })

        combobox.show()
      })
    })
  })

  // ---------------------------------------------------------------------------
  // Hidden form input
  // ---------------------------------------------------------------------------

  describe('hidden form input', () => {
    it('should NOT create a hidden input when the name option is null', () => {
      fixtureEl.innerHTML = buildButtonTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const combobox = new Combobox(toggleEl)

      expect(combobox._hiddenInput).toBeNull()
      expect(fixtureEl.querySelector('input[type="hidden"]')).toBeNull()
    })

    it('should create a hidden input with the configured name when set', () => {
      fixtureEl.innerHTML = buildButtonTrigger({ name: 'role' })
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const combobox = new Combobox(toggleEl)

      expect(combobox._hiddenInput).not.toBeNull()
      expect(combobox._hiddenInput.type).toEqual('hidden')
      expect(combobox._hiddenInput.name).toEqual('role')
      expect(combobox._hiddenInput.value).toEqual('')
    })

    it('should insert the hidden input as a previous sibling of the toggle', () => {
      fixtureEl.innerHTML = buildButtonTrigger({ name: 'role' })
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const combobox = new Combobox(toggleEl)

      expect(toggleEl.previousElementSibling).toEqual(combobox._hiddenInput)
    })

    it('should update the hidden input value on single-select selection', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger({ name: 'role' })
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[1].click()
          expect(combobox._hiddenInput.value).toEqual('2')
          resolve()
        })

        combobox.show()
      })
    })

    it('should join multiple-select values with comma in the hidden input', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger({ name: 'roles' })
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl, { multiple: true })

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[0].click()
          items[2].click()
          expect(combobox._hiddenInput.value).toEqual('1,3')
          resolve()
        })

        combobox.show()
      })
    })

    it('should initialise the hidden input value from pre-selected items', () => {
      fixtureEl.innerHTML = buildButtonTrigger({ name: 'role', preSelected: '2' })
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const combobox = new Combobox(toggleEl)

      expect(combobox._hiddenInput.value).toEqual('2')
    })
  })

  // ---------------------------------------------------------------------------
  // BaseComponent integration (getInstance / getOrCreateInstance)
  // ---------------------------------------------------------------------------

  describe('getInstance', () => {
    it('should return the existing instance for a registered element', () => {
      fixtureEl.innerHTML = buildButtonTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const combobox = new Combobox(toggleEl)

      expect(Combobox.getInstance(toggleEl)).toEqual(combobox)
    })

    it('should return null for an element with no instance', () => {
      fixtureEl.innerHTML = buildButtonTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')

      expect(Combobox.getInstance(toggleEl)).toBeNull()
    })
  })

  describe('getOrCreateInstance', () => {
    it('should create a new instance when none exists', () => {
      fixtureEl.innerHTML = buildButtonTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')

      const combobox = Combobox.getOrCreateInstance(toggleEl)
      expect(combobox).toBeInstanceOf(Combobox)
      expect(Combobox.getInstance(toggleEl)).toEqual(combobox)
    })

    it('should return the same instance on subsequent calls', () => {
      fixtureEl.innerHTML = buildButtonTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')

      const first = Combobox.getOrCreateInstance(toggleEl)
      const second = Combobox.getOrCreateInstance(toggleEl)
      expect(first).toEqual(second)
    })
  })

  // ---------------------------------------------------------------------------
  // Text-input trigger mode
  //
  // When `.combobox-value` is an `<input>`, the combobox runs in autocomplete
  // mode: typing into the toggle's text input filters the menu inline (rather
  // than going through a separate `.combobox-search-input`). The menu opens on
  // focus, follows the visible-results count on input, and the input's value
  // is restored to the selected item label (or cleared) on close.
  // ---------------------------------------------------------------------------

  describe('text-input trigger mode', () => {
    it('should focus the comboInput when show() is called (via requestAnimationFrame)', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildInputTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const inputEl = fixtureEl.querySelector('input.combobox-value')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          // Focus shift is scheduled via rAF — wait for it
          setTimeout(() => {
            expect(document.activeElement).toEqual(inputEl)
            resolve()
          }, 30)
        })

        combobox.show()
      })
    })

    it('should call select() on the comboInput on show (for easy overtyping)', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildInputTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const inputEl = fixtureEl.querySelector('input.combobox-value')
        inputEl.value = 'Option one'
        const selectSpy = spyOn(inputEl, 'select').and.callThrough()
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          // select() is called inside the rAF after focus()
          setTimeout(() => {
            expect(selectSpy).toHaveBeenCalled()
            resolve()
          }, 30)
        })

        combobox.show()
      })
    })

    it('should reset the filter on show so all items are visible', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildInputTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        // Manually hide an item to simulate a previous filter state
        items[1].style.display = 'none'

        toggleEl.addEventListener('shown.cx.combobox', () => {
          for (const item of items) {
            expect(item.style.display).toEqual('')
          }

          resolve()
        })

        combobox.show()
      })
    })

    it('should open the menu when the comboInput receives focus', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildInputTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const inputEl = fixtureEl.querySelector('input.combobox-value')
        const menuEl = fixtureEl.querySelector('.menu')
        // eslint-disable-next-line no-new
        new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          expect(menuEl).toHaveClass('show')
          resolve()
        })

        inputEl.focus()
      })
    })

    it('should NOT open the menu on focus when _ignoreNextFocus is set', () => {
      fixtureEl.innerHTML = buildInputTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const inputEl = fixtureEl.querySelector('input.combobox-value')
      const menuEl = fixtureEl.querySelector('.menu')
      const combobox = new Combobox(toggleEl)

      combobox._ignoreNextFocus = true
      inputEl.focus()

      expect(menuEl).not.toHaveClass('show')
      // Flag is single-fire — consumed by the focus handler
      expect(combobox._ignoreNextFocus).toBeFalse()
    })

    it('should open (not toggle) when clicking on the comboInput via data-api', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildInputTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const inputEl = fixtureEl.querySelector('input.combobox-value')
        const menuEl = fixtureEl.querySelector('.menu')

        toggleEl.addEventListener('shown.cx.combobox', () => {
          // Click again with menu already shown — should NOT toggle off
          let secondClickHidFired = false
          toggleEl.addEventListener('hide.cx.combobox', () => { secondClickHidFired = true })

          inputEl.click()

          setTimeout(() => {
            expect(menuEl).toHaveClass('show')
            expect(secondClickHidFired).toBeFalse()
            resolve()
          }, 20)
        }, { once: true })

        inputEl.click()
      })
    })

    it('should filter menu items as the user types into the comboInput', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildInputTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const inputEl = fixtureEl.querySelector('input.combobox-value')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          // All items match "Option" initially
          inputEl.value = 'two'
          inputEl.dispatchEvent(new Event('input', { bubbles: true }))

          // Only "Option two" should be visible
          expect(items[0].style.display).toEqual('none')
          expect(items[1].style.display).toEqual('')
          expect(items[2].style.display).toEqual('none')
          combobox.hide()
          resolve()
        })

        combobox.show()
      })
    })

    it('should auto-hide the menu when typing produces zero matches', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildInputTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const inputEl = fixtureEl.querySelector('input.combobox-value')
        const menuEl = fixtureEl.querySelector('.menu')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          inputEl.value = 'zzz-no-match-zzz'
          inputEl.dispatchEvent(new Event('input', { bubbles: true }))

          expect(menuEl).not.toHaveClass('show')
          combobox.hide()
          resolve()
        })

        combobox.show()
      })
    })

    it('should auto-reopen the menu when backspacing from no-match to a match', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildInputTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const inputEl = fixtureEl.querySelector('input.combobox-value')
        const menuEl = fixtureEl.querySelector('.menu')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          // First filter to no-match — menu auto-hides
          inputEl.value = 'zzz'
          inputEl.dispatchEvent(new Event('input', { bubbles: true }))
          expect(menuEl).not.toHaveClass('show')

          // Then backspace to a partial that DOES match — menu auto-reopens
          inputEl.value = 'two'
          inputEl.dispatchEvent(new Event('input', { bubbles: true }))
          expect(menuEl).toHaveClass('show')

          combobox.hide()
          resolve()
        })

        combobox.show()
      })
    })

    it('should restore the input value to the selected item label on close', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildInputTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const inputEl = fixtureEl.querySelector('input.combobox-value')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          // Direct value assignment (no `input` event) so the menu stays open —
          // dispatching `input` with a non-matching string would auto-hide the
          // menu via the input handler, short-circuiting the lifecycle this
          // test wants to observe.
          inputEl.value = 'partial'

          // Selection triggers combobox.hide() internally, which fires the
          // full hide → hidden lifecycle and _restoreAfterClose along the way.
          items[1].click()
        })

        toggleEl.addEventListener('hidden.cx.combobox', () => {
          expect(inputEl.value).toEqual('Option two')
          resolve()
        })

        combobox.show()
      })
    })

    it('should clear the input value on close when nothing is selected', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildInputTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const inputEl = fixtureEl.querySelector('input.combobox-value')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          // Direct assign without firing `input` so the menu stays open and
          // combobox.hide() drives the full lifecycle (see note in the
          // selected-label restore test above).
          inputEl.value = 'partial query'
          combobox.hide()
        })

        toggleEl.addEventListener('hidden.cx.combobox', () => {
          expect(inputEl.value).toEqual('')
          resolve()
        })

        combobox.show()
      })
    })

    it('should restore all items visibility on close (clear residual filter)', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildInputTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const inputEl = fixtureEl.querySelector('input.combobox-value')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          inputEl.value = 'two'
          inputEl.dispatchEvent(new Event('input', { bubbles: true }))
          // Only 1 item visible
          expect(items[0].style.display).toEqual('none')
          expect(items[2].style.display).toEqual('none')

          combobox.hide()
        })

        toggleEl.addEventListener('hidden.cx.combobox', () => {
          for (const item of items) {
            expect(item.style.display).toEqual('')
          }

          resolve()
        })

        combobox.show()
      })
    })

    it('should refocus the comboInput and set _ignoreNextFocus after selection', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildInputTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const inputEl = fixtureEl.querySelector('input.combobox-value')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[1].click()

          // _ignoreNextFocus is set BEFORE focus() is called so the focus
          // handler skips the reopen path. By the time the focus event fires
          // (synchronously on .focus()), the flag has been consumed.
          // We can verify focus moved to the input and the menu didn't reopen.
          expect(document.activeElement).toEqual(inputEl)
          expect(fixtureEl.querySelector('.menu')).not.toHaveClass('show')
          resolve()
        })

        combobox.show()
      })
    })

    it('should refocus the comboInput on Escape from the menu', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildInputTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const inputEl = fixtureEl.querySelector('input.combobox-value')
        const menuEl = fixtureEl.querySelector('.menu')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          // Move focus into the menu then press Escape
          const firstItem = fixtureEl.querySelectorAll('.menu-item')[0]
          firstItem.focus()

          const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
          menuEl.dispatchEvent(escapeEvent)

          expect(menuEl).not.toHaveClass('show')
          expect(document.activeElement).toEqual(inputEl)
          resolve()
        })

        combobox.show()
      })
    })

    it('should NOT trigger show on Enter when target is the comboInput (so typing works)', () => {
      fixtureEl.innerHTML = buildInputTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const inputEl = fixtureEl.querySelector('input.combobox-value')
      const menuEl = fixtureEl.querySelector('.menu')
      // eslint-disable-next-line no-new
      new Combobox(toggleEl)

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      Object.defineProperty(enterEvent, 'target', { value: inputEl })
      toggleEl.dispatchEvent(enterEvent)

      // _handleToggleKeydown guards against opening when target IS the comboInput
      expect(menuEl).not.toHaveClass('show')
    })

    it('should NOT trigger show on Space when target is the comboInput', () => {
      fixtureEl.innerHTML = buildInputTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const inputEl = fixtureEl.querySelector('input.combobox-value')
      const menuEl = fixtureEl.querySelector('.menu')
      // eslint-disable-next-line no-new
      new Combobox(toggleEl)

      const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
      Object.defineProperty(spaceEvent, 'target', { value: inputEl })
      toggleEl.dispatchEvent(spaceEvent)

      expect(menuEl).not.toHaveClass('show')
    })

    it('should ignore .combobox-search-input even if both are present in markup', () => {
      // Defensive: when a markup mix-up puts a search input inside the menu of
      // an input-trigger combobox, the input handler should not be wired up to
      // the search input (else filtering fires twice on every keystroke).
      fixtureEl.innerHTML = [
        '<div class="form-input combobox" data-cx-toggle="combobox">',
        '  <input type="text" class="combobox-value" autocomplete="off">',
        '</div>',
        '<div class="menu" role="listbox">',
        '  <input type="text" class="combobox-search-input">',
        '  <button class="menu-item" type="button" data-cx-value="1">Option one</button>',
        '  <button class="menu-item" type="button" data-cx-value="2">Option two</button>',
        '</div>'
      ].join('')

      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const searchInputEl = fixtureEl.querySelector('.combobox-search-input')
      const items = fixtureEl.querySelectorAll('.menu-item')
      const combobox = new Combobox(toggleEl)

      // Typing in the search input should NOT filter anything (no handler bound)
      searchInputEl.value = 'two'
      searchInputEl.dispatchEvent(new Event('input', { bubbles: true }))

      // All items still visible — the search input is decorative in this mode
      expect(items[0].style.display).toEqual('')
      expect(items[1].style.display).toEqual('')

      // Sanity: _searchInput is null per the constructor's defensive check
      expect(combobox._searchInput).toBeNull()
    })
  })

  // ---------------------------------------------------------------------------
  // Keyboard navigation — from the toggle
  // ---------------------------------------------------------------------------

  describe('keyboard from toggle', () => {
    // `_handleToggleKeydown` calls `show()` (which fires `shown.cx.combobox`
    // synchronously) THEN calls `target.focus()`. Asserting inside a
    // `shown.cx.combobox` listener runs BEFORE the focus call. These tests
    // assert synchronously after `dispatchEvent` instead, which returns only
    // after the full handler (show + focus) has completed.

    it('should open the menu and focus the first visible item on ArrowDown', () => {
      fixtureEl.innerHTML = buildButtonTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const menuEl = fixtureEl.querySelector('.menu')
      const items = fixtureEl.querySelectorAll('.menu-item')
      // eslint-disable-next-line no-new
      new Combobox(toggleEl)

      toggleEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))

      expect(menuEl).toHaveClass('show')
      expect(document.activeElement).toEqual(items[0])
    })

    it('should open the menu and focus the last visible item on ArrowUp', () => {
      fixtureEl.innerHTML = buildButtonTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      const menuEl = fixtureEl.querySelector('.menu')
      const items = fixtureEl.querySelectorAll('.menu-item')
      // eslint-disable-next-line no-new
      new Combobox(toggleEl)

      toggleEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }))

      expect(menuEl).toHaveClass('show')
      expect(document.activeElement).toEqual(items[items.length - 1])
    })

    it('should open the menu on Enter when target is not the comboInput', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const menuEl = fixtureEl.querySelector('.menu')
        // eslint-disable-next-line no-new
        new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          expect(menuEl).toHaveClass('show')
          resolve()
        })

        toggleEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
      })
    })

    it('should open the menu on Space when target is not the comboInput', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const menuEl = fixtureEl.querySelector('.menu')
        // eslint-disable-next-line no-new
        new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          expect(menuEl).toHaveClass('show')
          resolve()
        })

        toggleEl.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }))
      })
    })

    it('should call preventDefault on ArrowDown/ArrowUp from the toggle', () => {
      fixtureEl.innerHTML = buildButtonTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
      // eslint-disable-next-line no-new
      new Combobox(toggleEl)

      const arrowDown = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
      toggleEl.dispatchEvent(arrowDown)
      expect(arrowDown.defaultPrevented).toBeTrue()
    })
  })

  // ---------------------------------------------------------------------------
  // Keyboard navigation — inside the open menu
  // ---------------------------------------------------------------------------

  describe('keyboard inside menu', () => {
    it('should focus the next visible item on ArrowDown from a focused item', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[0].focus()
          items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))
          expect(document.activeElement).toEqual(items[1])
          resolve()
        })

        combobox.show()
      })
    })

    it('should focus the previous visible item on ArrowUp from a focused item', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[2].focus()
          items[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }))
          expect(document.activeElement).toEqual(items[1])
          resolve()
        })

        combobox.show()
      })
    })

    it('should jump to the first visible item on Home', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[2].focus()
          items[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }))
          expect(document.activeElement).toEqual(items[0])
          resolve()
        })

        combobox.show()
      })
    })

    it('should jump to the last visible item on End', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[0].focus()
          items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }))
          expect(document.activeElement).toEqual(items[items.length - 1])
          resolve()
        })

        combobox.show()
      })
    })

    it('should select the focused item on Enter', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[1].focus()
          items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
          expect(items[1]).toHaveClass('selected')
          resolve()
        })

        combobox.show()
      })
    })

    it('should select the focused item on Space', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[1].focus()
          items[1].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }))
          expect(items[1]).toHaveClass('selected')
          resolve()
        })

        combobox.show()
      })
    })

    it('should NOT select a disabled item on Enter', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const items = fixtureEl.querySelectorAll('.menu-item')
        items[1].classList.add('disabled')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[1].focus()
          items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
          expect(items[1]).not.toHaveClass('selected')
          resolve()
        })

        combobox.show()
      })
    })

    it('should close the menu and refocus the toggle on Escape', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const menuEl = fixtureEl.querySelector('.menu')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[0].focus()
          items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
          expect(menuEl).not.toHaveClass('show')
          expect(document.activeElement).toEqual(toggleEl)
          resolve()
        })

        combobox.show()
      })
    })

    it('should close the menu on Tab', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const menuEl = fixtureEl.querySelector('.menu')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          items[0].focus()
          items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
          expect(menuEl).not.toHaveClass('show')
          resolve()
        })

        combobox.show()
      })
    })
  })

  // ---------------------------------------------------------------------------
  // Search-input keyboard (button-trigger mode with .combobox-search-input)
  // ---------------------------------------------------------------------------

  describe('search input keyboard', () => {
    const buildButtonTriggerWithSearch = () => [
      '<button class="form-input combobox" type="button" data-cx-toggle="combobox">',
      '  <span class="combobox-value"></span>',
      '</button>',
      '<div class="menu" role="listbox">',
      '  <div class="combobox-search">',
      '    <input type="text" class="combobox-search-input">',
      '  </div>',
      '  <button class="menu-item" type="button" data-cx-value="1">Option one</button>',
      '  <button class="menu-item" type="button" data-cx-value="2">Option two</button>',
      '</div>'
    ].join('')

    it('should focus the first visible item on ArrowDown from the search input', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTriggerWithSearch()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const searchInputEl = fixtureEl.querySelector('.combobox-search-input')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          // searchInput receives focus on show via rAF — wait for it
          setTimeout(() => {
            searchInputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))
            expect(document.activeElement).toEqual(items[0])
            resolve()
          }, 30)
        })

        combobox.show()
      })
    })

    it('should filter items as the user types in the search input', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTriggerWithSearch()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const searchInputEl = fixtureEl.querySelector('.combobox-search-input')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          searchInputEl.value = 'two'
          searchInputEl.dispatchEvent(new Event('input', { bubbles: true }))

          expect(items[0].style.display).toEqual('none')
          expect(items[1].style.display).toEqual('')
          resolve()
        })

        combobox.show()
      })
    })

    it('should close the menu and refocus the toggle on Escape in the search input', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTriggerWithSearch()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const searchInputEl = fixtureEl.querySelector('.combobox-search-input')
        const menuEl = fixtureEl.querySelector('.menu')
        const combobox = new Combobox(toggleEl)

        toggleEl.addEventListener('shown.cx.combobox', () => {
          setTimeout(() => {
            searchInputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
            expect(menuEl).not.toHaveClass('show')
            expect(document.activeElement).toEqual(toggleEl)
            resolve()
          }, 30)
        })

        combobox.show()
      })
    })
  })

  // ---------------------------------------------------------------------------
  // searchNormalize option (NFD diacritics strip)
  // ---------------------------------------------------------------------------

  describe('searchNormalize option', () => {
    const buildInputTriggerWithDiacritics = () => [
      '<div class="form-input combobox" data-cx-toggle="combobox">',
      '  <input type="text" class="combobox-value" autocomplete="off">',
      '</div>',
      '<div class="menu" role="listbox">',
      '  <button class="menu-item" type="button" data-cx-value="1">Café</button>',
      '  <button class="menu-item" type="button" data-cx-value="2">Garçon</button>',
      '  <button class="menu-item" type="button" data-cx-value="3">Plain</button>',
      '</div>'
    ].join('')

    // Note: a "default mode preserves diacritics" test is intentionally omitted.
    // HTML parsers can store characters like "é" in either NFC (U+00E9 single
    // codepoint) or NFD (U+0065 + combining acute) form; in NFD, `'cafe'.
    // includes('cafe')` IS true because the combining mark trails the base.
    // The negative case isn't reliably testable without normalizing the fixture
    // first. The positive tests below verify the actual feature.

    it('should strip diacritics when searchNormalize is true', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildInputTriggerWithDiacritics()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const inputEl = fixtureEl.querySelector('input.combobox-value')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl, { searchNormalize: true })

        toggleEl.addEventListener('shown.cx.combobox', () => {
          inputEl.value = 'cafe'  // No accent
          inputEl.dispatchEvent(new Event('input', { bubbles: true }))

          // "Café" matches "cafe" because both get normalized
          expect(items[0].style.display).toEqual('')
          expect(items[1].style.display).toEqual('none')
          expect(items[2].style.display).toEqual('none')
          resolve()
        })

        combobox.show()
      })
    })

    it('should match items with diacritics-typed query when searchNormalize is true', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildInputTriggerWithDiacritics()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const inputEl = fixtureEl.querySelector('input.combobox-value')
        const items = fixtureEl.querySelectorAll('.menu-item')
        const combobox = new Combobox(toggleEl, { searchNormalize: true })

        toggleEl.addEventListener('shown.cx.combobox', () => {
          inputEl.value = 'café'  // Query has accent too
          inputEl.dispatchEvent(new Event('input', { bubbles: true }))

          expect(items[0].style.display).toEqual('')  // Still matches itself
          resolve()
        })

        combobox.show()
      })
    })
  })

  // ---------------------------------------------------------------------------
  // Data-api
  // ---------------------------------------------------------------------------

  describe('data-api', () => {
    it('should toggle the combobox when clicking the toggle button (non-input target)', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = buildButtonTrigger()
        const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')
        const menuEl = fixtureEl.querySelector('.menu')

        toggleEl.addEventListener('shown.cx.combobox', () => {
          expect(menuEl).toHaveClass('show')
          resolve()
        }, { once: true })

        toggleEl.click()
      })
    })

    it('should preventDefault on toggle button click', () => {
      fixtureEl.innerHTML = buildButtonTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')

      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true })
      toggleEl.dispatchEvent(clickEvent)

      // Data-api handler calls preventDefault for non-comboInput targets
      expect(clickEvent.defaultPrevented).toBeTrue()
    })

    it('should auto-instantiate via getOrCreateInstance on first click', () => {
      fixtureEl.innerHTML = buildButtonTrigger()
      const toggleEl = fixtureEl.querySelector('[data-cx-toggle="combobox"]')

      // No explicit `new Combobox(...)` — only the data-api click triggers it
      expect(Combobox.getInstance(toggleEl)).toBeNull()

      toggleEl.click()
      expect(Combobox.getInstance(toggleEl)).toBeInstanceOf(Combobox)
    })
  })
})
