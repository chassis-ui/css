/**
 * --------------------------------------------------------------------------
 * Chassis CSS popover.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */

import Tooltip, { type TooltipConfig } from './tooltip.js'
import EventHandler, { type ChassisEvent } from './dom/event-handler.js'
import type { TemplateContentEntry } from './util/template-factory.js'

/**
 * Constants
 */

const NAME = 'popover'

const SELECTOR_TITLE = '.popover-header'
const SELECTOR_CONTENT = '.popover-body'
const SELECTOR_DATA_TOGGLE = '[data-cx-toggle="popover"]'

const EVENT_CLICK = 'click'
const EVENT_FOCUSIN = 'focusin'
const EVENT_MOUSEENTER = 'mouseenter'

type PopoverConfig = TooltipConfig & {
  content: string | Element | ((...args: any[]) => string | Element) | null
}

const Default: PopoverConfig = {
  ...Tooltip.Default,
  content: '',
  offset: [0, 8],
  placement: 'right',
  template: '<div class="popover" role="tooltip">' +
    '<div class="popover-arrow"></div>' +
    '<h3 class="popover-header"></h3>' +
    '<div class="popover-body"></div>' +
    '</div>',
  trigger: 'click'
}

const DefaultType = {
  ...Tooltip.DefaultType,
  content: '(null|string|element|function)'
}

/**
 * Class definition
 */

class Popover extends Tooltip {
  protected declare _config: PopoverConfig

  // Without this override, `ConstructorParameters<typeof Popover>[1]` would
  // resolve to Tooltip's narrower `Partial<TooltipConfig>` (missing
  // `content`), and `Popover.getOrCreateInstance(target, config)` in the
  // data-API handling code (which passes a `content`-bearing config) would
  // fail to type-check - same reasoning as Dialog's constructor override
  // from Phase 5 (see .claude/ts-migration-plan.md).
  constructor(element?: string | Element | null, config?: Partial<PopoverConfig> | null) {
    super(element, config)
  }

  // Getters
  static override get Default(): PopoverConfig {
    return Default
  }

  static override get DefaultType(): Record<string, string> {
    return DefaultType
  }

  static override get NAME(): string {
    return NAME
  }

  // Overrides
  protected override _isWithContent(): boolean {
    return Boolean(this._getTitle() || this._getContent())
  }

  // Private
  protected override _getContentForTemplate(): Record<string, TemplateContentEntry> {
    return {
      [SELECTOR_TITLE]: this._getTitle(),
      [SELECTOR_CONTENT]: this._getContent()
    }
  }

  protected _getContent(): string | Element | null {
    return this._resolvePossibleFunction(this._config.content)
  }
}

/**
 * Data API implementation - auto-initialize popovers
 */

const initPopover = (event: ChassisEvent): void => {
  const target = (event.target as Element).closest(SELECTOR_DATA_TOGGLE)
  if (!target) {
    return
  }

  // Prevent default for click events to avoid navigation (e.g. <a href="#">)
  if (event.type === 'click') {
    event.preventDefault()
  }

  // Lazily create the instance. The instance's own `_setListeners()` registers
  // the appropriate listeners on the element for the configured triggers
  // (click/focus/hover), so we don't toggle or call `_enter` here — doing so
  // would duplicate handlers and leave stale state on `_activeTrigger`.
  Popover.getOrCreateInstance(target)
}

// Auto-initialize popovers on first interaction for click, hover, and focus triggers
EventHandler.on(document, EVENT_CLICK, SELECTOR_DATA_TOGGLE, initPopover)
EventHandler.on(document, EVENT_FOCUSIN, SELECTOR_DATA_TOGGLE, initPopover)
EventHandler.on(document, EVENT_MOUSEENTER, SELECTOR_DATA_TOGGLE, initPopover)

export default Popover
export type { PopoverConfig }
