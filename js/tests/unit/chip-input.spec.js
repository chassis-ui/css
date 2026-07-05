import Chip from '../../src/chip.js'
import ChipInput from '../../src/chip-input.js'
import { clearFixture, getFixture } from '../helpers/fixture.js'

describe('ChipInput', () => {
  let fixtureEl

  beforeAll(() => {
    fixtureEl = getFixture()
  })

  afterEach(() => {
    clearFixture()
  })

  const makeContainer = (chips = [], attributes = '') => {
    const chipHtml = chips.map(v => `<span class="chip">${v}</span>`).join('')
    fixtureEl.innerHTML = `<div data-cx-chips ${attributes}>${chipHtml}<input type="text" class="ghost-input"></div>`
    return fixtureEl.querySelector('[data-cx-chips]')
  }

  const keydown = (element, key, options = {}) => {
    element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...options }))
  }

  describe('VERSION', () => {
    it('should return plugin version', () => {
      expect(ChipInput.VERSION).toEqual(jasmine.any(String))
    })
  })

  describe('DATA_KEY', () => {
    it('should return plugin data key', () => {
      expect(ChipInput.DATA_KEY).toEqual('cx.chip-input')
    })
  })

  describe('Default', () => {
    it('should return default config', () => {
      expect(ChipInput.Default.separator).toEqual(',')
      expect(ChipInput.Default.allowDuplicates).toBeFalse()
      expect(ChipInput.Default.maxChips).toBeNull()
      expect(ChipInput.Default.dismissible).toBeTrue()
      expect(ChipInput.Default.createOnBlur).toBeTrue()
      expect(ChipInput.Default.chipClass).toEqual('default')
    })
  })

  describe('DefaultType', () => {
    it('should return default type config', () => {
      expect(ChipInput.DefaultType).toEqual(jasmine.any(Object))
    })
  })

  describe('constructor', () => {
    it('should create ghost input when none is present', () => {
      fixtureEl.innerHTML = '<div data-cx-chips></div>'

      const el = fixtureEl.querySelector('[data-cx-chips]')
      new ChipInput(el) // eslint-disable-line no-new

      expect(el.querySelector('.ghost-input')).not.toBeNull()
    })

    it('should use existing ghost input when present', () => {
      const el = makeContainer()
      const existingInput = el.querySelector('.ghost-input')
      const instance = new ChipInput(el)

      expect(instance._input).toEqual(existingInput)
    })

    it('should initialize values from pre-existing chips', () => {
      const el = makeContainer(['foo', 'bar'])
      const instance = new ChipInput(el)

      expect(instance.getValues()).toEqual(['foo', 'bar'])
    })

    it('should set data-cx-chip-value on pre-existing chips', () => {
      const el = makeContainer(['hello'])
      new ChipInput(el) // eslint-disable-line no-new

      expect(el.querySelector('.chip').dataset.cxChipValue).toEqual('hello')
    })

    it('should register pre-existing chips as Chip instances', () => {
      const el = makeContainer(['hello'])
      new ChipInput(el) // eslint-disable-line no-new

      expect(Chip.getInstance(el.querySelector('.chip'))).toBeInstanceOf(Chip)
    })

    it('should read chip class from data-cx-chips attribute', () => {
      fixtureEl.innerHTML = '<div data-cx-chips="primary smooth"><input type="text" class="ghost-input"></div>'
      const el = fixtureEl.querySelector('[data-cx-chips]')
      const instance = new ChipInput(el)

      instance.add('tag')

      const chip = el.querySelector('.chip')
      expect(chip).toHaveClass('primary')
      expect(chip).toHaveClass('smooth')
    })
  })

  describe('add', () => {
    it('should add a chip to the DOM and return it', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const chip = instance.add('foo')

      expect(el.querySelectorAll('.chip')).toHaveSize(1)
      expect(chip).toBeInstanceOf(HTMLElement)
      expect(chip).toHaveClass('chip')
    })

    it('should trim the value', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance.add('  foo  ')

      expect(instance.getValues()).toEqual(['foo'])
    })

    it('should return null for empty or whitespace-only value', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      expect(instance.add('')).toBeNull()
      expect(instance.add('   ')).toBeNull()
      expect(el.querySelectorAll('.chip')).toHaveSize(0)
    })

    it('should reject duplicate values by default', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance.add('foo')

      expect(instance.add('foo')).toBeNull()
      expect(el.querySelectorAll('.chip')).toHaveSize(1)
    })

    it('should allow duplicates when allowDuplicates is true', () => {
      const el = makeContainer()
      const instance = new ChipInput(el, { allowDuplicates: true })

      instance.add('foo')
      instance.add('foo')

      expect(el.querySelectorAll('.chip')).toHaveSize(2)
    })

    it('should respect maxChips limit', () => {
      const el = makeContainer()
      const instance = new ChipInput(el, { maxChips: 2 })

      instance.add('a')
      instance.add('b')

      expect(instance.add('c')).toBeNull()
      expect(el.querySelectorAll('.chip')).toHaveSize(2)
    })

    it('should fire add event with value', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)
      let capturedEvent

      el.addEventListener('add.cx.chip-input', event => { capturedEvent = event })
      instance.add('foo')

      expect(capturedEvent.value).toEqual('foo')
    })

    it('should not add chip if add event is prevented', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      el.addEventListener('add.cx.chip-input', event => event.preventDefault())

      expect(instance.add('foo')).toBeNull()
      expect(el.querySelectorAll('.chip')).toHaveSize(0)
    })

    it('should fire change event after adding', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)
      let capturedEvent

      el.addEventListener('change.cx.chip-input', event => { capturedEvent = event })
      instance.add('foo')

      expect(capturedEvent.values).toEqual(['foo'])
    })

    it('should register added chip as a Chip instance', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const chipEl = instance.add('foo')

      expect(Chip.getInstance(chipEl)).toBeInstanceOf(Chip)
    })
  })

  describe('remove', () => {
    it('should remove chip by value string', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance.add('foo')
      instance.remove('foo')

      expect(el.querySelectorAll('.chip')).toHaveSize(0)
    })

    it('should remove chip by element reference', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const chip = instance.add('foo')
      instance.remove(chip)

      expect(el.querySelectorAll('.chip')).toHaveSize(0)
    })

    it('should return false for null or undefined', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      expect(instance.remove(null)).toBeFalse()
      expect(instance.remove(undefined)).toBeFalse()
    })

    it('should return false for a value that does not exist', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      expect(instance.remove('nonexistent')).toBeFalse()
    })

    it('should return true on successful removal', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance.add('foo')

      expect(instance.remove('foo')).toBeTrue()
    })

    it('should fire remove event with value and chip element', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)
      let capturedEvent

      el.addEventListener('remove.cx.chip-input', event => { capturedEvent = event })

      const chip = instance.add('foo')
      instance.remove('foo')

      expect(capturedEvent.value).toEqual('foo')
      expect(capturedEvent.chip).toEqual(chip)
    })

    it('should not remove chip if remove event is prevented', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance.add('foo')
      el.addEventListener('remove.cx.chip-input', event => event.preventDefault())

      expect(instance.remove('foo')).toBeFalse()
      expect(el.querySelectorAll('.chip')).toHaveSize(1)
    })

    it('should fire change event after removal', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)
      let capturedEvent

      instance.add('foo')
      el.addEventListener('change.cx.chip-input', event => { capturedEvent = event })
      instance.remove('foo')

      expect(capturedEvent.values).toEqual([])
    })

    it('should remove chip from selected chips', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const chip = instance.add('foo')
      instance.selectChip(chip)
      instance.remove('foo')

      expect(instance.getSelectedValues()).toEqual([])
    })

    it('should clear anchorChip when that chip is removed', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const chip = instance.add('foo')
      instance.selectChip(chip)
      instance.remove('foo')

      expect(instance._anchorChip).toBeNull()
    })

    it('should dispose the Chip instance on removal', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const chip = instance.add('foo')
      expect(Chip.getInstance(chip)).not.toBeNull()

      instance.remove('foo')

      expect(Chip.getInstance(chip)).toBeNull()
    })
  })

  describe('removeSelected', () => {
    it('should remove all selected chips', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const a = instance.add('a')
      const b = instance.add('b')
      instance.add('c')

      instance.selectChip(a)
      instance.selectChip(b, { addToSelection: true })
      instance.removeSelected()

      expect(instance.getValues()).toEqual(['c'])
    })
  })

  describe('getValues', () => {
    it('should return current chip values in insertion order', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance.add('a')
      instance.add('b')
      instance.add('c')

      expect(instance.getValues()).toEqual(['a', 'b', 'c'])
    })

    it('should return a copy, not a reference to internal state', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance.add('a')
      instance.getValues().push('mutated')

      expect(instance.getValues()).toEqual(['a'])
    })
  })

  describe('getSelectedValues', () => {
    it('should return values of currently selected chips', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const a = instance.add('a')
      instance.add('b')
      instance.selectChip(a)

      expect(instance.getSelectedValues()).toEqual(['a'])
    })

    it('should return empty array when nothing is selected', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance.add('a')

      expect(instance.getSelectedValues()).toEqual([])
    })
  })

  describe('clear', () => {
    it('should remove all chips from DOM', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance.add('a')
      instance.add('b')
      instance.clear()

      expect(el.querySelectorAll('.chip')).toHaveSize(0)
    })

    it('should reset values to empty array', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance.add('a')
      instance.clear()

      expect(instance.getValues()).toEqual([])
    })

    it('should fire remove event for each chip', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)
      const removed = []

      instance.add('a')
      instance.add('b')
      el.addEventListener('remove.cx.chip-input', event => removed.push(event.value))
      instance.clear()

      expect(removed).toEqual(['a', 'b'])
    })

    it('should fire a single change event', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)
      let changeCount = 0

      instance.add('a')
      instance.add('b')
      el.addEventListener('change.cx.chip-input', () => changeCount++)
      instance.clear()

      expect(changeCount).toEqual(1)
    })
  })

  describe('clearSelection', () => {
    it('should remove active class from all selected chips', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const a = instance.add('a')
      const b = instance.add('b')
      instance.selectChip(a)
      instance.selectChip(b, { addToSelection: true })
      instance.clearSelection()

      expect(a).not.toHaveClass('active')
      expect(b).not.toHaveClass('active')
    })

    it('should fire select event with empty array', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)
      let capturedEvent

      const chip = instance.add('a')
      instance.selectChip(chip)
      el.addEventListener('select.cx.chip-input', event => { capturedEvent = event })
      instance.clearSelection()

      expect(capturedEvent.selected).toEqual([])
    })
  })

  describe('selectChip', () => {
    it('should add active class and aria-selected', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const chip = instance.add('a')
      instance.selectChip(chip)

      expect(chip).toHaveClass('active')
      expect(chip.getAttribute('aria-selected')).toEqual('true')
    })

    it('should clear previous selection on single select', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const a = instance.add('a')
      const b = instance.add('b')
      instance.selectChip(a)
      instance.selectChip(b)

      expect(a).not.toHaveClass('active')
      expect(b).toHaveClass('active')
    })

    it('should add chip to selection with addToSelection', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const a = instance.add('a')
      const b = instance.add('b')
      instance.selectChip(a)
      instance.selectChip(b, { addToSelection: true })

      expect(instance.getSelectedValues()).toContain('a')
      expect(instance.getSelectedValues()).toContain('b')
    })

    it('should deselect chip when toggling with addToSelection', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const chip = instance.add('a')
      instance.selectChip(chip)
      instance.selectChip(chip, { addToSelection: true })

      expect(chip).not.toHaveClass('active')
      expect(instance.getSelectedValues()).toEqual([])
    })

    it('should select a range from anchor to target', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const a = instance.add('a')
      instance.add('b')
      const c = instance.add('c')

      instance.selectChip(a)
      instance.selectChip(c, { rangeSelect: true })

      expect(instance.getSelectedValues()).toEqual(['a', 'b', 'c'])
    })

    it('should fire a single select event during range select', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)
      let selectCount = 0

      const a = instance.add('a')
      const b = instance.add('b')
      instance.selectChip(a)
      el.addEventListener('select.cx.chip-input', () => selectCount++)
      instance.selectChip(b, { rangeSelect: true })

      expect(selectCount).toEqual(1)
    })

    it('should fire select event with selected values', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)
      let capturedEvent

      const chip = instance.add('a')
      el.addEventListener('select.cx.chip-input', event => { capturedEvent = event })
      instance.selectChip(chip)

      expect(capturedEvent.selected).toEqual(['a'])
    })
  })

  describe('focus', () => {
    it('should focus the ghost input', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance.focus()

      expect(document.activeElement).toEqual(instance._input)
    })
  })

  describe('keyboard — input', () => {
    it('should create chip from input on Enter', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance._input.value = 'foo'
      keydown(instance._input, 'Enter')

      expect(instance.getValues()).toEqual(['foo'])
      expect(instance._input.value).toEqual('')
    })

    it('should select last chip on Backspace with empty input', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const chip = instance.add('foo')
      instance._input.value = ''
      keydown(instance._input, 'Backspace')

      expect(chip).toHaveClass('active')
    })

    it('should not select chip on Backspace when input has value', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const chip = instance.add('foo')
      instance._input.value = 'bar'
      keydown(instance._input, 'Backspace')

      expect(chip).not.toHaveClass('active')
    })

    it('should focus last chip on ArrowLeft at start of empty input', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const chip = instance.add('foo')
      instance._input.value = ''
      keydown(instance._input, 'ArrowLeft')

      expect(document.activeElement).toEqual(chip)
    })

    it('should clear input value on Escape', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance._input.focus()
      instance._input.value = 'typing'
      keydown(instance._input, 'Escape')

      expect(instance._input.value).toEqual('')
    })
  })

  describe('keyboard — chip', () => {
    it('should remove selected chip on Delete', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const chip = instance.add('foo')
      instance.selectChip(chip)
      keydown(chip, 'Delete')

      expect(instance.getValues()).toEqual([])
    })

    it('should remove selected chip on Backspace', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const chip = instance.add('foo')
      instance.selectChip(chip)
      keydown(chip, 'Backspace')

      expect(instance.getValues()).toEqual([])
    })

    it('should navigate to previous chip on ArrowLeft', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance.add('a')
      instance.add('b')
      const chips = el.querySelectorAll('.chip')

      chips[1].focus()
      keydown(chips[1], 'ArrowLeft')

      expect(document.activeElement).toEqual(chips[0])
    })

    it('should navigate to next chip on ArrowRight', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance.add('a')
      instance.add('b')
      const chips = el.querySelectorAll('.chip')

      chips[0].focus()
      keydown(chips[0], 'ArrowRight')

      expect(document.activeElement).toEqual(chips[1])
    })

    it('should move focus to input on ArrowRight from last chip', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const chip = instance.add('a')
      chip.focus()
      keydown(chip, 'ArrowRight')

      expect(document.activeElement).toEqual(instance._input)
    })

    it('should navigate to first chip on Home', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance.add('a')
      instance.add('b')
      instance.add('c')
      const chips = el.querySelectorAll('.chip')

      chips[2].focus()
      keydown(chips[2], 'Home')

      expect(document.activeElement).toEqual(chips[0])
    })

    it('should move focus to input on End', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const chip = instance.add('a')
      chip.focus()
      keydown(chip, 'End')

      expect(document.activeElement).toEqual(instance._input)
    })

    it('should move focus to input on Escape', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const chip = instance.add('a')
      chip.focus()
      keydown(chip, 'Escape')

      expect(document.activeElement).toEqual(instance._input)
    })

    it('should select all chips on Ctrl+A', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance.add('a')
      instance.add('b')
      instance.add('c')
      const chips = el.querySelectorAll('.chip')

      keydown(chips[0], 'a', { ctrlKey: true })

      expect(instance.getSelectedValues()).toEqual(['a', 'b', 'c'])
    })

    it('should set anchorChip to first chip after Ctrl+A', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance.add('a')
      instance.add('b')
      const chips = el.querySelectorAll('.chip')

      keydown(chips[0], 'a', { ctrlKey: true })

      expect(instance._anchorChip).toEqual(chips[0])
    })
  })

  describe('separator handling', () => {
    it('should create chips from input when separator is typed', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance._input.value = 'foo,bar,'
      instance._input.dispatchEvent(new Event('input', { bubbles: true }))

      expect(instance.getValues()).toContain('foo')
      expect(instance.getValues()).toContain('bar')
    })

    it('should leave trailing segment in input after separator', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance._input.value = 'foo,bar,baz'
      instance._input.dispatchEvent(new Event('input', { bubbles: true }))

      expect(instance._input.value).toEqual('baz')
      expect(instance.getValues()).not.toContain('baz')
    })
  })

  describe('paste handling', () => {
    it('should create chips from pasted text containing separator', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        clipboardData: new DataTransfer()
      })
      pasteEvent.clipboardData.setData('text', 'foo,bar,baz')
      instance._input.dispatchEvent(pasteEvent)

      expect(instance.getValues()).toContain('foo')
      expect(instance.getValues()).toContain('bar')
    })

    it('should leave last segment in input after paste', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        clipboardData: new DataTransfer()
      })
      pasteEvent.clipboardData.setData('text', 'foo,bar,baz')
      instance._input.dispatchEvent(pasteEvent)

      expect(instance._input.value).toEqual('baz')
    })

    it('should not intercept paste when no separator is configured', () => {
      const el = makeContainer()
      const instance = new ChipInput(el, { separator: null })

      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        clipboardData: new DataTransfer()
      })
      pasteEvent.clipboardData.setData('text', 'plain text')
      instance._input.dispatchEvent(pasteEvent)

      expect(instance.getValues()).toEqual([])
    })
  })

  describe('createOnBlur', () => {
    it('should create chip from input on blur', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance._input.value = 'foo'
      instance._input.dispatchEvent(new FocusEvent('blur', { bubbles: false }))

      expect(instance.getValues()).toContain('foo')
    })

    it('should not create chip on blur when createOnBlur is false', () => {
      const el = makeContainer()
      const instance = new ChipInput(el, { createOnBlur: false })

      instance._input.value = 'foo'
      instance._input.dispatchEvent(new FocusEvent('blur', { bubbles: false }))

      expect(instance.getValues()).toEqual([])
    })
  })

  describe('dismiss button', () => {
    it('should add dismiss button to chips by default', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance.add('foo')

      expect(el.querySelector('.chip .close-button')).not.toBeNull()
    })

    it('should not add dismiss button when dismissible is false', () => {
      const el = makeContainer()
      const instance = new ChipInput(el, { dismissible: false })

      instance.add('foo')

      expect(el.querySelector('.chip .close-button')).toBeNull()
    })

    it('should remove chip when dismiss button is clicked', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      instance.add('foo')
      el.querySelector('.close-button').click()

      expect(instance.getValues()).toEqual([])
    })
  })

  describe('chip click', () => {
    it('should select chip on click', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const chip = instance.add('foo')
      chip.click()

      expect(chip).toHaveClass('active')
    })

    it('should not select chip when dismiss button is clicked', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const chip = instance.add('foo')
      el.querySelector('.close-button').click()

      expect(Chip.getInstance(chip)).toBeNull()
    })
  })

  describe('dispose', () => {
    it('should remove instance from registry', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      expect(ChipInput.getInstance(el)).not.toBeNull()

      instance.dispose()

      expect(ChipInput.getInstance(el)).toBeNull()
    })

    it('should dispose all chip instances', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      const chip = instance.add('foo')
      expect(Chip.getInstance(chip)).not.toBeNull()

      instance.dispose()

      expect(Chip.getInstance(chip)).toBeNull()
    })
  })

  describe('getInstance', () => {
    it('should return chip-input instance', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      expect(ChipInput.getInstance(el)).toEqual(instance)
      expect(ChipInput.getInstance(el)).toBeInstanceOf(ChipInput)
    })

    it('should return null when no instance exists', () => {
      fixtureEl.innerHTML = '<div></div>'
      const div = fixtureEl.querySelector('div')

      expect(ChipInput.getInstance(div)).toBeNull()
    })
  })

  describe('getOrCreateInstance', () => {
    it('should return existing instance', () => {
      const el = makeContainer()
      const instance = new ChipInput(el)

      expect(ChipInput.getOrCreateInstance(el)).toEqual(instance)
      expect(ChipInput.getOrCreateInstance(el)).toBeInstanceOf(ChipInput)
    })

    it('should create new instance when none exists', () => {
      const el = makeContainer()

      expect(ChipInput.getInstance(el)).toBeNull()
      expect(ChipInput.getOrCreateInstance(el)).toBeInstanceOf(ChipInput)
    })
  })
})
