/**
 * --------------------------------------------------------------------------
 * Chassis - CSS accordion.js
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */

import BaseComponent from './base-component.js'
import SelectorEngine from './dom/selector-engine.js'
import EventHandler from './dom/event-handler.js'
import { defineJQueryPlugin } from './util/index.js'

const NAME = 'accordion'

const DATA_KEY = 'cx.accordion'
const EVENT_KEY = `.${DATA_KEY}`
const DATA_API_KEY = '.data-api'

const EVENT_OPEN = `open${EVENT_KEY}`
const EVENT_OPENED = `opened${EVENT_KEY}`
const EVENT_CLOSE = `close${EVENT_KEY}`
const EVENT_CLOSED = `closed${EVENT_KEY}`

const SELECTOR_DETAILS = '.accordion > details'
const SELECTOR_SUMMARY = 'summary'
const SELECTOR_TITLE = '.accordion-title'
const SELECTOR_CONTENT = '.accordion-body'
const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`

class Accordion extends BaseComponent {
  static get NAME() {
    return NAME
  }

  constructor(element, config) {
    super(element, config)

    this._summary = SelectorEngine.findOne(SELECTOR_SUMMARY, element)
    this._content = SelectorEngine.findOne(SELECTOR_CONTENT, element)
    this._title = SelectorEngine.findOne(SELECTOR_TITLE, this._element)
    this._isTransitioning = false

    // Using event listener causes a blink, so we use MutationObserver.
    this._observer = this._createObserver()
    this._observer.observe(this._element, { attributes: true })
  }

  open() {
    const openEvent = EventHandler.trigger(this._element, EVENT_OPEN)
    if (this._isTransitioning || openEvent.defaultPrevented) {
      return
    }

    this._isTransitioning = true

    this._setAriaExpanded()

    this._element.style.overflow = 'hidden'
    this._element.style.height = `${this._summary.offsetHeight}px`
    this._element.style.height = `${this._summary.offsetHeight + this._content.offsetHeight}px`

    const complete = () => {
      this._element.style.overflow = ''
      this._element.style.height = ''
      this._isTransitioning = false
      EventHandler.trigger(this._element, EVENT_OPENED)
    }

    this._queueCallback(complete, this._element, true)
  }

  close() {
    const closeEvent = EventHandler.trigger(this._element, EVENT_CLOSE)
    if (this._isTransitioning || closeEvent.defaultPrevented) {
      return
    }

    this._isTransitioning = true

    this._setAriaExpanded()

    // Details element immediately closes the summary when open is set to false.
    // So we need to create a pseudo element for a seamless transition.
    this._createPseudoElement()

    this._element.style.height = `${this._summary.offsetHeight + this._content.offsetHeight}px`
    this._element.style.height = `${this._summary.offsetHeight}px`

    const complete = () => {
      this._element.style.height = ''
      this._pElement.remove()
      this._isTransitioning = false
      EventHandler.trigger(this._element, EVENT_CLOSED)
    }

    this._queueCallback(complete, this._element, true)
  }

  _createObserver() {
    return new MutationObserver(mutationsList => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'open') {
          return this._element.open ? this.open() : this.close()
        }
      }
    })
  }

  _createPseudoElement() {
    this._pElement = this._element.cloneNode(true)
    this._pElement.name = ''
    this._pElement.open = true
    this._pSummary = SelectorEngine.findOne(SELECTOR_SUMMARY, this._pElement) // this._pElement.querySelector(SELECTOR_SUMMARY)
    this._element.before(this._pElement)
    this._pElement.style.overflow = 'hidden'
    this._pElement.style.position = 'absolute'
    this._pElement.style.background = 'none'
    this._pElement.style.border = 0
    this._pElement.style.width = `${this._element.offsetWidth}px`
    this._pElement.style.height = `${this._pElement.offsetHeight}px`
    this._pSummary.style.visibility = 'hidden'
    this._pElement.style.height = `${this._summary.offsetHeight}px`
  }

  _setAriaExpanded() {
    if (this._title && this._title.hasAttribute('aria-expanded')) {
      this._title.setAttribute('aria-expanded', this._element.open)
    }
  }
}

EventHandler.on(document, EVENT_CLICK_DATA_API, SELECTOR_DETAILS, () => {
  for (const element of SelectorEngine.find(SELECTOR_DETAILS)) {
    Accordion.getOrCreateInstance(element)
  }
})

defineJQueryPlugin(Accordion)

export default Accordion
