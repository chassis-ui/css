/**
 * --------------------------------------------------------------------------
 * Chassis CSS tooltip.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */

import {
  computePosition,
  autoUpdate
} from '@floating-ui/dom'
import FloatingBase from './floating-base.js'
import EventHandler, { type ChassisEvent } from './dom/event-handler.js'
import Manipulator from './dom/manipulator.js'
import type { ComponentConfig } from './util/config.js'
import {
  execute, findShadowRoot, getElement, getUID, isRTL, noop
} from './util/index.js'
import { DefaultAllowlist, type SanitizerAllowList } from './util/sanitizer.js'
import TemplateFactory, { type TemplateContentEntry } from './util/template-factory.js'

/**
 * Constants
 */

const NAME = 'tooltip'
const DISALLOWED_ATTRIBUTES = new Set(['sanitize', 'allowList', 'sanitizeFn'])

const CLASS_NAME_FADE = 'fade'
const CLASS_NAME_MODAL = 'modal'
const CLASS_NAME_SHOW = 'show'

const SELECTOR_TOOLTIP_INNER = '.tooltip-inner'
const SELECTOR_MODAL = `.${CLASS_NAME_MODAL}`
const SELECTOR_DATA_TOGGLE = '[data-cx-toggle="tooltip"]'

const EVENT_MODAL_HIDE = 'hide.cx.modal'

const TRIGGER_HOVER = 'hover'
const TRIGGER_FOCUS = 'focus'
const TRIGGER_CLICK = 'click'
const TRIGGER_MANUAL = 'manual'

const EVENT_HIDE = 'hide'
const EVENT_HIDDEN = 'hidden'
const EVENT_SHOW = 'show'
const EVENT_SHOWN = 'shown'
const EVENT_INSERTED = 'inserted'
const EVENT_CLICK = 'click'
const EVENT_FOCUSIN = 'focusin'
const EVENT_FOCUSOUT = 'focusout'
const EVENT_MOUSEENTER = 'mouseenter'
const EVENT_MOUSELEAVE = 'mouseleave'


type TooltipConfig = {
  allowList: SanitizerAllowList
  animation: boolean
  boundary: string | Element
  container: string | Element | boolean
  customClass: string | ((...args: any[]) => string)
  delay: number | { show: number, hide: number }
  fallbackPlacements: string[]
  html: boolean
  offset: number[] | string | ((...args: any[]) => any)
  placement: string | ((this: Tooltip, tip: HTMLElement, trigger: HTMLElement) => string)
  floatingConfig: Record<string, any> | ((...args: any[]) => Record<string, any>) | null
  sanitize: boolean
  sanitizeFn: ((unsafeHtml: string) => string) | null
  selector: string | boolean
  template: string
  title: string | Element | ((...args: any[]) => string | Element)
  trigger: string
}

const Default: TooltipConfig = {
  allowList: DefaultAllowlist,
  animation: true,
  boundary: 'clippingParents',
  container: false,
  customClass: '',
  delay: 0,
  fallbackPlacements: ['top', 'right', 'bottom', 'left'],
  html: false,
  offset: [0, 6],
  placement: 'top',
  floatingConfig: null,
  sanitize: true,
  sanitizeFn: null,
  selector: false,
  template: '<div class="tooltip" role="tooltip">' +
            '<div class="tooltip-arrow"></div>' +
            '<div class="tooltip-inner"></div>' +
            '</div>',
  title: '',
  trigger: 'hover focus'
}

const DefaultType = {
  allowList: 'object',
  animation: 'boolean',
  boundary: '(string|element)',
  container: '(string|element|boolean)',
  customClass: '(string|function)',
  delay: '(number|object)',
  fallbackPlacements: 'array',
  html: 'boolean',
  offset: '(array|string|function)',
  placement: '(string|function)',
  floatingConfig: '(null|object|function)',
  sanitize: 'boolean',
  sanitizeFn: '(null|function)',
  selector: '(string|boolean)',
  template: 'string',
  title: '(string|element|function)',
  trigger: 'string'
}

/**
 * Class definition
 */

