/**
 * --------------------------------------------------------------------------
 * Chassis CSS util/config.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */

import Manipulator from '../dom/manipulator.js'
import { isElement, toType } from './index.js'

/**
 * Types
 */

type ComponentConfig = Record<string, any>

/**
 * Class definition
 */

class Config<TConfig extends ComponentConfig = ComponentConfig> {
  declare ['constructor']: typeof Config<any>

  // Getters
  static get Default(): ComponentConfig {
    return {}
  }

  static get DefaultType(): ComponentConfig {
    return {}
  }

  static get NAME(): string {
    throw new Error('You have to implement the static method "NAME", for each component!')
  }

  protected _getConfig(config?: Partial<TConfig> | null): TConfig {
    let mergedConfig = this._mergeConfigObj(config)
    mergedConfig = this._configAfterMerge(mergedConfig)
    this._typeCheckConfig(mergedConfig)
    return mergedConfig
  }

  protected _configAfterMerge(config: TConfig): TConfig {
    return config
  }

  protected _mergeConfigObj(config?: Partial<TConfig> | null, element?: Element): TConfig {
    const jsonConfig = isElement(element) ? Manipulator.getDataAttribute(element, 'config') : {} // try to parse
    const dataAttributes = isElement(element) ? Manipulator.getDataAttributes(element as HTMLElement) : {}

    for (const key of this._excludedConfigKeys()) {
      if (typeof jsonConfig === 'object' && jsonConfig !== null) {
        delete (jsonConfig as ComponentConfig)[key]
      }

      delete dataAttributes[key]
    }

    return {
      ...this.constructor.Default,
      ...(typeof jsonConfig === 'object' ? jsonConfig : {}),
      ...dataAttributes,
      ...(typeof config === 'object' ? config : {})
    } as TConfig
  }

  // Override to strip config keys that should never come from a data-*
  // attribute or the data-cx-config JSON blob (e.g. keys only safe to set
  // programmatically), before they reach the merged config object.
  protected _excludedConfigKeys(): string[] {
    return []
  }

  protected _typeCheckConfig(config: ComponentConfig, configTypes: ComponentConfig = this.constructor.DefaultType): void {
    for (const [property, expectedTypes] of Object.entries(configTypes)) {
      const value = config[property]
      const valueType = isElement(value) ? 'element' : toType(value)

      if (!new RegExp(expectedTypes).test(valueType)) {
        throw new TypeError(
          `${this.constructor.NAME.toUpperCase()}: Option "${property}" provided type "${valueType}" but expected type "${expectedTypes}".`
        )
      }
    }
  }
}

export default Config
export type { ComponentConfig }
