/**
 * --------------------------------------------------------------------------
 * Chassis CSS scrollspy.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */

import BaseComponent from './base-component.js'
import EventHandler from './dom/event-handler.js'
import SelectorEngine from './dom/selector-engine.js'
import type { ComponentConfig } from './util/config.js'
import {
  getElement, isDisabled, isVisible
} from './util/index.js'

/**
 * Constants
 */

const NAME = 'scrollspy'
const DATA_KEY = 'cx.scrollspy'
const EVENT_KEY = `.${DATA_KEY}`
const DATA_API_KEY = '.data-api'

const EVENT_ACTIVATE = `activate${EVENT_KEY}`
const EVENT_CLICK = `click${EVENT_KEY}`
const EVENT_LOAD_DATA_API = `load${EVENT_KEY}${DATA_API_KEY}`

const CLASS_NAME_MENU_ITEM = 'menu-item'
const CLASS_NAME_ACTIVE = 'active'

const SELECTOR_DATA_SPY = '[data-cx-spy="scroll"]'
const SELECTOR_TARGET_LINKS = '[href]'
const SELECTOR_NAV_LIST_GROUP = '.nav, .list-group'
const SELECTOR_NAV_LINKS = '.nav-link'
const SELECTOR_NAV_ITEMS = '.nav-item'
const SELECTOR_LIST_ITEMS = '.list-item'
const SELECTOR_LINK_ITEMS = `${SELECTOR_NAV_LINKS}, ${SELECTOR_NAV_ITEMS} > ${SELECTOR_NAV_LINKS}, ${SELECTOR_LIST_ITEMS}`
const SELECTOR_MENU_TOGGLE = '[data-cx-toggle="menu"]'

type ScrollSpyConfig = {
  rootMargin: string
  smoothScroll: boolean
  target: string | Element | null
  threshold: number[] | string
}

const Default: ScrollSpyConfig = {
  rootMargin: '0px 0px -25%',
  smoothScroll: false,
  target: null,
  threshold: [0.1, 0.5, 1]
}

const DefaultType = {
  rootMargin: 'string',
  smoothScroll: 'boolean',
  target: 'element',
  threshold: 'array'
}

/**
 * Class definition
 */

class ScrollSpy extends BaseComponent {
  protected declare _config: ScrollSpyConfig
  protected declare _targetLinks: Map<string, HTMLAnchorElement>
  protected declare _observableSections: Map<string, HTMLElement>
  protected declare _rootElement: HTMLElement | null
  protected declare _activeTarget: HTMLElement | null
  protected declare _observer: IntersectionObserver | null
  protected declare _previousScrollData: { visibleEntryTop: number, parentScrollTop: number }

  constructor(element?: string | Element | null, config?: Partial<ScrollSpyConfig> | null) {
    super(element, config)

    // this._element is the observablesContainer and config.target the menu links wrapper
    this._targetLinks = new Map()
    this._observableSections = new Map()
    this._rootElement = getComputedStyle(this._element).overflowY === 'visible' ? null : this._element
    this._activeTarget = null
    this._observer = null
    this._previousScrollData = {
      visibleEntryTop: 0,
      parentScrollTop: 0
    }
    this.refresh() // initialize
  }

  // Getters
  static override get Default(): ScrollSpyConfig {
    return Default
  }

  static override get DefaultType(): Record<string, string> {
    return DefaultType
  }

  static override get NAME(): string {
    return NAME
  }

  // Public
  refresh(): void {
    this._initializeTargetsAndObservables()
    this._maybeEnableSmoothScroll()

    if (this._observer) {
      this._observer.disconnect()
    } else {
      this._observer = this._getNewObserver()
    }

    for (const section of this._observableSections.values()) {
      this._observer.observe(section)
    }
  }

  override dispose(): void {
    this._observer!.disconnect()
    super.dispose()
  }

  // Private
  protected override _configAfterMerge(config: ComponentConfig): ComponentConfig {
    config.target = getElement(config.target) || document.body

    if (typeof config.threshold === 'string') {
      config.threshold = config.threshold.split(',').map((value: string) => Number.parseFloat(value))
    }

    return config
  }

  protected _maybeEnableSmoothScroll(): void {
    if (!this._config.smoothScroll) {
      return
    }

    // unregister any previous listeners
    EventHandler.off(this._config.target as HTMLElement, EVENT_CLICK)

    EventHandler.on(this._config.target as HTMLElement, EVENT_CLICK, SELECTOR_TARGET_LINKS, event => {
      const observableSection = this._observableSections.get((event.target as HTMLAnchorElement).hash)
      if (observableSection) {
        event.preventDefault()
        const root: any = this._rootElement || window
        const height = observableSection.offsetTop - this._element.offsetTop
        if (root.scrollTo) {
          root.scrollTo({ top: height, behavior: 'smooth' })
          return
        }

        // Chrome 60 doesn't support `scrollTo`
        root.scrollTop = height
      }
    })
  }