class Tooltip extends FloatingBase {
  declare ['constructor']: typeof Tooltip
  protected declare _config: TooltipConfig
  protected declare _isEnabled: boolean
  protected declare _timeout: ReturnType<typeof setTimeout> | number
  protected declare _isHovered: boolean | null
  protected declare _activeTrigger: Record<string, boolean>
  protected declare _templateFactory: TemplateFactory | null
  protected declare _newContent: Record<string, TemplateContentEntry> | null
  protected declare _hideModalHandler: () => void
  declare tip: HTMLElement | null

  constructor(element?: string | Element | null, config?: Partial<TooltipConfig> | null) {
    if (typeof computePosition === 'undefined') {
      throw new TypeError('Chassis CSS\'s tooltips require Floating UI (https://floating-ui.com)')
    }

    super(element, config)

    // Private
    this._isEnabled = true
    this._timeout = 0
    this._isHovered = null
    this._activeTrigger = {}
    this._templateFactory = null
    this._newContent = null

    // Protected
    this.tip = null

    this._parseResponsivePlacements()
    this._setListeners()

    if (!this._config.selector) {
      this._fixTitle()
    }
  }

  // Getters
  static override get Default(): TooltipConfig {
    return Default
  }

  static override get DefaultType(): Record<string, string> {
    return DefaultType
  }

  static override get NAME(): string {
    return NAME
  }

  // Public
  enable(): void {
    this._isEnabled = true
  }

  disable(): void {
    this._isEnabled = false
  }

  toggleEnabled(): void {
    this._isEnabled = !this._isEnabled
  }

  toggle(): void {
    if (!this._isEnabled) {
      return
    }

    if (this._isShown()) {
      this._leave()
      return
    }

    this._enter()
  }

  override dispose(): void {
    clearTimeout(this._timeout)

    EventHandler.off(this._element.closest(SELECTOR_MODAL), EVENT_MODAL_HIDE, this._hideModalHandler)

    if (this._element.getAttribute('data-cx-original-title')) {
      this._element.setAttribute('title', this._element.getAttribute('data-cx-original-title')!)
    }

    this._disposeFloating()
    this._disposeMediaQueryListeners()
    super.dispose()
  }

  async show(): Promise<void> {
    if (this._element.style.display === 'none') {
      throw new Error('Please use show on visible elements')
    }

    if (!(this._isWithContent() && this._isEnabled)) {
      return
    }

    const showEvent = EventHandler.trigger(this._element, this.constructor.eventName(EVENT_SHOW))
    const shadowRoot = findShadowRoot(this._element)
    const isInTheDom = (shadowRoot || this._element.ownerDocument.documentElement).contains(this._element)

    if (showEvent.defaultPrevented || !isInTheDom) {
      return
    }

    this._disposeFloating()

    const tip = this._getTipElement()

    this._element.setAttribute('aria-describedby', tip.getAttribute('id')!)

    let { container } = this._config as TooltipConfig & { container: Element }
    const closestDialog = this._element.closest('dialog[open]')
    if (closestDialog && container === document.body) {
      container = closestDialog
    }

    if (!this._element.ownerDocument.documentElement.contains(this.tip)) {
      container.append(tip)
      EventHandler.trigger(this._element, this.constructor.eventName(EVENT_INSERTED))
    }

    await this._createFloating(tip)

    tip.classList.add(CLASS_NAME_SHOW)

    // If this is a touch-enabled device we add extra
    // empty mouseover listeners to the body's immediate children;
    // only needed because of broken event delegation on iOS
    // https://www.quirksmode.org/blog/archives/2014/02/mouse_event_bub.html
    if ('ontouchstart' in document.documentElement) {
      for (const element of document.body.children) {
        EventHandler.on(element, 'mouseover', noop)
      }
    }

    const complete = () => {
      EventHandler.trigger(this._element, this.constructor.eventName(EVENT_SHOWN))

      if (this._isHovered === false) {
        this._leave()
      }

      this._isHovered = false
    }

    this._queueCallback(complete, this.tip!, this._isAnimated()!)
  }

