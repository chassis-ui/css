/**
 * --------------------------------------------------------------------------
 * Chassis CSS accordion.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */

import BaseComponent from './base-component.js'
import EventHandler from './dom/event-handler.js'
import SelectorEngine from './dom/selector-engine.js'
import type { ComponentConfig } from './util/config.js'

/**
 * Constants
 */

const NAME = 'accordion'

const DATA_KEY = 'cx.accordion'
const EVENT_KEY = `.${DATA_KEY}`
const DATA_API_KEY = '.data-api'

const EVENT_OPEN = `open${EVENT_KEY}`
const EVENT_OPENED = `opened${EVENT_KEY}`
const EVENT_CLOSE = `close${EVENT_KEY}`
const EVENT_CLOSED = `closed${EVENT_KEY}`

const ATTR_CLONE = 'data-cx-clone' // marks clones so SELECTOR_DETAILS excludes them
const ATTR_ACCORDION = 'data-cx-accordion'
const SELECTOR_DETAILS = `[${ATTR_ACCORDION}] > details:not([${ATTR_CLONE}])`
const SELECTOR_SUMMARY = 'summary'
const SELECTOR_CONTENT = '.accordion-body'
const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`

/**
 * Class definition
 */

class Accordion extends BaseComponent {
  protected declare _element: HTMLDetailsElement
  protected declare _summary: HTMLElement | null
  protected declare _content: HTMLElement | null
  protected declare _isTransitioning: boolean
  protected declare _observer: MutationObserver | undefined

  // Getters
  static override get NAME(): string {
    return NAME
  }

  constructor(element?: string | Element | null, config?: ComponentConfig | null) {
    super(element, config)

    this._summary = SelectorEngine.findOne(SELECTOR_SUMMARY, this._element)
    this._content = SelectorEngine.findOne(SELECTOR_CONTENT, this._element)
    this._isTransitioning = false

    if (!this._summary || !this._content) {
      return // bail on malformed markup before setting up observer
    }

    // A direct event listener on summary causes a visual blink; watching
    // the open attribute via MutationObserver avoids it.
    this._observer = this._createObserver()
    this._observer.observe(this._element, { attributes: true })
  }

  // Public
  toggle(): void {
    if (this._element.open) {
      this.close()
    } else {
      this.open()
    }
  }

  open(): void {
    if (!this._summary || !this._content || this._isTransitioning) {
      return
    }

    const openEvent = EventHandler.trigger(this._element, EVENT_OPEN)
    if (openEvent.defaultPrevented) {
      return
    }

    this._isTransitioning = true

    // Captured locally so the queued callback below never has to read
    // `this._element` — if dispose() runs mid-transition, that property is
    // nulled out and would throw before the callback finished its cleanup.
    const element = this._element

    // overflow:clip avoids a new BFC (unlike hidden), so interior margins
    // and stacking contexts are unaffected during the transition.
    element.style.overflow = 'clip'
    element.style.height = `${this._summary.offsetHeight}px`
    element.style.height = `${this._summary.offsetHeight + this._content.offsetHeight}px`

    this._queueCallback(() => {
      element.style.overflow = ''
      element.style.height = ''
      this._isTransitioning = false
      EventHandler.trigger(element, EVENT_OPENED)
    }, element, true)
  }

  close(): void {
    if (!this._summary || !this._content) {
      return
    }

    const closeEvent = EventHandler.trigger(this._element, EVENT_CLOSE)
    if (this._isTransitioning || closeEvent.defaultPrevented) {
      return
    }

    this._isTransitioning = true

    // Captured locally so the queued callback below never has to read
    // `this._element` — if dispose() runs mid-transition, that property is
    // nulled out and would throw before the callback reached clone.remove(),
    // leaking the clone permanently.
    const element = this._element

    // <details> collapses content instantly on open=false; insert a clone
    // as a visual stand-in for the duration of the height transition.
    const clone = this._createClone()

    element.style.height = `${this._summary.offsetHeight + this._content.offsetHeight}px`
    element.style.height = `${this._summary.offsetHeight}px`

    this._queueCallback(() => {
      element.style.height = ''
      clone.remove()
      this._isTransitioning = false
      EventHandler.trigger(element, EVENT_CLOSED)
    }, element, true)
  }

  override dispose(): void {
    if (this._observer) {
      this._observer.disconnect()
    }

    super.dispose()
  }

  // Private
  protected _createObserver(): MutationObserver {
    return new MutationObserver(mutationsList => {
      for (const mutation of mutationsList) {
        if (mutation.attributeName === 'open') {
          if (this._element.open) {
            this.open()
          } else {
            this.close()
          }

          break
        }
      }
    })
  }

  protected _createClone(): HTMLDetailsElement {
    const clone = this._element.cloneNode(true) as HTMLDetailsElement
    clone.name = ''
    clone.open = true
    clone.inert = true                   // no AT traversal or interaction during animation
    clone.setAttribute(ATTR_CLONE, '')   // prevent data-API from creating a spurious instance

    const cloneSummary = SelectorEngine.findOne(SELECTOR_SUMMARY, clone)!
    this._element.before(clone)
    clone.style.overflow = 'hidden'
    clone.style.position = 'absolute'
    clone.style.background = 'none'
    clone.style.border = '0'
    clone.style.width = `${this._element.offsetWidth}px`
    clone.style.height = `${clone.offsetHeight}px`
    cloneSummary.style.visibility = 'hidden'
    clone.style.height = `${this._summary!.offsetHeight}px`

    return clone
  }
}

/**
 * Data API implementation
 */

// Initialize the clicked item and its same-name siblings before the browser
// fires activation behavior — siblings need observers in place so their
// close animations run on first interaction.
EventHandler.on(document, EVENT_CLICK_DATA_API, SELECTOR_DETAILS, function () {
  Accordion.getOrCreateInstance(this)

  const name = this.getAttribute('name')
  if (name) {
    for (const sibling of SelectorEngine.find(`details[name="${CSS.escape(name)}"]`, this.parentElement!)) {
      Accordion.getOrCreateInstance(sibling)
    }
  }
})

export default Accordion
