/**
 * --------------------------------------------------------------------------
 * Chassis CSS chip-input.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */

import BaseComponent from './base-component.js'
import Chip from './chip.js'
import EventHandler, { type ChassisEvent } from './dom/event-handler.js'
import SelectorEngine from './dom/selector-engine.js'
import { getClipboardText } from './util/index.js'

/**
 * Constants
 */

const NAME = 'chip-input'
const DATA_KEY = 'cx.chip-input'
const EVENT_KEY = `.${DATA_KEY}`
const DATA_API_KEY = '.data-api'

const EVENT_ADD = `add${EVENT_KEY}`
const EVENT_REMOVE = `remove${EVENT_KEY}`
const EVENT_CHANGE = `change${EVENT_KEY}`
const EVENT_SELECT = `select${EVENT_KEY}`

const SELECTOR_DATA_CHIP_INPUT = '[data-cx-chips]'
const SELECTOR_GHOST_INPUT = '.ghost-input'
const SELECTOR_CHIP = '.chip'
const SELECTOR_CHIP_DISMISS = '.close-button'

const CLASS_NAME_CHIP = 'chip'
const CLASS_NAME_CHIP_DISMISS = 'close-button'
const CLASS_NAME_ACTIVE = 'active'

const DEFAULT_DISMISS_TEXT = '×'

type SelectChipOptions = {
  addToSelection?: boolean
  rangeSelect?: boolean
}

type ChipInputConfig = {
  separator: string | null
  allowDuplicates: boolean
  maxChips: number | null
  placeholder: string
  dismissible: boolean
  createOnBlur: boolean
  chipClass: string
  dismissText: string
}

const Default: ChipInputConfig = {
  separator: ',',
  allowDuplicates: false,
  maxChips: null,
  placeholder: '',
  dismissible: true,
  createOnBlur: true,
  chipClass: 'default',
  dismissText: DEFAULT_DISMISS_TEXT,
}

const DefaultType = {
  separator: '(string|null)',
  allowDuplicates: 'boolean',
  maxChips: '(number|null)',
  placeholder: 'string',
  dismissible: 'boolean',
  createOnBlur: 'boolean',
  chipClass: 'string',
  dismissText: 'string'
}

/**
 * Class definition
 */

class ChipInput extends BaseComponent {
  declare ['constructor']: typeof ChipInput
  protected declare _config: ChipInputConfig
  protected declare _input: HTMLInputElement | null
  protected declare _selectedChips: Set<HTMLElement>
  protected declare _anchorChip: HTMLElement | null

  constructor(element?: string | Element | null, config?: Partial<ChipInputConfig> | null) {
    super(element, config)

    // Allow data-cx-chips="primary smooth" to set chip classes
    const attrValue = this._element.dataset.cxChips?.trim()
    if (attrValue) {
      this._config.chipClass = attrValue
    }

    this._input = SelectorEngine.findOne<HTMLInputElement>(SELECTOR_GHOST_INPUT, this._element)
    this._selectedChips = new Set()
    this._anchorChip = null // For shift+click range selection

    if (!this._input) {
      this._createInput()
    }

    this._initializeExistingChips()
    this._addEventListeners()
  }

  // Getters
  static override get Default(): ChipInputConfig {
    return Default
  }

  static override get DefaultType(): Record<string, string> {
    return DefaultType
  }

  static override get NAME(): string {
    return NAME
  }

  // Public
  add(value: string): HTMLElement | null {
    const trimmedValue = String(value).trim()

    if (!trimmedValue) {
      return null
    }

    const currentValues = this.getValues()

    // Check for duplicates
    if (!this._config.allowDuplicates && currentValues.includes(trimmedValue)) {
      return null
    }

    // Check max chips limit
    if (this._config.maxChips !== null && currentValues.length >= this._config.maxChips) {
      return null
    }

    const addEvent = EventHandler.trigger(this._element, EVENT_ADD, {
      value: trimmedValue,
      relatedTarget: this._input
    })

    if (addEvent.defaultPrevented) {
      return null
    }

    const chip = this._createChip(trimmedValue)
    this._element.insertBefore(chip, this._input)

    EventHandler.trigger(this._element, EVENT_CHANGE, {
      values: this.getValues()
    })

    return chip
  }