  hide(): void {
    if (!this._isShown()) {
      return
    }

    const hideEvent = EventHandler.trigger(this._element, this.constructor.eventName(EVENT_HIDE))
    if (hideEvent.defaultPrevented) {
      return
    }

    const tip = this._getTipElement()
    tip.classList.remove(CLASS_NAME_SHOW)

    // If this is a touch-enabled device we remove the extra
    // empty mouseover listeners we added for iOS support
    if ('ontouchstart' in document.documentElement) {
      for (const element of document.body.children) {
        EventHandler.off(element, 'mouseover', noop)
      }
    }

    this._activeTrigger[TRIGGER_CLICK] = false
    this._activeTrigger[TRIGGER_FOCUS] = false
    this._activeTrigger[TRIGGER_HOVER] = false
    this._isHovered = null // it is a trick to support manual triggering

    const complete = () => {
      if (this._isWithActiveTrigger()) {
        return
      }

      if (!this._isHovered) {
        this._disposeFloating()
      }

      this._element.removeAttribute('aria-describedby')
      EventHandler.trigger(this._element, this.constructor.eventName(EVENT_HIDDEN))
    }

    this._queueCallback(complete, this.tip!, this._isAnimated()!)
  }

  update(): void {
    if (this._floatingCleanup && this.tip) {
      this._updateFloatingPosition()
    }
  }

  // Protected
  protected _isWithContent(): boolean {
    return Boolean(this._getTitle())
  }

  protected _getTipElement(): HTMLElement {
    if (!this.tip) {
      this.tip = this._createTipElement(this._newContent || this._getContentForTemplate())
    }

    return this.tip
  }

  protected _createTipElement(content: Record<string, TemplateContentEntry>): HTMLElement {
    const tip = this._getTemplateFactory(content).toHtml()

    tip.classList.remove(CLASS_NAME_FADE, CLASS_NAME_SHOW)
    tip.classList.add(`cx-${this.constructor.NAME}-auto`)

    const tipId = getUID(this.constructor.NAME).toString()

    tip.setAttribute('id', tipId)

    if (this._isAnimated()) {
      tip.classList.add(CLASS_NAME_FADE)
    }

    return tip
  }

  setContent(content: Record<string, TemplateContentEntry>): void {
    this._newContent = content
    if (this._isShown()) {
      this._disposeFloating()
      this.show()
    }
  }

  protected _getTemplateFactory(content: Record<string, TemplateContentEntry>): TemplateFactory {
    if (this._templateFactory) {
      this._templateFactory.changeContent(content)
    } else {
      this._templateFactory = new TemplateFactory({
        ...this._config,
        // the `content` var has to be after `this._config`
        // to override config.content in case of popover
        content,
        extraClass: this._resolvePossibleFunction(this._config.customClass)
      })
    }

    return this._templateFactory
  }

  protected _getContentForTemplate(): Record<string, TemplateContentEntry> {
    return {
      [SELECTOR_TOOLTIP_INNER]: this._getTitle()
    }
  }

  protected _getTitle(): string | Element | null {
    return this._resolvePossibleFunction(this._config.title) || this._element.getAttribute('data-cx-original-title')
  }

  // Private
  protected _initializeOnDelegatedTarget(event: ChassisEvent): Tooltip {
    return this.constructor.getOrCreateInstance(event.delegateTarget, this._getDelegateConfig())
  }

  protected _isAnimated(): boolean | null {
    return this._config.animation || (this.tip !== null && this.tip.classList.contains(CLASS_NAME_FADE))
  }

  protected override _isShown(): boolean {
    return Boolean(this.tip && this.tip.classList.contains(CLASS_NAME_SHOW))
  }

  protected _getPlacement(tip: HTMLElement): string {
    const toPhysical = (placement: unknown): string => {
      const rtl = isRTL()
      switch (String(placement).toLowerCase()) {
        case 'start': return rtl ? 'right' : 'left'
        case 'end':   return rtl ? 'left' : 'right'
        default:      return String(placement).toLowerCase()
      }
    }

    if (this._responsivePlacements) {
      return toPhysical(this._getResponsivePlacement())
    }

    return toPhysical(execute(this._config.placement, [this, tip, this._element]))
  }

  protected override _getDefaultPlacement(): string {
    return 'top'
  }

