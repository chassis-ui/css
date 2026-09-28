/**
 * --------------------------------------------------------------------------
 * Chassis CSS dom/manipulator.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */

function normalizeData(value: string | null | undefined): unknown {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  if (value === Number(value).toString()) {
    return Number(value)
  }

  if (value === '' || value === 'null') {
    return null
  }

  if (typeof value !== 'string') {
    return value
  }

  try {
    return JSON.parse(decodeURIComponent(value))
  } catch {
    return value
  }
}

function normalizeDataKey(key: string): string {
  return key.replace(/[A-Z]/g, chr => `-${chr.toLowerCase()}`)
}

const Manipulator = {
  setDataAttribute(element: Element, key: string, value: unknown): void {
    element.setAttribute(`data-cx-${normalizeDataKey(key)}`, value as string)
  },

  removeDataAttribute(element: Element, key: string): void {
    element.removeAttribute(`data-cx-${normalizeDataKey(key)}`)
  },

  getDataAttributes(element: HTMLElement | null): Record<string, unknown> {
    if (!element) {
      return {}
    }

    const attributes: Record<string, unknown> = {}
    const cxKeys = Object.keys(element.dataset).filter(key => key.startsWith('cx') && !key.startsWith('cxConfig'))

    for (const key of cxKeys) {
      let pureKey = key.replace(/^cx/, '')
      pureKey = pureKey.charAt(0).toLowerCase() + pureKey.slice(1)
      attributes[pureKey] = normalizeData(element.dataset[key])
    }

    return attributes
  },

  getDataAttribute(element: Element, key: string): unknown {
    return normalizeData(element.getAttribute(`data-cx-${normalizeDataKey(key)}`))
  }
}

export default Manipulator
