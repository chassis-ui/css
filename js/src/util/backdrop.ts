/**
 * --------------------------------------------------------------------------
 * Chassis CSS util/backdrop.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */

import EventHandler from '../dom/event-handler.js'
import Config from './config.js'
import {
  execute, executeAfterTransition, getElement, reflow
} from './index.js'

/**
 * Constants
 */

const NAME = 'backdrop'
const CLASS_NAME_FADE = 'fade'
const CLASS_NAME_SHOW = 'show'
const EVENT_MOUSEDOWN = `mousedown.cx.${NAME}`

type BackdropConfig = {
  className: string
  clickCallback: (() => void) | null
  isAnimated: boolean
  isVisible: boolean
  rootElement: HTMLElement | string | null
}

const Default: BackdropConfig = {
  className: 'modal-backdrop',
  clickCallback: null,
  isAnimated: false,
  isVisible: true, // if false, we use the backdrop helper without adding any element to the dom
  rootElement: 'body' // give the choice to place backdrop under different elements
}

const DefaultType = {
  className: 'string',
  clickCallback: '(function|null)',
  isAnimated: 'boolean',
  isVisible: 'boolean',
  rootElement: '(element|string)'
}

/**
 * Class definition
 */

class Backdrop extends Config {
  protected declare _config: BackdropConfig
  protected declare _isAppended: boolean
  protected declare _element: HTMLElement | null

  constructor(config?: Partial<BackdropConfig> | null) {
    super()
    this._config = this._getConfig(config) as BackdropConfig
    this._isAppended = false
    this._element = null
  }

  // Getters
  static override get Default(): BackdropConfig {
    return Default
  }

  static override get DefaultType(): Record<string, string> {
    return DefaultType
  }

  static override get NAME(): string {
    return NAME
  }

  // Public
  show(callback?: () => void): void {
    if (!this._config.isVisible) {
      execute(callback)
      return
    }

    this._append()

    const element = this._getElement()
    if (this._config.isAnimated) {
      reflow(element)
    }

    element.classList.add(CLASS_NAME_SHOW)

    this._emulateAnimation(() => {
      execute(callback)
    })
  }

  hide(callback?: () => void): void {
    if (!this._config.isVisible) {
      execute(callback)
      return
    }

    this._getElement().classList.remove(CLASS_NAME_SHOW)

    this._emulateAnimation(() => {
      this.dispose()
      execute(callback)
    })
  }

  dispose(): void {
    if (!this._isAppended) {
      return
    }

    EventHandler.off(this._element, EVENT_MOUSEDOWN)

    this._element!.remove()
    this._isAppended = false
  }

  // Private
  protected _getElement(): HTMLElement {
    if (!this._element) {
      const backdrop = document.createElement('div')
      backdrop.className = this._config.className
      if (this._config.isAnimated) {
        backdrop.classList.add(CLASS_NAME_FADE)
      }

      this._element = backdrop
    }

    return this._element
  }

  protected _configAfterMerge(config: BackdropConfig): BackdropConfig {
    // use getElement() with the default "body" to get a fresh Element on each instantiation
    config.rootElement = getElement(config.rootElement)
    return config
  }

  protected _append(): void {
    if (this._isAppended) {
      return
    }

    const element = this._getElement()
    ;(this._config.rootElement as HTMLElement).append(element)

    EventHandler.on(element, EVENT_MOUSEDOWN, () => {
      execute(this._config.clickCallback)
    })

    this._isAppended = true
  }

  protected _emulateAnimation(callback: () => void): void {
    executeAfterTransition(callback, this._getElement(), this._config.isAnimated)
  }
}

export default Backdrop
export type { BackdropConfig }
