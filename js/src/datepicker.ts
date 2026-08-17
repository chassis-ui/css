/**
 * --------------------------------------------------------------------------
 * Chassis CSS datepicker.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */

import { Calendar, type Options } from 'vanilla-calendar-pro'
import BaseComponent from './base-component.js'
import EventHandler from './dom/event-handler.js'
import type { ComponentConfig } from './util/config.js'
import { isDisabled } from './util/index.js'

/**
 * Constants
 */

const NAME = 'datepicker'
const DATA_KEY = 'cx.datepicker'
const EVENT_KEY = `.${DATA_KEY}`
const DATA_API_KEY = '.data-api'

const EVENT_CHANGE = `change${EVENT_KEY}`
const EVENT_SHOW = `show${EVENT_KEY}`
const EVENT_SHOWN = `shown${EVENT_KEY}`
const EVENT_HIDE = `hide${EVENT_KEY}`
const EVENT_HIDDEN = `hidden${EVENT_KEY}`
const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`
const EVENT_FOCUSIN_DATA_API = `focusin${EVENT_KEY}${DATA_API_KEY}`

const SELECTOR_DATA_TOGGLE = '[data-cx-toggle="datepicker"]'

const HIDE_DELAY = 100 // ms delay before hiding after selection

const styles: Record<string, string> = {
    calendar: 'datepicker',
    controls: 'datepicker-controls',
    grid: 'datepicker-grid',
    column: 'datepicker-column',
    header: 'datepicker-header',
    headerContent: 'datepicker-header-content',
    month: 'datepicker-month',
    year: 'datepicker-year',
    arrowPrev: 'datepicker-arrow datepicker-arrow-prev',
    arrowNext: 'datepicker-arrow datepicker-arrow-next',
    wrapper: 'datepicker-wrapper',
    content: 'datepicker-content',
    months: 'datepicker-months',
    monthsMonth: 'datepicker-months-month',
    years: 'datepicker-years',
    yearsYear: 'datepicker-years-year',
    week: 'datepicker-week',
    weekDay: 'datepicker-week-day',
    weekNumbers: 'datepicker-week-numbers',
    weekNumbersTitle: 'datepicker-week-numbers-title',
    weekNumbersContent: 'datepicker-week-numbers-content',
    weekNumber: 'datepicker-week-number',
    dates: 'datepicker-dates',
    datesRow: 'datepicker-dates-row',
    date: 'datepicker-date',
    dateBtn: 'datepicker-date-btn',
    datePopup: 'datepicker-date-popup',
    dateRangeTooltip: 'datepicker-date-range-tooltip',
    time: 'datepicker-time',
    timeContent: 'datepicker-time-content',
    timeHour: 'datepicker-time-hour',
    timeMinute: 'datepicker-time-minute',
    timeKeeping: 'datepicker-time-keeping',
    timeRanges: 'datepicker-time-ranges',
    timeRange: 'datepicker-time-range',
}

type DatepickerConfig = {
  datepickerTheme: string | null // 'light', 'dark', 'auto' - explicit theme for datepicker popover only
  dateMin: string | number | Date | null
  dateMax: string | number | Date | null
  dateFormat: Intl.DateTimeFormatOptions | ((date: Date, locale?: string) => string) | null
  displayElement: string | HTMLElement | boolean | null // Element to show formatted date (defaults to element for buttons)
  displayMonthsCount: number // Number of months to display side-by-side
  firstWeekday: number // Monday
  inline: boolean // Render calendar inline (no popup)
  locale: string // Default to browser locale
  positionElement: string | HTMLElement | null // Element to position calendar relative to (defaults to input)
  selectedDates: string[]
  selectionMode: string // 'single', 'multiple', 'multiple-ranged'
  placement: string // 'left', 'center', 'right', 'auto'
  vcpOptions: Record<string, any> // Pass-through for any VCP option
  styles: Record<string, string> // Pass-through for any VCP style class overrides
}

const Default: DatepickerConfig = {
  datepickerTheme: null,
  dateMin: null,
  dateMax: null,
  dateFormat: null, // Intl.DateTimeFormat options, or function(date, locale) => string
  displayElement: null,
  displayMonthsCount: 1,
  firstWeekday: 1,
  inline: false,
  locale: navigator.language.substring(0, 2),
  positionElement: null,
  selectedDates: [],
  selectionMode: 'single',
  placement: 'left',
  vcpOptions: {},
  styles: styles
}

const DefaultType = {
  datepickerTheme: '(null|string)',
  dateMin: '(null|string|number|object)',
  dateMax: '(null|string|number|object)',
  dateFormat: '(null|object|function)',
  displayElement: '(null|string|element|boolean)',
  displayMonthsCount: 'number',
  firstWeekday: 'number',
  inline: 'boolean',
  locale: 'string',
  positionElement: '(null|string|element)',
  selectedDates: 'array',
  selectionMode: 'string',
  placement: 'string',
  vcpOptions: 'object',
  styles: 'object'
}

/**
 * Class definition
 */

class Datepicker extends BaseComponent {
  declare ['constructor']: typeof Datepicker
  protected declare _config: DatepickerConfig
  protected declare _calendar: Calendar | null
  protected declare _isShown: boolean
  protected declare _themeObserver: MutationObserver | null
  protected declare _isInput: boolean
  protected declare _isInline: boolean
  protected declare _boundInput: HTMLInputElement | null
  protected declare _positionElement: HTMLElement
  protected declare _displayElement: HTMLElement | false | null

  constructor(element?: string | Element | null, config?: Partial<DatepickerConfig> | null) {
    super(element, config)

    this._calendar = null
    this._isShown = false

    this._initCalendar()
  }

  // Getters
  static override get Default(): DatepickerConfig {
    return Default
  }

  static override get DefaultType(): Record<string, string> {
    return DefaultType
  }

  static override get NAME(): string {
    return NAME
  }

  // Public
  toggle(): void {
    // Check _calendar first: dispose() nulls every instance property
    // (including _config), and a deferred hide() (see _maybeHideAfterSelection)
    // can still fire after dispose.
    if (!this._calendar) {
      return
    }

    if (this._config.inline) {
      return // Inline calendars are always visible
    }

    if (this._isShown) {
      this.hide()
    } else {
      this.show()
    }
  }

  show(): void {
    if (!this._calendar) {
      return
    }

    if (this._config.inline) {
      return // Inline calendars are always visible
    }

    if (isDisabled(this._element) || this._isShown) {
      return
    }

    const showEvent = EventHandler.trigger(this._element, EVENT_SHOW)
    if (showEvent.defaultPrevented) {
      return
    }

    this._calendar.show()
    this._isShown = true

    EventHandler.trigger(this._element, EVENT_SHOWN)
  }

  hide(): void {
    if (!this._calendar) {
      return
    }

    if (this._config.inline) {
      return // Inline calendars are always visible
    }

    if (!this._isShown) {
      return
    }

    const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE)
    if (hideEvent.defaultPrevented) {
      return
    }

    this._calendar.hide()
    this._isShown = false

    EventHandler.trigger(this._element, EVENT_HIDDEN)
  }

  override dispose(): void {
    if (this._themeObserver) {
      this._themeObserver.disconnect()
      this._themeObserver = null
    }

    if (this._calendar) {
      this._calendar.destroy()
    }

    this._calendar = null
    super.dispose()
  }

  getSelectedDates(): string[] {
    const dates = this._calendar?.context?.selectedDates
    return dates ? [...dates] : []
  }

  setSelectedDates(dates: string[]): void {
    if (this._calendar) {
      this._calendar.set({ selectedDates: dates })
    }
  }

  // Private
  protected override _configAfterMerge(config: ComponentConfig): ComponentConfig {
    // Default.selectedDates/vcpOptions/styles are shared, mutable objects.
    // Clone them per instance so one datepicker can't leak state (or have
    // a third-party library mutate them) into another's config.
    config.selectedDates = [...config.selectedDates]
    config.vcpOptions = { ...config.vcpOptions }
    config.styles = { ...config.styles }
    return config
  }

  protected _initCalendar(): void {
    this._isInput = this._element.tagName === 'INPUT'
    this._isInline = this._config.inline

    // For inline mode, look for a hidden input child to bind to
    if (this._isInline && !this._isInput) {
      this._boundInput = this._element.querySelector<HTMLInputElement>('input[type="hidden"], input[name]')
    }

    this._positionElement = this._resolvePositionElement()
    this._displayElement = this._resolveDisplayElement()

    const calendarOptions = this._buildCalendarOptions()

    // Create calendar on the position element (for correct popup positioning)
    // but value updates still go to this._element (the input)
    this._calendar = new Calendar(this._positionElement, calendarOptions as Options)
    this._calendar.init()

    // Watch for theme changes on ancestor elements (for live theme switching)
    this._setupThemeObserver()

    // Set initial value if input has a value
    if (this._isInput && (this._element as HTMLInputElement).value) {
      this._parseInputValue()
    }

    // Populate input/display with preselected dates
    this._updateDisplayWithSelectedDates()
  }

  protected _updateDisplayWithSelectedDates(): void {
    const { selectedDates } = this._config
    if (!selectedDates || selectedDates.length === 0) {
      return
    }

    this._updateOutputs(selectedDates)
  }

  protected _updateOutputs(selectedDates: string[]): void {
    const formattedDate = this._formatDateForInput(selectedDates)

    if (this._isInput) {
      (this._element as HTMLInputElement).value = formattedDate
    }

    if (this._boundInput) {
      this._boundInput.value = selectedDates.join(',')
    }

    if (this._displayElement) {
      this._displayElement.textContent = formattedDate
    }
  }

  protected _resolvePositionElement(): HTMLElement {
    let { positionElement } = this._config

    if (typeof positionElement === 'string') {
      positionElement = document.querySelector<HTMLElement>(positionElement)
    }

    // Use input's parent if in form-adorn
    if (!positionElement && this._isInput && !this._isInline) {
      const parent = this._element.closest<HTMLElement>('.form-adorn')
      if (parent) {
        positionElement = parent
      }
    }

    return positionElement || this._element
  }

  protected _resolveDisplayElement(): HTMLElement | false | null {
    const { displayElement } = this._config

    if (typeof displayElement === 'string') {
      return document.querySelector<HTMLElement>(displayElement)
    }

    // For buttons/non-inputs (not inline), look for a [data-cx-datepicker-display] child
    if (displayElement === true || (displayElement === null && !this._isInput && !this._isInline)) {
      const displayChild = this._element.querySelector<HTMLElement>('[data-cx-datepicker-display]')
      return displayChild || this._element
    }

    return displayElement as HTMLElement | false | null
  }

  protected _getThemeAncestor(): HTMLElement | null {
    return this._element.closest<HTMLElement>('[data-cx-theme]')
  }

  protected _getEffectiveTheme(): string | null {
    // Priority: explicit datepickerTheme config > inherited from ancestor > none
    const { datepickerTheme } = this._config
    if (datepickerTheme) {
      return datepickerTheme
    }

    const ancestor = this._getThemeAncestor()
    return ancestor?.getAttribute('data-cx-theme') || null
  }

  protected _syncThemeAttribute(element?: HTMLElement | null): void {
    if (!element) {
      return
    }

    const theme = this._getEffectiveTheme()

    if (theme) {
      // Copy theme to popover (needed because VCP appends to body, breaking CSS inheritance)
      element.setAttribute('data-cx-theme', theme)
    } else {
      // No theme - remove attribute to allow natural inheritance
      element.removeAttribute('data-cx-theme')
    }
  }

  protected _setupThemeObserver(): void {
    // Watch for theme changes on ancestor elements
    const ancestor = this._getThemeAncestor()
    if (!ancestor || this._config.datepickerTheme) {
      // No ancestor to watch, or explicit datepickerTheme overrides
      return
    }

    this._themeObserver = new MutationObserver(() => {
      this._syncThemeAttribute(this._calendar?.context?.mainElement)
    })

    this._themeObserver.observe(ancestor, {
      attributes: true,
      attributeFilter: ['data-cx-theme']
    })
  }

  protected _buildCalendarOptions(): Record<string, any> {
    // Get theme for VCP - use 'system' for auto-detection if no explicit theme
    const theme = this._getEffectiveTheme()
    // VCP uses 'system' for auto, Chassis CSS uses 'auto'
    const vcpTheme = !theme || theme === 'auto' ? 'system' : theme

    const calendarOptions: Record<string, any> = {
      ...this._config.vcpOptions,
      inputMode: !this._isInline,
      positionToInput: this._config.placement,
      firstWeekday: this._config.firstWeekday,
      locale: this._config.locale,
      styles: this._config.styles,
      selectionDatesMode: this._config.selectionMode,
      selectedDates: this._config.selectedDates,
      displayMonthsCount: this._config.displayMonthsCount,
      type: this._config.displayMonthsCount > 1 ? 'multiple' : 'default',
      selectedTheme: vcpTheme,
      themeAttrDetect: '[data-cx-theme]',
      onClickDate: (self: Calendar, event: MouseEvent) => this._handleDateClick(self, event),
      onInit: (self: Calendar) => {
        this._syncThemeAttribute(self.context.mainElement)
      },
      onShow: () => {
        this._isShown = true
        this._syncThemeAttribute(this._calendar!.context.mainElement)
      },
      onHide: () => {
        this._isShown = false
      }
    }

    // Navigate to the month of the first selected date
    if (this._config.selectedDates.length > 0) {
      const firstDate = this._parseDate(this._config.selectedDates[0])
      calendarOptions.selectedMonth = firstDate.getMonth()
      calendarOptions.selectedYear = firstDate.getFullYear()
    }

    if (this._config.dateMin) {
      calendarOptions.dateMin = this._config.dateMin
    }

    if (this._config.dateMax) {
      calendarOptions.dateMax = this._config.dateMax
    }

    return calendarOptions
  }

  protected _handleDateClick(self: Calendar, event: MouseEvent): void {
    const selectedDates = [...self.context.selectedDates]

    if (selectedDates.length > 0) {
      this._updateOutputs(selectedDates)
    }

    EventHandler.trigger(this._element, EVENT_CHANGE, {
      dates: selectedDates,
      event
    })

    this._maybeHideAfterSelection(selectedDates)
  }

  protected _maybeHideAfterSelection(selectedDates: string[]): void {
    if (this._isInline) {
      return
    }

    const shouldHide =
      (this._config.selectionMode === 'single' && selectedDates.length > 0) ||
      (this._config.selectionMode === 'multiple-ranged' && selectedDates.length >= 2)

    if (shouldHide) {
      setTimeout(() => this.hide(), HIDE_DELAY)
    }
  }

  protected _parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-')
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  protected _formatDate(dateStr: string): string {
    const date = this._parseDate(dateStr)
    const locale = this._config.locale === 'default' ? undefined : this._config.locale
    const { dateFormat } = this._config

    // Custom function formatter
    if (typeof dateFormat === 'function') {
      return dateFormat(date, locale)
    }

    // Intl.DateTimeFormat options object
    if (dateFormat && typeof dateFormat === 'object') {
      return new Intl.DateTimeFormat(locale, dateFormat).format(date)
    }

    // Default: locale-aware formatting
    return date.toLocaleDateString(locale)
  }

  protected _formatDateForInput(dates: string[]): string {
    if (dates.length === 0) {
      return ''
    }

    if (dates.length === 1) {
      return this._formatDate(dates[0])
    }

    // For date ranges, use en-dash; for multiple dates, use comma
    const separator = this._config.selectionMode === 'multiple-ranged' ? ' – ' : ', '
    return dates.map(d => this._formatDate(d)).join(separator)
  }

  protected _parseInputValue(): void {
    // Try to parse the input value as a date
    const value = (this._element as HTMLInputElement).value.trim()
    if (!value) {
      return
    }

    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const formatted = `${year}-${month}-${day}`
      this._calendar!.set({ selectedDates: [formatted] })
    }
  }
}

/**
 * Data API implementation
 */

EventHandler.on(document, EVENT_CLICK_DATA_API, SELECTOR_DATA_TOGGLE, function (event) {
  // Only handle if not an input (inputs use focus)
  // Skip inline datepickers (they're always visible)
  if (this.tagName === 'INPUT' || this.dataset.cxInline === 'true') {
    return
  }

  event.preventDefault()
  Datepicker.getOrCreateInstance(this).toggle()
})

EventHandler.on(document, EVENT_FOCUSIN_DATA_API, SELECTOR_DATA_TOGGLE, function () {
  // Handle focus for input elements
  if (this.tagName !== 'INPUT') {
    return
  }

  Datepicker.getOrCreateInstance(this).show()
})

// Auto-initialize inline datepickers on DOMContentLoaded
EventHandler.on(document, `DOMContentLoaded${EVENT_KEY}${DATA_API_KEY}`, () => {
  for (const element of document.querySelectorAll(`${SELECTOR_DATA_TOGGLE}[data-cx-inline="true"]`)) {
    Datepicker.getOrCreateInstance(element)
  }
})

export default Datepicker
export type { DatepickerConfig }
