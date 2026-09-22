/**
 * --------------------------------------------------------------------------
 * Chassis CSS base-component.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */

import Data from './dom/data.js'
import EventHandler from './dom/event-handler.js'
import Config, { type ComponentConfig } from './util/config.js'
import { executeAfterTransition, getElement } from './util/index.js'

/**
 * Constants
 */

const VERSION = '0.5.1'

// Tracks disposed instances outside the instance itself, since dispose()'s
// own property-nulling loop would otherwise stomp on any flag set on `this`.
const disposedInstances = new WeakSet<BaseComponent>()

/**
 * Class definition
 */

class BaseComponent extends Config<ComponentConfig> {
  declare ['constructor']: typeof BaseComponent
  protected declare _element: HTMLElement
  protected declare _config: ComponentConfig

  constructor(element?: string | Element | null, config?: ComponentConfig | null) {
    super()

    element = getElement(element)
    if (!element) {
      return
    }

    this._element = element as HTMLElement
    this._config = this._getConfig(config)

    Data.set(this._element, this.constructor.DATA_KEY, this)
  }

  // Public
  dispose(): void {
    disposedInstances.add(this)

    Data.remove(this._element, this.constructor.DATA_KEY)
    EventHandler.off(this._element, this.constructor.EVENT_KEY)

    for (const propertyName of Object.getOwnPropertyNames(this)) {
      (this as Record<string, any>)[propertyName] = null
    }
  }

  isDisposed(): boolean {
    return disposedInstances.has(this)
  }

  // Private
  protected _queueCallback(callback: () => void, element: Element, isAnimated = true): void {
    executeAfterTransition(callback, element, isAnimated)
  }

  protected override _getConfig(config?: ComponentConfig | null): ComponentConfig {
    config = this._mergeConfigObj(config, this._element)
    config = this._configAfterMerge(config)
    this._typeCheckConfig(config)
    return config
  }

  // Static
  static getInstance<T extends typeof BaseComponent>(this: T, element?: string | Element | null): InstanceType<T> | null {
    return Data.get(getElement(element), this.DATA_KEY)
  }

  static getOrCreateInstance<T extends typeof BaseComponent>(this: T, element?: string | Element | null, config: NonNullable<ConstructorParameters<T>[1]> | null = {}): InstanceType<T> {
    return this.getInstance(element) || (new this(element, typeof config === 'object' ? config : null) as InstanceType<T>)
  }

  static get VERSION(): string {
    return VERSION
  }

  static get DATA_KEY(): string {
    return `cx.${this.NAME}`
  }

  static get EVENT_KEY(): string {
    return `.${this.DATA_KEY}`
  }

  static eventName(name: string): string {
    return `${name}${this.EVENT_KEY}`
  }
}

export default BaseComponent
