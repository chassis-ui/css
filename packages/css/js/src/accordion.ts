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
import { getTransitionDurationFromElement } from './util/index.js'

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

const TRANSITION_END = 'transitionend'
const DURATION_PADDING = 5

// The transition in progress, so that a toggle the other way can take it over
type Transition = {
  opening: boolean
  clone: HTMLDetailsElement | null // the stand-in of a closing item
  cancel: () => void // drops the wait for its end
}

/**
 * Class definition
 */

class Accordion extends BaseComponent {
  protected declare _element: HTMLDetailsElement
  protected declare _summary: HTMLElement | null
  protected declare _content: HTMLElement | null
  protected declare _isTransitioning: boolean
  protected declare _transition: Transition | null
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
    this._transition = null

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

  // A toggle while the item is already moving the same way does nothing. One the other way
  // takes the transition over: the browser has toggled <details> already, so the item turns
  // around from the height it has reached, and the callback of the transition it replaces
  // never runs (no `opened` on an item that closed meanwhile, and no `closed` on an open one).
  open(): void {
    if (!this._summary || !this._content || this._transition?.opening) {
      return
    }

    const openEvent = EventHandler.trigger(this._element, EVENT_OPEN)
    if (openEvent.defaultPrevented) {
      return
    }

    // Captured locally so the queued callback below never has to read
    // `this._element` — if dispose() runs mid-transition, that property is
    // nulled out and would throw before the callback finished its cleanup.
    const element = this._element

    // Taking over a close: grow again from the height its stand-in has reached
    const fromHeight = this._transition?.clone?.offsetHeight ?? this._summary.offsetHeight
    this._dropTransition()

    // overflow:clip avoids a new BFC (unlike hidden), so interior margins
    // and stacking contexts are unaffected during the transition.
    element.style.overflow = 'clip'
    element.style.height = `${fromHeight}px`
    element.style.height = `${this._summary.offsetHeight + this._content.offsetHeight}px`

    this._startTransition(true, null, () => {
      element.style.overflow = ''
      element.style.height = ''
      EventHandler.trigger(element, EVENT_OPENED)
    })
  }

  close(): void {
    if (!this._summary || !this._content || (this._transition && !this._transition.opening)) {
      return
    }

    const closeEvent = EventHandler.trigger(this._element, EVENT_CLOSE)
    if (closeEvent.defaultPrevented) {
      return
    }

    // Captured locally so the queued callback below never has to read
    // `this._element` — if dispose() runs mid-transition, that property is
    // nulled out and would throw before the callback reached clone.remove(),
    // leaking the clone permanently.
    const element = this._element

    // Taking over an open: the stand-in shrinks from the height the item has reached
    const fromHeight = this._transition ? element.offsetHeight : null
    this._dropTransition()

    // <details> collapses content instantly on open=false; insert a clone
    // as a visual stand-in for the duration of the height transition.
    const clone = this._createClone(fromHeight)

    element.style.height = `${this._summary.offsetHeight + this._content.offsetHeight}px`
    element.style.height = `${this._summary.offsetHeight}px`

    this._startTransition(false, clone, () => {
      element.style.overflow = ''
      element.style.height = ''
      clone.remove()
      EventHandler.trigger(element, EVENT_CLOSED)
    })
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

  protected _startTransition(opening: boolean, clone: HTMLDetailsElement | null, settle: () => void): void {
    this._isTransitioning = true
    this._transition = {
      opening,
      clone,
      cancel: this._afterTransition(this._element, () => {
        this._isTransitioning = false
        this._transition = null
        settle()
      })
    }
  }

  // Abandons the transition in progress, for the one the other way that takes it over
  protected _dropTransition(): void {
    if (!this._transition) {
      return
    }

    this._transition.cancel()
    this._transition.clone?.remove()
    this._transition = null
    this._isTransitioning = false
  }

  // Runs the callback when the element's transition ends, or after its duration when no
  // transitionend comes, and returns a function that drops the wait. executeAfterTransition
  // cannot be dropped: its timer would end the transition that took over early, with a
  // synthetic transitionend on the same element.
  protected _afterTransition(element: HTMLElement, callback: () => void): () => void {
    let settled = false
    const settle = (): void => {
      if (!settled) {
        settled = true
        callback()
      }
    }

    const onTransitionEnd = ({ target }: Event): void => {
      if (target === element) {
        element.removeEventListener(TRANSITION_END, onTransitionEnd)
        settle()
      }
    }

    element.addEventListener(TRANSITION_END, onTransitionEnd)
    const timer = setTimeout(() => {
      element.removeEventListener(TRANSITION_END, onTransitionEnd)
      settle()
    }, getTransitionDurationFromElement(element) + DURATION_PADDING)

    return () => {
      settled = true
      clearTimeout(timer)
      element.removeEventListener(TRANSITION_END, onTransitionEnd)
    }
  }

  // The stand-in starts at `height`, or at its own open height
  protected _createClone(height: number | null = null): HTMLDetailsElement {
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
    clone.style.height = `${height ?? clone.offsetHeight}px`
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
