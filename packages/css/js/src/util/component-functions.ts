/**
 * --------------------------------------------------------------------------
 * Chassis CSS util/component-functions.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */

import type BaseComponent from '../base-component.js'
import EventHandler, { type ChassisEvent } from '../dom/event-handler.js'
import SelectorEngine from '../dom/selector-engine.js'
import { isDisabled, preventNavigationForAnchor } from './index.js'

interface EventActionData {
  targets: HTMLElement[]
  event: ChassisEvent
}

const enableDismissTrigger = (component: typeof BaseComponent, method = 'hide'): void => {
  const clickEvent = `click.dismiss${component.EVENT_KEY}`
  const name = component.NAME

  EventHandler.on(document, clickEvent, `[data-cx-dismiss="${name}"]`, function (event) {
    preventNavigationForAnchor(event, this)

    if (isDisabled(this)) {
      return
    }

    const target = SelectorEngine.getElementFromSelector(this) || this.closest(`.${name}`)
    if (!target) {
      return
    }

    const instance: any = component.getOrCreateInstance(target)

    // Method argument is left, for Alert and only, as it doesn't implement the 'hide' method
    instance[method]()
  })
}

type EventActionCallback = (data: EventActionData & { instances: BaseComponent[] }) => void

const eventActionOnPlugin = (Plugin: typeof BaseComponent, onEvent: string, stringSelector: string, method: string, callback: EventActionCallback | null = null): void => {
  eventAction(`${onEvent}.${Plugin.NAME}`, stringSelector, data => {
    const instances = data.targets.filter(Boolean).map(element => Plugin.getOrCreateInstance(element))
    if (typeof callback === 'function') {
      callback({ ...data, instances })
    }

    for (const instance of instances) {
      (instance as any)[method]()
    }
  })
}

const eventAction = (onEvent: string, stringSelector: string, callback: (data: EventActionData) => void): void => {
  const selector = `${stringSelector}:not(.disabled):not(:disabled)`
  EventHandler.on(document, onEvent, selector, function (event) {
    preventNavigationForAnchor(event, this)

    const selector = SelectorEngine.getSelectorFromElement(this)
    const targets = selector ? SelectorEngine.find(selector) : [this as HTMLElement]

    callback({ targets, event })
  })
}

export {
  enableDismissTrigger,
  eventActionOnPlugin
}