  protected _getNewObserver(): IntersectionObserver {
    const options = {
      root: this._rootElement,
      threshold: this._config.threshold as number[],
      rootMargin: this._config.rootMargin
    }

    return new IntersectionObserver(entries => this._observerCallback(entries), options)
  }

  // The logic of selection
  protected _observerCallback(entries: IntersectionObserverEntry[]): void {
    const targetElement = (entry: IntersectionObserverEntry): HTMLAnchorElement | undefined => this._targetLinks.get(`#${entry.target.id}`)
    const activate = (entry: IntersectionObserverEntry): void => {
      this._previousScrollData.visibleEntryTop = (entry.target as HTMLElement).offsetTop
      this._process(targetElement(entry)!)
    }

    const parentScrollTop = (this._rootElement || document.documentElement).scrollTop
    const userScrollsDown = parentScrollTop >= this._previousScrollData.parentScrollTop
    this._previousScrollData.parentScrollTop = parentScrollTop

    for (const entry of entries) {
      if (!entry.isIntersecting) {
        this._activeTarget = null
        this._clearActiveClass(targetElement(entry)!)

        continue
      }

      const entryIsLowerThanPrevious = (entry.target as HTMLElement).offsetTop >= this._previousScrollData.visibleEntryTop
      // if we are scrolling down, pick the bigger offsetTop
      if (userScrollsDown && entryIsLowerThanPrevious) {
        activate(entry)
        // if parent isn't scrolled, let's keep the first visible item, breaking the iteration
        if (!parentScrollTop) {
          return
        }

        continue
      }

      // if we are scrolling up, pick the smallest offsetTop
      if (!userScrollsDown && !entryIsLowerThanPrevious) {
        activate(entry)
      }
    }
  }

  protected _initializeTargetsAndObservables(): void {
    this._targetLinks = new Map()
    this._observableSections = new Map()

    const targetLinks = SelectorEngine.find<HTMLAnchorElement>(SELECTOR_TARGET_LINKS, this._config.target as HTMLElement)

    for (const anchor of targetLinks) {
      // ensure that the anchor has an id and is not disabled
      if (!anchor.hash || isDisabled(anchor)) {
        continue
      }

      const observableSection = SelectorEngine.findOne(decodeURI(anchor.hash), this._element)

      // ensure that the observableSection exists & is visible
      if (isVisible(observableSection)) {
        this._targetLinks.set(decodeURI(anchor.hash), anchor)
        this._observableSections.set(anchor.hash, observableSection!)
      }
    }
  }

  protected _process(target: HTMLElement): void {
    if (this._activeTarget === target) {
      return
    }

    this._clearActiveClass(this._config.target as HTMLElement)
    this._activeTarget = target
    target.classList.add(CLASS_NAME_ACTIVE)
    this._activateParents(target)

    EventHandler.trigger(this._element, EVENT_ACTIVATE, { relatedTarget: target })
  }

  protected _activateParents(target: HTMLElement): void {
    // Activate menu parents
    if (target.classList.contains(CLASS_NAME_MENU_ITEM)) {
      const menuToggle = target.closest('.menu')?.previousElementSibling
      if (menuToggle?.matches(SELECTOR_MENU_TOGGLE)) {
        menuToggle.classList.add(CLASS_NAME_ACTIVE)
      }

      return
    }

    for (const listGroup of SelectorEngine.parents(target, SELECTOR_NAV_LIST_GROUP)) {
      // Set triggered links parents as active
      // With both <ul> and <nav> markup a parent is the previous sibling of any nav ancestor
      for (const item of SelectorEngine.prev(listGroup, SELECTOR_LINK_ITEMS)) {
        item.classList.add(CLASS_NAME_ACTIVE)
      }
    }
  }

  protected _clearActiveClass(parent: HTMLElement): void {
    parent.classList.remove(CLASS_NAME_ACTIVE)

    const activeNodes = SelectorEngine.find(`${SELECTOR_TARGET_LINKS}.${CLASS_NAME_ACTIVE}`, parent)
    for (const node of activeNodes) {
      node.classList.remove(CLASS_NAME_ACTIVE)
    }
  }
}

/**
 * Data API implementation
 */

EventHandler.on(window, EVENT_LOAD_DATA_API, () => {
  for (const spy of SelectorEngine.find(SELECTOR_DATA_SPY)) {
    ScrollSpy.getOrCreateInstance(spy)
  }
})

export default ScrollSpy
export type { ScrollSpyConfig }
