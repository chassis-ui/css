import Notification from '../../src/notification.js'
import { clearFixture, getFixture } from '../helpers/fixture.js'

describe('Notification', () => {
  let fixtureEl

  beforeAll(() => {
    fixtureEl = getFixture()
  })

  afterEach(() => {
    clearFixture()
  })

  it('should take care of element either passed as a CSS selector or DOM element', () => {
    fixtureEl.innerHTML = '<div class="notification"></div>'

    const notificationEl = fixtureEl.querySelector('.notification')
    const notificationBySelector = new Notification('.notification')
    const notificationByElement = new Notification(notificationEl)

    expect(notificationBySelector._element).toEqual(notificationEl)
    expect(notificationByElement._element).toEqual(notificationEl)
  })

  it('should return version', () => {
    expect(Notification.VERSION).toEqual(jasmine.any(String))
  })

  describe('DATA_KEY', () => {
    it('should return plugin data key', () => {
      expect(Notification.DATA_KEY).toEqual('cx.notification')
    })
  })

  describe('data-api', () => {
    it('should close an notification without instantiating it manually', () => {
      fixtureEl.innerHTML = [
        '<div class="notification">',
        '  <button type="button" data-cx-dismiss="notification">x</button>',
        '</div>'
      ].join('')

      const button = document.querySelector('button')

      button.click()
      expect(document.querySelectorAll('.notification')).toHaveSize(0)
    })

    it('should close an notification without instantiating it manually with the parent selector', () => {
      fixtureEl.innerHTML = [
        '<div class="notification">',
        '  <button type="button" data-cx-target=".notification" data-cx-dismiss="notification">x</button>',
        '</div>'
      ].join('')

      const button = document.querySelector('button')

      button.click()
      expect(document.querySelectorAll('.notification')).toHaveSize(0)
    })
  })

  describe('close', () => {
    it('should close an notification', () => {
      return new Promise(resolve => {
        // getTransitionDurationFromElement reads style via window.getComputedStyle;
        // spying on that is the only bundler-safe way to detect whether it ran,
        // since the ESM import binding itself can't be replaced by spyOn.
        // Assert by argument (not just "not called") — window.getComputedStyle
        // is global and shared across the whole Karma page, so other unrelated
        // code can legitimately call it during this test's window.
        const spy = spyOn(window, 'getComputedStyle').and.callThrough()
        fixtureEl.innerHTML = '<div class="notification"></div>'

        const notificationEl = document.querySelector('.notification')
        const notification = new Notification(notificationEl)

        notificationEl.addEventListener('closed.cx.notification', () => {
          expect(document.querySelectorAll('.notification')).toHaveSize(0)
          expect(spy).not.toHaveBeenCalledWith(notificationEl)
          resolve()
        })

        notification.close()
      })
    })

    it('should close notification with fade class', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<div class="notification fade"></div>'

        const notificationEl = document.querySelector('.notification')
        const notification = new Notification(notificationEl)

        notificationEl.addEventListener('transitionend', () => {
          expect().nothing()
        })

        notificationEl.addEventListener('closed.cx.notification', () => {
          expect(document.querySelectorAll('.notification')).toHaveSize(0)
          resolve()
        })

        notification.close()
      })
    })

    it('should not remove notification if close event is prevented', () => {
      return new Promise((resolve, reject) => {
        fixtureEl.innerHTML = '<div class="notification"></div>'

        const getNotification = () => document.querySelector('.notification')
        const notificationEl = getNotification()
        const notification = new Notification(notificationEl)

        notificationEl.addEventListener('close.cx.notification', event => {
          event.preventDefault()
          setTimeout(() => {
            expect(getNotification()).not.toBeNull()
            resolve()
          }, 10)
        })

        notificationEl.addEventListener('closed.cx.notification', () => {
          reject(new Error('should not fire closed event'))
        })

        notification.close()
      })
    })
  })

  describe('dispose', () => {
    it('should dispose an notification', () => {
      fixtureEl.innerHTML = '<div class="notification"></div>'

      const notificationEl = document.querySelector('.notification')
      const notification = new Notification(notificationEl)

      expect(Notification.getInstance(notificationEl)).not.toBeNull()

      notification.dispose()

      expect(Notification.getInstance(notificationEl)).toBeNull()
    })
  })

  describe('getInstance', () => {
    it('should return notification instance', () => {
      fixtureEl.innerHTML = '<div></div>'

      const div = fixtureEl.querySelector('div')
      const notification = new Notification(div)

      expect(Notification.getInstance(div)).toEqual(notification)
      expect(Notification.getInstance(div)).toBeInstanceOf(Notification)
    })

    it('should return null when there is no notification instance', () => {
      fixtureEl.innerHTML = '<div></div>'

      const div = fixtureEl.querySelector('div')

      expect(Notification.getInstance(div)).toBeNull()
    })
  })

  describe('getOrCreateInstance', () => {
    it('should return notification instance', () => {
      fixtureEl.innerHTML = '<div></div>'

      const div = fixtureEl.querySelector('div')
      const notification = new Notification(div)

      expect(Notification.getOrCreateInstance(div)).toEqual(notification)
      expect(Notification.getInstance(div)).toEqual(Notification.getOrCreateInstance(div, {}))
      expect(Notification.getOrCreateInstance(div)).toBeInstanceOf(Notification)
    })

    it('should return new instance when there is no notification instance', () => {
      fixtureEl.innerHTML = '<div></div>'

      const div = fixtureEl.querySelector('div')

      expect(Notification.getInstance(div)).toBeNull()
      expect(Notification.getOrCreateInstance(div)).toBeInstanceOf(Notification)
    })
  })
})
