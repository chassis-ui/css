/*!
 * Maps the Jasmine API our specs use onto Vitest.
 *
 * The specs predate Vitest and are written against Jasmine, so this shim lets
 * them run unchanged instead of forcing a rewrite of the whole unit suite. New
 * specs should prefer the plain Vitest API. The one behaviour to watch is
 * `spyOn`, which stubs by default here to match Jasmine; `vi.spyOn` calls
 * through.
 * --------------------------------------------------------------------------
 * Chassis CSS vitest-setup.js
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */

import { afterEach, beforeEach, expect, vi } from 'vitest'
import hammerSimulatorSource from 'hammer-simulator/index.js?raw'

/**
 * hammer-simulator is from 2014 and sets `event.target`, which is a getter-only
 * property. Karma bundled it into a classic script, where that assignment fails
 * silently. ES modules are always strict mode, so the same line throws. Running
 * the source through `new Function` restores the sloppy-mode behaviour the suite
 * has always relied on. The assignment was always a no-op: `dispatchEvent` is
 * what sets the real target.
 */
new Function(hammerSimulatorSource)()

/**
 * Spies
 *
 * This is the one behaviour that cannot be codemodded safely. Jasmine's `spyOn`
 * replaces the method with a stub that returns undefined. Vitest's `vi.spyOn`
 * keeps calling the real method. A spec that says `spyOn(el, 'focus')` expects
 * the focus call to be swallowed, so the shim stubs by default and puts the
 * real implementation back only when the spec asks with `.and.callThrough()`.
 */
const attachJasmineApi = (spy, original) => {
  const callThrough = () => {
    spy.mockImplementation(function (...args) {
      return original.apply(this, args)
    })
    return spy
  }

  spy.and = {
    callThrough,
    stub() {
      spy.mockImplementation(() => {})
      return spy
    },
    returnValue(value) {
      spy.mockImplementation(() => value)
      return spy
    },
    returnValues(...values) {
      let index = 0
      spy.mockImplementation(() => values[index++])
      return spy
    },
    callFake(fake) {
      spy.mockImplementation(fake)
      return spy
    },
    throwError(error) {
      spy.mockImplementation(() => {
        throw typeof error === 'string' ? new Error(error) : error
      })
      return spy
    }
  }

  Object.defineProperty(spy, 'calls', {
    configurable: true,
    get() {
      const { calls, results } = spy.mock
      const entry = index => (
        index in calls ? { args: calls[index], returnValue: results[index]?.value } : undefined
      )

      return {
        count: () => calls.length,
        any: () => calls.length > 0,
        allArgs: () => calls,
        argsFor: index => calls[index],
        all: () => calls.map((_, index) => entry(index)),
        first: () => entry(0),
        mostRecent: () => entry(calls.length - 1),
        reset: () => spy.mockClear()
      }
    }
  })

  return spy
}

globalThis.spyOn = (object, method) => {
  const original = object[method]
  const spy = vi.spyOn(object, method)

  spy.mockImplementation(() => {})

  return attachJasmineApi(spy, original)
}

globalThis.spyOnProperty = (object, property, accessType = 'get') => {
  let original
  for (let target = object; target; target = Object.getPrototypeOf(target)) {
    const descriptor = Object.getOwnPropertyDescriptor(target, property)
    if (descriptor) {
      original = descriptor[accessType]
      break
    }
  }

  const spy = vi.spyOn(object, property, accessType)

  spy.mockImplementation(() => {})

  return attachJasmineApi(spy, original ?? (() => {}))
}

globalThis.jasmine = {
  any: expected => expect.any(expected),
  anything: () => expect.anything(),
  objectContaining: expected => expect.objectContaining(expected),
  arrayContaining: expected => expect.arrayContaining(expected),
  stringMatching: expected => expect.stringMatching(expected),
  createSpy(_name, fake) {
    return attachJasmineApi(vi.fn(fake), fake ?? (() => {}))
  },
  clock: () => ({
    install: () => vi.useFakeTimers(),
    uninstall: () => vi.useRealTimers(),
    tick: ms => vi.advanceTimersByTime(ms),
    mockDate: date => vi.setSystemTime(date)
  })
}

/**
 * Matchers Jasmine 6 ships built in and Vitest does not
 */
const result = (pass, message) => ({ pass, message: () => message })

expect.extend({
  toHaveClass(received, className) {
    const pass = Boolean(received?.classList?.contains(className))
    return result(pass, `expected ${received?.tagName ?? received} ${pass ? 'not ' : ''}to have class "${className}"`)
  },
  toBeTrue(received) {
    return result(received === true, `expected ${received} to be exactly true`)
  },
  toBeFalse(received) {
    return result(received === false, `expected ${received} to be exactly false`)
  },
  toHaveSize(received, size) {
    const actual = received?.length ?? received?.size
    return result(actual === size, `expected size ${size}, got ${actual}`)
  },
  nothing() {
    return result(true, '')
  }
})

/**
 * The specs load no stylesheet, but the plugins resolve custom property names
 * through the `--chassis-prefix` marker the PostCSS preset writes on `:root`
 * (see `cssVar()` in js/src/util/index.ts). Declare it as the built CSS would,
 * fresh before each spec so one that changes or removes it can't leak.
 */
beforeEach(() => {
  document.documentElement.style.setProperty('--chassis-prefix', 'cx-')
})

/**
 * Jasmine removes every spy after each spec. Vitest keeps them, so without this
 * a stubbed method would stay stubbed for the rest of the file.
 */
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})
