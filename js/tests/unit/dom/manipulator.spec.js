import Manipulator from '../../../src/dom/manipulator.js'
import { clearFixture, getFixture } from '../../helpers/fixture.js'

describe('Manipulator', () => {
  let fixtureEl

  beforeAll(() => {
    fixtureEl = getFixture()
  })

  afterEach(() => {
    clearFixture()
  })

  describe('setDataAttribute', () => {
    it('should set data attribute prefixed with cx', () => {
      fixtureEl.innerHTML = '<div></div>'

      const div = fixtureEl.querySelector('div')

      Manipulator.setDataAttribute(div, 'key', 'value')
      expect(div.getAttribute('data-cx-key')).toEqual('value')
    })

    it('should set data attribute in kebab case', () => {
      fixtureEl.innerHTML = '<div></div>'

      const div = fixtureEl.querySelector('div')

      Manipulator.setDataAttribute(div, 'testKey', 'value')
      expect(div.getAttribute('data-cx-test-key')).toEqual('value')
    })
  })

  describe('removeDataAttribute', () => {
    it('should only remove cx-prefixed data attribute', () => {
      fixtureEl.innerHTML = '<div data-cx-key="value" data-key-cx="postfixed" data-key="value"></div>'

      const div = fixtureEl.querySelector('div')

      Manipulator.removeDataAttribute(div, 'key')
      expect(div.getAttribute('data-cx-key')).toBeNull()
      expect(div.getAttribute('data-key-cx')).toEqual('postfixed')
      expect(div.getAttribute('data-key')).toEqual('value')
    })

    it('should remove data attribute in kebab case', () => {
      fixtureEl.innerHTML = '<div data-cx-test-key="value"></div>'

      const div = fixtureEl.querySelector('div')

      Manipulator.removeDataAttribute(div, 'testKey')
      expect(div.getAttribute('data-cx-test-key')).toBeNull()
    })
  })

  describe('getDataAttributes', () => {
    it('should return an empty object for null', () => {
      expect(Manipulator.getDataAttributes(null)).toEqual({})
      expect().nothing()
    })

    it('should get only cx-prefixed data attributes without cx namespace', () => {
      fixtureEl.innerHTML = '<div data-cx-toggle="tabs" data-cx-target="#element" data-another="value" data-target-cx="#element" data-in-cx-out="in-between"></div>'

      const div = fixtureEl.querySelector('div')

      expect(Manipulator.getDataAttributes(div)).toEqual({
        toggle: 'tabs',
        target: '#element'
      })
    })

    it('should omit `cx-config` data attribute', () => {
      fixtureEl.innerHTML = '<div data-cx-toggle="tabs" data-cx-target="#element" data-cx-config=\'{"testBool":false}\'></div>'

      const div = fixtureEl.querySelector('div')

      expect(Manipulator.getDataAttributes(div)).toEqual({
        toggle: 'tabs',
        target: '#element'
      })
    })
  })

  describe('getDataAttribute', () => {
    it('should only get cx-prefixed data attribute', () => {
      fixtureEl.innerHTML = '<div data-cx-key="value" data-test-cx="postFixed" data-toggle="tab"></div>'

      const div = fixtureEl.querySelector('div')

      expect(Manipulator.getDataAttribute(div, 'key')).toEqual('value')
      expect(Manipulator.getDataAttribute(div, 'test')).toBeNull()
      expect(Manipulator.getDataAttribute(div, 'toggle')).toBeNull()
    })

    it('should get data attribute in kebab case', () => {
      fixtureEl.innerHTML = '<div data-cx-test-key="value" ></div>'

      const div = fixtureEl.querySelector('div')

      expect(Manipulator.getDataAttribute(div, 'testKey')).toEqual('value')
    })

    it('should normalize data', () => {
      fixtureEl.innerHTML = '<div data-cx-test="false" ></div>'

      const div = fixtureEl.querySelector('div')

      expect(Manipulator.getDataAttribute(div, 'test')).toBeFalse()

      div.setAttribute('data-cx-test', 'true')
      expect(Manipulator.getDataAttribute(div, 'test')).toBeTrue()

      div.setAttribute('data-cx-test', '1')
      expect(Manipulator.getDataAttribute(div, 'test')).toEqual(1)
    })

    it('should normalize json data', () => {
      fixtureEl.innerHTML = '<div data-cx-test=\'{"delay":{"show":100,"hide":10}}\'></div>'

      const div = fixtureEl.querySelector('div')

      expect(Manipulator.getDataAttribute(div, 'test')).toEqual({ delay: { show: 100, hide: 10 } })

      const objectData = { 'Super Hero': ['Iron Man', 'Super Man'], testNum: 90, url: 'http://localhost:8080/test?foo=bar' }
      const dataStr = JSON.stringify(objectData)
      div.setAttribute('data-cx-test', encodeURIComponent(dataStr))
      expect(Manipulator.getDataAttribute(div, 'test')).toEqual(objectData)

      div.setAttribute('data-cx-test', dataStr)
      expect(Manipulator.getDataAttribute(div, 'test')).toEqual(objectData)
    })
  })
})