  remove(chipOrValue: HTMLElement | string): boolean {
    if (!chipOrValue) {
      return false
    }

    let chip: HTMLElement | undefined
    let value: string | undefined

    if (typeof chipOrValue === 'string') {
      value = chipOrValue
      chip = this._findChipByValue(value)
    } else {
      chip = chipOrValue
      value = this._getChipValue(chip)
    }

    if (!chip || !value) {
      return false
    }

    const removeEvent = EventHandler.trigger(this._element, EVENT_REMOVE, {
      value,
      chip,
      relatedTarget: this._input
    })

    if (removeEvent.defaultPrevented) {
      return false
    }

    // Remove from selection
    this._selectedChips.delete(chip)
    if (this._anchorChip === chip) {
      this._anchorChip = null
    }

    // Remove from DOM
    Chip.getInstance(chip)?.dispose()
    chip.remove()

    EventHandler.trigger(this._element, EVENT_CHANGE, {
      values: this.getValues()
    })

    return true
  }

  removeSelected(): void {
    const chipsToRemove = [...this._selectedChips]
    for (const chip of chipsToRemove) {
      this.remove(chip)
    }

    this._input?.focus()
  }

  getValues(): string[] {
    return this._getChipElements().map(chip => this._getChipValue(chip))
  }

  getSelectedValues(): string[] {
    return [...this._selectedChips].map(chip => this._getChipValue(chip))
  }

  clear(): void {
    const chips = SelectorEngine.find(SELECTOR_CHIP, this._element)
    for (const chip of chips) {
      EventHandler.trigger(this._element, EVENT_REMOVE, {
        value: this._getChipValue(chip),
        chip,
        relatedTarget: this._input
      })
      Chip.getInstance(chip)?.dispose()
      chip.remove()
    }

    this._selectedChips.clear()
    this._anchorChip = null

    EventHandler.trigger(this._element, EVENT_CHANGE, {
      values: []
    })
  }

  clearSelection(silent = false): void {
    for (const chip of this._selectedChips) {
      chip.classList.remove(CLASS_NAME_ACTIVE)
      chip.setAttribute('aria-selected', 'false')
    }

    this._selectedChips.clear()
    this._anchorChip = null

    if (!silent) {
      EventHandler.trigger(this._element, EVENT_SELECT, {
        selected: []
      })
    }
  }

  selectChip(chip: HTMLElement, options: SelectChipOptions = {}): void {
    const { addToSelection = false, rangeSelect = false } = options
    const chipElements = this._getChipElements()

    if (!chipElements.includes(chip)) {
      return
    }

    if (rangeSelect && this._anchorChip) {
      // Range selection from anchor to chip
      const anchorIndex = chipElements.indexOf(this._anchorChip)
      const chipIndex = chipElements.indexOf(chip)
      const start = Math.min(anchorIndex, chipIndex)
      const end = Math.max(anchorIndex, chipIndex)

      if (!addToSelection) {
        this.clearSelection(true)
      }

      for (let i = start; i <= end; i++) {
        this._selectedChips.add(chipElements[i])
        chipElements[i].classList.add(CLASS_NAME_ACTIVE)
        chipElements[i].setAttribute('aria-selected', 'true')
      }
    } else if (addToSelection) {
      // Toggle selection
      if (this._selectedChips.has(chip)) {
        this._selectedChips.delete(chip)
        chip.classList.remove(CLASS_NAME_ACTIVE)
        chip.setAttribute('aria-selected', 'false')
      } else {
        this._selectedChips.add(chip)
        chip.classList.add(CLASS_NAME_ACTIVE)
        chip.setAttribute('aria-selected', 'true')
        this._anchorChip = chip
      }
    } else {
      // Single selection
      this.clearSelection()
      this._selectedChips.add(chip)
      chip.classList.add(CLASS_NAME_ACTIVE)
      chip.setAttribute('aria-selected', 'true')
      this._anchorChip = chip
    }

    EventHandler.trigger(this._element, EVENT_SELECT, {
      selected: this.getSelectedValues()
    })
  }

  focus(): void {
    this._input?.focus()
  }

  override dispose(): void {
    for (const chip of this._getChipElements()) {
      Chip.getInstance(chip)?.dispose()
    }

    if (this._input) {
      EventHandler.off(this._input, EVENT_KEY)
    }

    super.dispose()
  }

  // Private
  protected _getChipElements(): HTMLElement[] {
    return SelectorEngine.find(SELECTOR_CHIP, this._element)
  }

  protected _createInput(): void {
    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'ghost-input'
    if (this._config.placeholder) {
      input.placeholder = this._config.placeholder
    }

    this._element.append(input)
    this._input = input
  }

  protected _initializeExistingChips(): void {
    const existingChips = SelectorEngine.find(SELECTOR_CHIP, this._element)
    for (const chip of existingChips) {
      const value = this._getChipValue(chip)
      if (value) {
        chip.dataset.cxChipValue = value
        this._setupChip(chip)
      }
    }
  }

