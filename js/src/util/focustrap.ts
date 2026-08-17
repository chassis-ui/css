/**
 * --------------------------------------------------------------------------
 * Chassis CSS util/focustrap.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */

import EventHandler, { type ChassisEvent } from '../dom/event-handler.js'
import SelectorEngine from '../dom/selector-engine.js'
import Config from './config.js'

/**
 * Constants
 */

const NAME = 'focustrap'
const DATA_KEY = 'cx.focustrap'
const EVENT_KEY = `.${DATA_KEY}`
const EVENT_FOCUSIN = `focusin${EVENT_KEY}`
const EVENT_KEYDOWN_TAB = `keydown.tab${EVENT_KEY}`

const TAB_KEY = 'Tab'
const TAB_NAV_FORWARD = 'forward'
const TAB_NAV_BACKWARD = 'backward'

type FocusTrapConfig = {
  autofocus: boolean
  trapElement: HTMLElement | null // The element to trap focus inside of
}

const Default: FocusTrapConfig = {
  autofocus: true,
  trapElement: null
}

const DefaultType = {
  autofocus: 'boolean',
  trapElement: 'element'
}

/**
 * Class definition
 */

class FocusTrap extends Config {
  protected declare _config: FocusTrapConfig
  protected declare _isActive: boolean
  protected declare _lastTabNavDirection: string | null

  constructor(config?: Partial<FocusTrapConfig> | null) {
    super()
    this._config = this._getConfig(config) as FocusTrapConfig
    this._isActive = false
    this._lastTabNavDirection = null
  }

  // Getters
  static override get Default(): FocusTrapConfig {
    return Default
  }

  static override get DefaultType(): Record<string, string> {
    return DefaultType
  }

  static override get NAME(): string {
    return NAME
  }

  // Public
  activate(): void {
    if (this._isActive) {
      return
    }

    if (this._config.autofocus) {
      this._config.trapElement!.focus()
    }

    EventHandler.off(document, EVENT_KEY) // guard against infinite focus loop
    EventHandler.on(document, EVENT_FOCUSIN, event => this._handleFocusin(event))
    EventHandler.on(document, EVENT_KEYDOWN_TAB, event => this._handleKeydown(event))

    this._isActive = true
  }

  deactivate(): void {
    if (!this._isActive) {
      return
    }

    this._isActive = false
    EventHandler.off(document, EVENT_KEY)
  }

  // Private
  protected _handleFocusin(event: ChassisEvent): void {
    const { trapElement } = this._config

    if (event.target === document || event.target === trapElement || trapElement!.contains(event.target as Node)) {
      return
    }

    const elements = SelectorEngine.focusableChildren(trapElement!)

    if (elements.length === 0) {
      trapElement!.focus()
    } else if (this._lastTabNavDirection === TAB_NAV_BACKWARD) {
      elements.at(-1)!.focus()
    } else {
      elements[0].focus()
    }
  }

  protected _handleKeydown(event: ChassisEvent): void {
    if (event.key !== TAB_KEY) {
      return
    }

    this._lastTabNavDirection = event.shiftKey ? TAB_NAV_BACKWARD : TAB_NAV_FORWARD
  }
}

export default FocusTrap
export type { FocusTrapConfig }