  protected async _createFloating(tip: HTMLElement): Promise<void> {
    const placement = this._getPlacement(tip)
    const arrowElement = tip.querySelector<HTMLElement>(`.${this.constructor.NAME}-arrow`)

    // Initial position update
    await this._updateFloatingPosition(tip, placement, arrowElement)

    // Set up auto-update for scroll/resize
    this._floatingCleanup = autoUpdate(
      this._element,
      tip,
      () => this._updateFloatingPosition(tip, null, arrowElement)
    )
  }

  protected override async _updateFloatingPosition(tip: HTMLElement | null = this.tip, placement: string | null = null, arrowElement: HTMLElement | null = null): Promise<void> {
    if (!tip) {
      return
    }

    if (!placement) {
      placement = this._getPlacement(tip)
    }

    if (!arrowElement) {
      arrowElement = tip.querySelector<HTMLElement>(`.${this.constructor.NAME}-arrow`)
    }

    const middleware = this._getFloatingMiddleware(arrowElement)
    const floatingConfig = this._getFloatingConfig(placement, middleware)

    const { x, y, placement: finalPlacement, middlewareData } = await computePosition(
      this._element,
      tip,
      floatingConfig
    )

    // Apply position to tooltip
    Object.assign(tip.style, {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`
    })

    // Ensure arrow is absolutely positioned within tooltip
    if (arrowElement) {
      arrowElement.style.position = 'absolute'
    }

    // Set placement attribute for CSS arrow styling
    Manipulator.setDataAttribute(tip, 'placement', finalPlacement)

    // Position arrow along the edge (center it) if present
    // The CSS handles which edge to place it on via data-cx-placement
    if (arrowElement && middlewareData.arrow) {
      const { x: arrowX, y: arrowY } = middlewareData.arrow
      const isVertical = finalPlacement.startsWith('top') || finalPlacement.startsWith('bottom')

      // Only set the cross-axis position (centering along the edge)
      // The main-axis position (which edge) is handled by CSS
      Object.assign(arrowElement.style, {
        left: isVertical && arrowX !== null ? `${arrowX}px` : '',
        top: !isVertical && arrowY !== null ? `${arrowY}px` : '',
        // Reset the other axis to let CSS handle it
        right: '',
        bottom: ''
      })
    }
  }

  protected _resolvePossibleFunction<T>(arg: T | ((...args: any[]) => T)): T {
    return execute(arg, [this._element, this._element])
  }

  protected _setListeners(): void {
    const triggers = this._config.trigger.split(' ')

    for (const trigger of triggers) {
      if (trigger === 'click') {
        EventHandler.on(this._element, this.constructor.eventName(EVENT_CLICK), this._config.selector as string, event => {
          const context = this._initializeOnDelegatedTarget(event)
          context._activeTrigger[TRIGGER_CLICK] = !(context._isShown() && context._activeTrigger[TRIGGER_CLICK])
          context.toggle()
        })
      } else if (trigger !== TRIGGER_MANUAL) {
        const eventIn = trigger === TRIGGER_HOVER ?
          this.constructor.eventName(EVENT_MOUSEENTER) :
          this.constructor.eventName(EVENT_FOCUSIN)
        const eventOut = trigger === TRIGGER_HOVER ?
          this.constructor.eventName(EVENT_MOUSELEAVE) :
          this.constructor.eventName(EVENT_FOCUSOUT)

        EventHandler.on(this._element, eventIn, this._config.selector as string, event => {
          const context = this._initializeOnDelegatedTarget(event)
          context._activeTrigger[event.type === 'focusin' ? TRIGGER_FOCUS : TRIGGER_HOVER] = true
          context._enter()
        })
        EventHandler.on(this._element, eventOut, this._config.selector as string, event => {
          const context = this._initializeOnDelegatedTarget(event)
          context._activeTrigger[event.type === 'focusout' ? TRIGGER_FOCUS : TRIGGER_HOVER] =
            context._element.contains(event.relatedTarget as Node | null)

          context._leave()
        })
      }
    }

    this._hideModalHandler = () => {
      if (this._element) {
        this.hide()
      }
    }

    EventHandler.on(this._element.closest(SELECTOR_MODAL), EVENT_MODAL_HIDE, this._hideModalHandler)
  }

  protected _fixTitle(): void {
    const title = this._element.getAttribute('title')

    if (!title) {
      return
    }

    if (!this._element.getAttribute('aria-label') && !this._element.textContent!.trim()) {
      this._element.setAttribute('aria-label', title)
    }

    this._element.setAttribute('data-cx-original-title', title)
    this._element.removeAttribute('title')
  }

  protected _enter(): void {
    if (this._isShown() || this._isHovered) {
      this._isHovered = true
      return
    }

    this._isHovered = true

    this._setTimeout(() => {
      if (this._isHovered) {
        this.show()
      }
    }, (this._config.delay as { show: number, hide: number }).show)
  }

  protected _leave(): void {
    if (this._isWithActiveTrigger()) {
      return
    }

    this._isHovered = false

    this._setTimeout(() => {
      if (!this._isHovered) {
        this.hide()
      }
    }, (this._config.delay as { show: number, hide: number }).hide)
  }

  protected _setTimeout(handler: () => void, timeout: number): void {
    clearTimeout(this._timeout)
    this._timeout = setTimeout(handler, timeout)
  }

  protected _isWithActiveTrigger(): boolean {
    return Object.values(this._activeTrigger).includes(true)
  }

  protected override _getConfig(config?: ComponentConfig | null): ComponentConfig {
    const jsonConfig = (Manipulator.getDataAttribute(this._element, 'config') || {}) as ComponentConfig
    const dataAttributes = Manipulator.getDataAttributes(this._element)

    for (const key of DISALLOWED_ATTRIBUTES) {
      delete jsonConfig[key]
      delete dataAttributes[key]
    }

    config = {
      ...this.constructor.Default,
      ...(typeof jsonConfig === 'object' ? jsonConfig : {}),
      ...dataAttributes,
      ...(typeof config === 'object' && config ? config : {})
    }
    config = this._configAfterMerge(config)
    this._typeCheckConfig(config)
    return config
  }

  protected override _configAfterMerge(config: ComponentConfig): ComponentConfig {
    config.container = config.container === false ? document.body : getElement(config.container)

    if (typeof config.delay === 'number') {
      config.delay = {
        show: config.delay,
        hide: config.delay
      }
    }

    if (typeof config.title === 'number') {
      config.title = config.title.toString()
    }

    if (typeof config.content === 'number') {
      config.content = config.content.toString()
    }

    return config
  }

  protected _getDelegateConfig(): ComponentConfig {
    const config: ComponentConfig = {}

    for (const [key, value] of Object.entries(this._config)) {
      if (this.constructor.Default[key as keyof TooltipConfig] !== value) {
        config[key] = value
      }
    }

    config.selector = false
    config.trigger = 'manual'

    // In the future can be replaced with:
    // const keysWithDifferentValues = Object.entries(this._config).filter(entry => this.constructor.Default[entry[0]] !== this._config[entry[0]])
    // `Object.fromEntries(keysWithDifferentValues)`
    return config
  }

  protected override _disposeFloating(): void {
    super._disposeFloating()

    if (this.tip) {
      this.tip.remove()
      this.tip = null
    }
  }
}

/**
 * Data API implementation - auto-initialize tooltips
 */

const initTooltip = (event: ChassisEvent): void => {
  const target = (event.target as Element).closest(SELECTOR_DATA_TOGGLE)
  if (!target) {
    return
  }

  // Lazily create the instance. The instance's own `_setListeners()` registers
  // the appropriate listeners on the element for the configured triggers
  // (hover/focus by default), so we don't mutate `_activeTrigger` or call
  // `_enter` here — doing so would show tooltips for triggers the user didn't
  // opt into (e.g. `focusin` firing for click-focused buttons in Chromium,
  // even when `trigger="hover"` or `trigger="manual"`) and leave stale state
  // on `_activeTrigger`.
  Tooltip.getOrCreateInstance(target)
}

// Auto-initialize tooltips on first interaction for hover and focus triggers
EventHandler.on(document, EVENT_FOCUSIN, SELECTOR_DATA_TOGGLE, initTooltip)
EventHandler.on(document, EVENT_MOUSEENTER, SELECTOR_DATA_TOGGLE, initTooltip)

export default Tooltip
export type { TooltipConfig }