  protected _setupChip(chip: HTMLElement): void {
    // Make chip focusable
    chip.setAttribute('tabindex', '0')
    chip.setAttribute('aria-selected', 'false')

    // Apply chip variant classes from config
    for (const cls of this._config.chipClass.split(/\s+/).filter(Boolean)) {
      chip.classList.add(cls)
    }

    // Add dismiss button if needed
    if (this._config.dismissible && !SelectorEngine.findOne(SELECTOR_CHIP_DISMISS, chip)) {
      chip.append(this._createDismissButton())
    }

    Chip.getOrCreateInstance(chip)
  }

  protected _createChip(value: string): HTMLElement {
    const chip = document.createElement('span')
    chip.className = CLASS_NAME_CHIP
    chip.dataset.cxChipValue = value

    // Add text node
    chip.append(document.createTextNode(value))

    // Setup chip (tabindex, dismiss button)
    this._setupChip(chip)

    return chip
  }

  protected _createDismissButton(): HTMLButtonElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = CLASS_NAME_CHIP_DISMISS
    button.setAttribute('aria-label', 'Remove')
    button.setAttribute('tabindex', '-1') // Not in tab order, chips handle keyboard
    button.textContent = this._config.dismissText
    return button
  }

  protected _findChipByValue(value: string): HTMLElement | undefined {
    const chips = this._getChipElements()
    return chips.find(chip => this._getChipValue(chip) === value)
  }

  protected _getChipValue(chip: HTMLElement): string {
    if (chip.dataset.cxChipValue) {
      return chip.dataset.cxChipValue
    }

    const clone = chip.cloneNode(true) as HTMLElement
    const dismiss = SelectorEngine.findOne(SELECTOR_CHIP_DISMISS, clone)
    if (dismiss) {
      dismiss.remove()
    }

    return clone.textContent?.trim() || ''
  }

  protected _addEventListeners(): void {
    // Input events
    EventHandler.on(this._input, `keydown${EVENT_KEY}`, event => this._handleInputKeydown(event))
    EventHandler.on(this._input, `input${EVENT_KEY}`, event => this._handleInput(event))
    EventHandler.on(this._input, `paste${EVENT_KEY}`, event => this._handlePaste(event))
    EventHandler.on(this._input, `focus${EVENT_KEY}`, () => this.clearSelection())

    if (this._config.createOnBlur) {
      EventHandler.on(this._input, `blur${EVENT_KEY}`, event => {
        // Don't create chip if clicking on a chip
        if (!event.relatedTarget?.closest(SELECTOR_CHIP)) {
          this._createChipFromInput()
        }
      })
    }

    // Chip click events (delegated)
    EventHandler.on(this._element, `click${EVENT_KEY}`, SELECTOR_CHIP, event => {
      // Ignore clicks on dismiss button
      if ((event.target as Element).closest(SELECTOR_CHIP_DISMISS)) {
        return
      }

      const chip = (event.target as Element).closest<HTMLElement>(SELECTOR_CHIP)
      if (chip) {
        event.preventDefault()
        this.selectChip(chip, {
          addToSelection: event.metaKey || event.ctrlKey,
          rangeSelect: event.shiftKey
        })
        chip.focus()
      }
    })

    // Dismiss button clicks (delegated)
    EventHandler.on(this._element, `click${EVENT_KEY}`, SELECTOR_CHIP_DISMISS, event => {
      event.stopPropagation()
      const chip = (event.target as Element).closest<HTMLElement>(SELECTOR_CHIP)
      if (chip) {
        this.remove(chip)
        this._input?.focus()
      }
    })

    // Chip keyboard events (delegated)
    EventHandler.on(this._element, `keydown${EVENT_KEY}`, SELECTOR_CHIP, event => {
      this._handleChipKeydown(event)
    })

    // Focus input when clicking container background
    EventHandler.on(this._element, `click${EVENT_KEY}`, event => {
      if (event.target === this._element) {
        this.clearSelection()
        this._input?.focus()
      }
    })
  }

  protected _handleInputKeydown(event: ChassisEvent): void {
    const { key } = event

    switch (key) {
      case 'Enter': {
        event.preventDefault()
        this._createChipFromInput()
        break
      }

      case 'Backspace':
      case 'Delete': {
        if (this._input!.value === '') {
          event.preventDefault()
          const chips = this._getChipElements()

          if (chips.length > 0) {
            // Select last chip and focus it
            const lastChip = chips.at(-1)!
            this.selectChip(lastChip)
            lastChip.focus()
          }
        }

        break
      }

      case 'ArrowLeft': {
        if (this._input!.selectionStart === 0 && this._input!.selectionEnd === 0) {
          event.preventDefault()
          const chips = this._getChipElements()
          if (chips.length > 0) {
            const lastChip = chips.at(-1)!
            if (event.shiftKey) {
              this.selectChip(lastChip, { addToSelection: true })
            } else {
              this.selectChip(lastChip)
            }

            lastChip.focus()
          }
        }

        break
      }

      case 'Escape': {
        this._input!.value = ''
        this.clearSelection()
        this._input!.blur()
        break
      }

      // No default
    }
  }

  protected _handleChipKeydown(event: ChassisEvent): void {
    const { key } = event
    const chip = (event.target as Element).closest<HTMLElement>(SELECTOR_CHIP)
    if (!chip) {
      return
    }

    const chips = this._getChipElements()
    const currentIndex = chips.indexOf(chip)

    switch (key) {
      case 'Backspace':
      case 'Delete': {
        event.preventDefault()
        this._handleChipDelete(currentIndex, chips)
        break
      }

      case 'ArrowLeft': {
        event.preventDefault()
        this._navigateChip(chips, currentIndex, -1, event.shiftKey)
        break
      }

      case 'ArrowRight': {
        event.preventDefault()
        this._navigateChip(chips, currentIndex, 1, event.shiftKey)
        break
      }

      case 'Home': {
        event.preventDefault()
        this._navigateToEdge(chips, 0, event.shiftKey)
        break
      }

      case 'End': {
        event.preventDefault()
        this.clearSelection()
        this._input?.focus()
        break
      }

      case 'a': {
        this._handleSelectAll(event, chips)
        break
      }

      case 'Escape': {
        event.preventDefault()
        this.clearSelection()
        this._input?.focus()
        break
      }

      // No default
    }
  }

  protected _handleChipDelete(currentIndex: number, chips: HTMLElement[]): void {
    if (this._selectedChips.size === 0) {
      return
    }

    const nextIndex = Math.min(currentIndex, chips.length - this._selectedChips.size - 1)
    this.removeSelected()

    const remainingChips = this._getChipElements()
    if (remainingChips.length > 0) {
      const focusIndex = Math.max(0, Math.min(nextIndex, remainingChips.length - 1))
      remainingChips[focusIndex].focus()
      this.selectChip(remainingChips[focusIndex])
    } else {
      this._input?.focus()
    }
  }

  protected _navigateChip(chips: HTMLElement[], currentIndex: number, direction: number, shiftKey: boolean): void {
    const targetIndex = currentIndex + direction

    if (targetIndex >= 0 && targetIndex < chips.length) {
      const targetChip = chips[targetIndex]
      this.selectChip(targetChip, shiftKey ? { addToSelection: true, rangeSelect: true } : {})
      targetChip.focus()
    } else if (direction > 0) {
      this.clearSelection()
      this._input?.focus()
    }
    // direction < 0 at index 0: already at first chip, intentional no-op
  }

  protected _navigateToEdge(chips: HTMLElement[], targetIndex: number, shiftKey: boolean): void {
    if (chips.length === 0) {
      return
    }

    const targetChip = chips[targetIndex]
    this.selectChip(targetChip, shiftKey ? { rangeSelect: true } : {})
    targetChip.focus()
  }

  protected _handleSelectAll(event: ChassisEvent, chips: HTMLElement[]): void {
    if (!(event.metaKey || event.ctrlKey)) {
      return
    }

    event.preventDefault()
    for (const c of chips) {
      this._selectedChips.add(c)
      c.classList.add(CLASS_NAME_ACTIVE)
      c.setAttribute('aria-selected', 'true')
    }

    this._anchorChip = chips[0] ?? null

    EventHandler.trigger(this._element, EVENT_SELECT, {
      selected: this.getSelectedValues()
    })
  }

  protected _handleInput(event: ChassisEvent): void {
    const { value } = event.target as HTMLInputElement
    const { separator } = this._config

    if (separator && value.includes(separator)) {
      const parts = value.split(separator)
      for (const part of parts.slice(0, -1)) {
        this.add(part.trim())
      }

      this._input!.value = parts.at(-1)!
    }
  }

  protected _handlePaste(event: ChassisEvent): void {
    const { separator } = this._config
    if (!separator) {
      return
    }

    const pastedData = getClipboardText(event)
    if (pastedData.includes(separator)) {
      event.preventDefault()

      const parts = pastedData.split(separator)
      for (const part of parts.slice(0, -1)) {
        this.add(part.trim())
      }

      this._input!.value = parts.at(-1)!
    }
  }

  protected _createChipFromInput(): void {
    const value = this._input!.value.trim()
    if (value) {
      this.add(value)
      this._input!.value = ''
    }
  }
}

/**
 * Data API implementation
 */

EventHandler.on(document, `DOMContentLoaded${EVENT_KEY}${DATA_API_KEY}`, () => {
  for (const element of SelectorEngine.find(SELECTOR_DATA_CHIP_INPUT)) {
    ChipInput.getOrCreateInstance(element)
  }
})

export default ChipInput
export type { ChipInputConfig }
