import Data from '../../src/dom/data.js'
import EventHandler from '../../src/dom/event-handler.js'
import Dialog from '../../src/dialog.js'
import {
  clearBodyAndDocument, clearFixture, createEvent, getFixture
} from '../helpers/fixture.js'

describe('Dialog', () => {
  let fixtureEl

  beforeAll(() => {
    fixtureEl = getFixture()
  })

  afterEach(() => {
    clearFixture()
    clearBodyAndDocument()
    document.body.classList.remove('dialog-open')

    for (const dialog of document.querySelectorAll('dialog[open]')) {
      dialog.close()
    }
  })

  beforeEach(() => {
    clearBodyAndDocument()
  })

  describe('VERSION', () => {
    it('should return plugin version', () => {
      expect(Dialog.VERSION).toEqual(jasmine.any(String))
    })
  })

  describe('Default', () => {
    it('should return plugin default config', () => {
      expect(Dialog.Default).toEqual(jasmine.any(Object))
    })
  })

  describe('DATA_KEY', () => {
    it('should return plugin data key', () => {
      expect(Dialog.DATA_KEY).toEqual('cx.dialog')
    })
  })

  describe('constructor', () => {
    it('should take care of element either passed as a CSS selector or DOM element', () => {
      fixtureEl.innerHTML = '<dialog class="dialog" id="testDialog"></dialog>'

      const dialogEl = fixtureEl.querySelector('.dialog')
      const dialogBySelector = new Dialog('#testDialog')
      const dialogByElement = new Dialog(dialogEl)

      expect(dialogBySelector._element).toEqual(dialogEl)
      expect(dialogByElement._element).toEqual(dialogEl)
    })
  })

  describe('toggle', () => {
    it('should toggle the dialog open state', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl)

        dialogEl.addEventListener('shown.cx.dialog', () => {
          expect(dialogEl.open).toBeTrue()
          dialog.toggle()
        })

        dialogEl.addEventListener('hidden.cx.dialog', () => {
          expect(dialogEl.open).toBeFalse()
          resolve()
        })

        dialog.toggle()
      })
    })
  })

  describe('show', () => {
    it('should show a dialog', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl)

        dialogEl.addEventListener('show.cx.dialog', event => {
          expect(event).toBeDefined()
        })

        dialogEl.addEventListener('shown.cx.dialog', () => {
          expect(dialogEl.open).toBeTrue()
          expect(document.body.classList.contains('dialog-open')).toBeTrue()
          resolve()
        })

        dialog.show()
      })
    })

    it('should pass relatedTarget to show event', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<button id="trigger"></button>',
          '<dialog class="dialog"></dialog>'
        ].join('')

        const dialogEl = fixtureEl.querySelector('.dialog')
        const trigger = fixtureEl.querySelector('#trigger')
        const dialog = new Dialog(dialogEl)

        dialogEl.addEventListener('show.cx.dialog', event => {
          expect(event.relatedTarget).toEqual(trigger)
        })

        dialogEl.addEventListener('shown.cx.dialog', event => {
          expect(event.relatedTarget).toEqual(trigger)
          resolve()
        })

        dialog.show(trigger)
      })
    })

    it('should do nothing if a dialog is already open', () => {
      fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

      const dialogEl = fixtureEl.querySelector('.dialog')
      const dialog = new Dialog(dialogEl)

      // Manually open the dialog
      dialogEl.showModal()

      const spy = spyOn(EventHandler, 'trigger')
      dialog.show()

      expect(spy).not.toHaveBeenCalled()
    })

    it('should do nothing if a dialog is transitioning', () => {
      fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

      const dialogEl = fixtureEl.querySelector('.dialog')
      const dialog = new Dialog(dialogEl)

      const spy = spyOn(EventHandler, 'trigger')
      dialog._isTransitioning = true

      dialog.show()

      expect(spy).not.toHaveBeenCalled()
    })

    it('should not fire shown event when show is prevented', () => {
      return new Promise((resolve, reject) => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl)

        dialogEl.addEventListener('show.cx.dialog', event => {
          event.preventDefault()

          const expectedDone = () => {
            expect().nothing()
            resolve()
          }

          setTimeout(expectedDone, 10)
        })

        dialogEl.addEventListener('shown.cx.dialog', () => {
          reject(new Error('shown event triggered'))
        })

        dialog.show()
      })
    })

    it('should set is transitioning if fade class is present', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog fade"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl)

        dialogEl.addEventListener('show.cx.dialog', () => {
          setTimeout(() => {
            expect(dialog._isTransitioning).toBeTrue()
          })
        })

        dialogEl.addEventListener('shown.cx.dialog', () => {
          expect(dialog._isTransitioning).toBeFalse()
          resolve()
        })

        dialog.show()
      })
    })

    it('should close dialog when a click occurred on data-cx-dismiss="dialog" inside dialog', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<dialog class="dialog">',
          '  <div class="dialog-header">',
          '    <button type="button" data-cx-dismiss="dialog"></button>',
          '  </div>',
          '</dialog>'
        ].join('')

        const dialogEl = fixtureEl.querySelector('.dialog')
        const btnClose = fixtureEl.querySelector('[data-cx-dismiss="dialog"]')
        const dialog = new Dialog(dialogEl)

        const spy = spyOn(dialog, 'hide').and.callThrough()

        dialogEl.addEventListener('shown.cx.dialog', () => {
          btnClose.click()
        })

        dialogEl.addEventListener('hidden.cx.dialog', () => {
          expect(spy).toHaveBeenCalled()
          resolve()
        })

        dialog.show()
      })
    })
  })

  describe('hide', () => {
    it('should hide a dialog', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl)

        dialogEl.addEventListener('shown.cx.dialog', () => {
          dialog.hide()
        })

        dialogEl.addEventListener('hide.cx.dialog', event => {
          expect(event).toBeDefined()
        })

        dialogEl.addEventListener('hidden.cx.dialog', () => {
          expect(dialogEl.open).toBeFalse()
          expect(document.body.classList.contains('dialog-open')).toBeFalse()
          resolve()
        })

        dialog.show()
      })
    })

    it('should do nothing if the dialog is not shown', () => {
      fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

      const dialogEl = fixtureEl.querySelector('.dialog')
      const dialog = new Dialog(dialogEl)

      dialog.hide()

      expect().nothing()
    })

    it('should do nothing if the dialog is transitioning', () => {
      fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

      const dialogEl = fixtureEl.querySelector('.dialog')
      const dialog = new Dialog(dialogEl)

      dialogEl.showModal()
      dialog._isTransitioning = true
      dialog.hide()

      expect().nothing()
    })

    it('should not hide a dialog if hide is prevented', () => {
      return new Promise((resolve, reject) => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl)

        dialogEl.addEventListener('shown.cx.dialog', () => {
          dialog.hide()
        })

        const hideCallback = () => {
          setTimeout(() => {
            expect(dialogEl.open).toBeTrue()
            resolve()
          }, 10)
        }

        dialogEl.addEventListener('hide.cx.dialog', event => {
          event.preventDefault()
          hideCallback()
        })

        dialogEl.addEventListener('hidden.cx.dialog', () => {
          reject(new Error('should not trigger hidden'))
        })

        dialog.show()
      })
    })

    it('should close dialog when backdrop is clicked', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl)

        const spy = spyOn(dialog, 'hide').and.callThrough()

        dialogEl.addEventListener('shown.cx.dialog', () => {
          // Click directly on the dialog element (backdrop area)
          const clickEvent = createEvent('click')
          Object.defineProperty(clickEvent, 'target', { value: dialogEl })
          dialogEl.dispatchEvent(clickEvent)
        })

        dialogEl.addEventListener('hidden.cx.dialog', () => {
          expect(spy).toHaveBeenCalled()
          resolve()
        })

        dialog.show()
      })
    })

    it('should not close dialog when clicking inside dialog content', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<dialog class="dialog">',
          '  <div class="dialog-body">Content</div>',
          '</dialog>'
        ].join('')

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialogBody = fixtureEl.querySelector('.dialog-body')
        const dialog = new Dialog(dialogEl)

        const spy = spyOn(dialog, 'hide')

        dialogEl.addEventListener('shown.cx.dialog', () => {
          // Click on inner content - should not close
          const clickEvent = createEvent('click', { bubbles: true })
          dialogBody.dispatchEvent(clickEvent)

          setTimeout(() => {
            expect(spy).not.toHaveBeenCalled()
            resolve()
          }, 10)
        })

        dialog.show()
      })
    })
  })

  describe('backdrop static', () => {
    it('should not close dialog when backdrop is static and backdrop is clicked', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl, {
          backdrop: 'static'
        })

        const spy = spyOn(dialog, 'hide')

        dialogEl.addEventListener('shown.cx.dialog', () => {
          const clickEvent = createEvent('click')
          Object.defineProperty(clickEvent, 'target', { value: dialogEl })
          dialogEl.dispatchEvent(clickEvent)

          setTimeout(() => {
            expect(spy).not.toHaveBeenCalled()
            expect(dialogEl.open).toBeTrue()
            resolve()
          }, 10)
        })

        dialog.show()
      })
    })

    it('should add dialog-static class when backdrop is static and clicked', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl, {
          backdrop: 'static'
        })

        dialogEl.addEventListener('shown.cx.dialog', () => {
          const clickEvent = createEvent('click')
          Object.defineProperty(clickEvent, 'target', { value: dialogEl })
          dialogEl.dispatchEvent(clickEvent)

          expect(dialogEl.classList.contains('dialog-static')).toBeTrue()

          setTimeout(() => {
            expect(dialogEl.classList.contains('dialog-static')).toBeFalse()
            resolve()
          }, 300)
        })

        dialog.show()
      })
    })

    it('should fire hidePrevented.cx.dialog event when static backdrop is clicked', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl, {
          backdrop: 'static'
        })

        dialogEl.addEventListener('shown.cx.dialog', () => {
          const clickEvent = createEvent('click')
          Object.defineProperty(clickEvent, 'target', { value: dialogEl })
          dialogEl.dispatchEvent(clickEvent)
        })

        dialogEl.addEventListener('hidePrevented.cx.dialog', () => {
          resolve()
        })

        dialog.show()
      })
    })
  })

  describe('non-modal dialogs', () => {
    it('should open a non-modal dialog with show() when modal = false', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl, {
          modal: false
        })

        dialogEl.addEventListener('shown.cx.dialog', () => {
          expect(dialogEl.open).toBeTrue()
          expect(dialogEl.classList.contains('nonmodal')).toBeTrue()
          // Non-modal dialogs should not add dialog-open to body
          expect(document.body.classList.contains('dialog-open')).toBeFalse()
          resolve()
        })

        dialog.show()
      })
    })

    it('should remove dialog-nonmodal class on hide', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl, {
          modal: false
        })

        dialogEl.addEventListener('shown.cx.dialog', () => {
          expect(dialogEl.classList.contains('nonmodal')).toBeTrue()
          dialog.hide()
        })

        dialogEl.addEventListener('hidden.cx.dialog', () => {
          expect(dialogEl.classList.contains('nonmodal')).toBeFalse()
          resolve()
        })

        dialog.show()
      })
    })

    it('should not respond to backdrop clicks for non-modal dialogs', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl, {
          modal: false
        })

        const spy = spyOn(dialog, 'hide')

        dialogEl.addEventListener('shown.cx.dialog', () => {
          const clickEvent = createEvent('click')
          Object.defineProperty(clickEvent, 'target', { value: dialogEl })
          dialogEl.dispatchEvent(clickEvent)

          setTimeout(() => {
            expect(spy).not.toHaveBeenCalled()
            resolve()
          }, 10)
        })

        dialog.show()
      })
    })

    it('should close non-modal dialog with escape key when keyboard = true', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl, {
          modal: false,
          keyboard: true
        })

        dialogEl.addEventListener('shown.cx.dialog', () => {
          const keydownEvent = createEvent('keydown')
          keydownEvent.key = 'Escape'
          dialogEl.dispatchEvent(keydownEvent)
        })

        dialogEl.addEventListener('hidden.cx.dialog', () => {
          resolve()
        })

        dialog.show()
      })
    })

    it('should not close non-modal dialog with escape key when keyboard = false', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl, {
          modal: false,
          keyboard: false
        })

        const spy = spyOn(dialog, 'hide')

        dialogEl.addEventListener('shown.cx.dialog', () => {
          const keydownEvent = createEvent('keydown')
          keydownEvent.key = 'Escape'
          dialogEl.dispatchEvent(keydownEvent)

          setTimeout(() => {
            expect(spy).not.toHaveBeenCalled()
            resolve()
          }, 10)
        })

        dialog.show()
      })
    })

    it('should use data-cx-modal="false" to create non-modal dialog', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<button data-cx-toggle="dialog" data-cx-target="#exampleDialog" data-cx-modal="false"></button>',
          '<dialog id="exampleDialog" class="dialog"></dialog>'
        ].join('')

        const dialogEl = fixtureEl.querySelector('.dialog')
        const trigger = fixtureEl.querySelector('[data-cx-toggle="dialog"]')

        dialogEl.addEventListener('shown.cx.dialog', () => {
          const dialog = Dialog.getInstance(dialogEl)
          expect(dialog._config.modal).toBeFalse()
          expect(dialogEl.classList.contains('nonmodal')).toBeTrue()
          resolve()
        })

        trigger.click()
      })
    })
  })

  describe('handleUpdate', () => {
    it('should exist for API consistency', () => {
      fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

      const dialogEl = fixtureEl.querySelector('.dialog')
      const dialog = new Dialog(dialogEl)

      expect(typeof dialog.handleUpdate).toEqual('function')
      // Should not throw
      dialog.handleUpdate()
    })
  })

  describe('keyboard', () => {
    it('should close dialog when escape key is pressed', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl)

        dialogEl.addEventListener('shown.cx.dialog', () => {
          const cancelEvent = createEvent('cancel')
          dialogEl.dispatchEvent(cancelEvent)
        })

        dialogEl.addEventListener('hidden.cx.dialog', () => {
          resolve()
        })

        dialog.show()
      })
    })

    it('should fire cancel.cx.dialog event when escape is pressed', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl)

        dialogEl.addEventListener('shown.cx.dialog', () => {
          const cancelEvent = createEvent('cancel')
          dialogEl.dispatchEvent(cancelEvent)
        })

        dialogEl.addEventListener('cancel.cx.dialog', () => {
          resolve()
        })

        dialog.show()
      })
    })

    it('should not close dialog when escape key is pressed with keyboard = false', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl, {
          keyboard: false
        })

        const spy = spyOn(dialog, 'hide')

        dialogEl.addEventListener('shown.cx.dialog', () => {
          const cancelEvent = createEvent('cancel')
          dialogEl.dispatchEvent(cancelEvent)

          setTimeout(() => {
            expect(spy).not.toHaveBeenCalled()
            expect(dialogEl.open).toBeTrue()
            resolve()
          }, 10)
        })

        dialog.show()
      })
    })

    it('should show static backdrop animation when escape pressed and keyboard = false', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl, {
          keyboard: false
        })

        const spy = spyOn(dialog, '_triggerBackdropTransition').and.callThrough()

        dialogEl.addEventListener('shown.cx.dialog', () => {
          const cancelEvent = createEvent('cancel')
          dialogEl.dispatchEvent(cancelEvent)

          setTimeout(() => {
            expect(spy).toHaveBeenCalled()
            resolve()
          }, 10)
        })

        dialog.show()
      })
    })
  })

  describe('dispose', () => {
    it('should dispose a dialog', () => {
      fixtureEl.innerHTML = '<dialog class="dialog" id="exampleDialog"></dialog>'

      const dialogEl = fixtureEl.querySelector('.dialog')
      const dialog = new Dialog(dialogEl)

      expect(Dialog.getInstance(dialogEl)).toEqual(dialog)

      const spyOff = spyOn(EventHandler, 'off')

      dialog.dispose()

      expect(Dialog.getInstance(dialogEl)).toBeNull()
      expect(spyOff).toHaveBeenCalled()
    })
  })

  describe('data-api', () => {
    it('should toggle dialog', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<button type="button" data-cx-toggle="dialog" data-cx-target="#exampleDialog"></button>',
          '<dialog id="exampleDialog" class="dialog"></dialog>'
        ].join('')

        const dialogEl = fixtureEl.querySelector('.dialog')
        const trigger = fixtureEl.querySelector('[data-cx-toggle="dialog"]')

        dialogEl.addEventListener('shown.cx.dialog', () => {
          expect(dialogEl.open).toBeTrue()
          setTimeout(() => trigger.click(), 10)
        })

        dialogEl.addEventListener('hidden.cx.dialog', () => {
          expect(dialogEl.open).toBeFalse()
          resolve()
        })

        trigger.click()
      })
    })

    it('should not recreate a new dialog', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<button type="button" data-cx-toggle="dialog" data-cx-target="#exampleDialog"></button>',
          '<dialog id="exampleDialog" class="dialog"></dialog>'
        ].join('')

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl)
        const trigger = fixtureEl.querySelector('[data-cx-toggle="dialog"]')

        const spy = spyOn(dialog, 'toggle').and.callThrough()

        dialogEl.addEventListener('shown.cx.dialog', () => {
          expect(spy).toHaveBeenCalled()
          resolve()
        })

        trigger.click()
      })
    })

    it('should prevent default when the trigger is <a> or <area>', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<a data-cx-toggle="dialog" href="#" data-cx-target="#exampleDialog"></a>',
          '<dialog id="exampleDialog" class="dialog"></dialog>'
        ].join('')

        const dialogEl = fixtureEl.querySelector('.dialog')
        const trigger = fixtureEl.querySelector('[data-cx-toggle="dialog"]')

        const spy = spyOn(Event.prototype, 'preventDefault').and.callThrough()

        dialogEl.addEventListener('shown.cx.dialog', () => {
          expect(dialogEl.open).toBeTrue()
          expect(spy).toHaveBeenCalled()
          resolve()
        })

        trigger.click()
      })
    })

    it('should focus the trigger on hide', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<button data-cx-toggle="dialog" data-cx-target="#exampleDialog"></button>',
          '<dialog id="exampleDialog" class="dialog"></dialog>'
        ].join('')

        const dialogEl = fixtureEl.querySelector('.dialog')
        const trigger = fixtureEl.querySelector('[data-cx-toggle="dialog"]')

        const spy = spyOn(trigger, 'focus')

        dialogEl.addEventListener('shown.cx.dialog', () => {
          const dialog = Dialog.getInstance(dialogEl)
          dialog.hide()
        })

        const hideListener = () => {
          setTimeout(() => {
            expect(spy).toHaveBeenCalled()
            resolve()
          }, 20)
        }

        dialogEl.addEventListener('hidden.cx.dialog', () => {
          hideListener()
        })

        trigger.click()
      })
    })

    it('should use data attributes for config', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<button data-cx-toggle="dialog" data-cx-target="#exampleDialog" data-cx-backdrop="static"></button>',
          '<dialog id="exampleDialog" class="dialog"></dialog>'
        ].join('')

        const dialogEl = fixtureEl.querySelector('.dialog')
        const trigger = fixtureEl.querySelector('[data-cx-toggle="dialog"]')

        dialogEl.addEventListener('shown.cx.dialog', () => {
          const dialog = Dialog.getInstance(dialogEl)
          expect(dialog._config.backdrop).toEqual('static')
          resolve()
        })

        trigger.click()
      })
    })
  })

  describe('dialog swapping', () => {
    it('should swap dialogs when trigger is inside an open dialog', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<button data-cx-toggle="dialog" data-cx-target="#dialog1">Open first</button>',
          '<dialog id="dialog1" class="dialog">',
          '  <button data-cx-toggle="dialog" data-cx-target="#dialog2">Go to second</button>',
          '</dialog>',
          '<dialog id="dialog2" class="dialog"></dialog>'
        ].join('')

        const dialog1El = fixtureEl.querySelector('#dialog1')
        const dialog2El = fixtureEl.querySelector('#dialog2')
        const firstTrigger = fixtureEl.querySelector('[data-cx-target="#dialog1"]')
        const swapTrigger = dialog1El.querySelector('[data-cx-target="#dialog2"]')

        dialog1El.addEventListener('shown.cx.dialog', () => {
          // Now click the swap trigger inside dialog1
          swapTrigger.click()
        })

        dialog2El.addEventListener('shown.cx.dialog', () => {
          expect(dialog2El.open).toBeTrue()
        })

        dialog1El.addEventListener('hidden.cx.dialog', () => {
          expect(dialog1El.open).toBeFalse()
          expect(dialog2El.open).toBeTrue()
          resolve()
        })

        firstTrigger.click()
      })
    })
  })

  describe('getInstance', () => {
    it('should return dialog instance', () => {
      fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

      const dialogEl = fixtureEl.querySelector('dialog')
      const dialog = new Dialog(dialogEl)

      expect(Dialog.getInstance(dialogEl)).toEqual(dialog)
      expect(Dialog.getInstance(dialogEl)).toBeInstanceOf(Dialog)
    })

    it('should return null when there is no dialog instance', () => {
      fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

      const dialogEl = fixtureEl.querySelector('dialog')

      expect(Dialog.getInstance(dialogEl)).toBeNull()
    })
  })

  describe('getOrCreateInstance', () => {
    it('should return dialog instance', () => {
      fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

      const dialogEl = fixtureEl.querySelector('dialog')
      const dialog = new Dialog(dialogEl)

      expect(Dialog.getOrCreateInstance(dialogEl)).toEqual(dialog)
      expect(Dialog.getInstance(dialogEl)).toEqual(Dialog.getOrCreateInstance(dialogEl, {}))
      expect(Dialog.getOrCreateInstance(dialogEl)).toBeInstanceOf(Dialog)
    })

    it('should return new instance when there is no dialog instance', () => {
      fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

      const dialogEl = fixtureEl.querySelector('dialog')

      expect(Dialog.getInstance(dialogEl)).toBeNull()
      expect(Dialog.getOrCreateInstance(dialogEl)).toBeInstanceOf(Dialog)
    })

    it('should return new instance when there is no dialog instance with given configuration', () => {
      fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

      const dialogEl = fixtureEl.querySelector('dialog')

      expect(Dialog.getInstance(dialogEl)).toBeNull()
      const dialog = Dialog.getOrCreateInstance(dialogEl, {
        backdrop: 'static'
      })
      expect(dialog).toBeInstanceOf(Dialog)
      expect(dialog._config.backdrop).toEqual('static')
    })

    it('should return the instance when exists without given configuration', () => {
      fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

      const dialogEl = fixtureEl.querySelector('dialog')
      const dialog = new Dialog(dialogEl, {
        backdrop: 'static'
      })
      expect(Dialog.getInstance(dialogEl)).toEqual(dialog)

      const dialog2 = Dialog.getOrCreateInstance(dialogEl, {
        backdrop: true
      })
      expect(dialog).toBeInstanceOf(Dialog)
      expect(dialog2).toEqual(dialog)

      expect(dialog2._config.backdrop).toEqual('static')
    })
  })

  describe('child component cleanup', () => {
    it('should hide tooltip instances inside dialog when dialog closes', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<dialog class="dialog">',
          '  <button data-cx-toggle="tooltip" title="tip">Hover</button>',
          '</dialog>'
        ].join('')

        const dialogEl = fixtureEl.querySelector('.dialog')
        const tooltipTrigger = fixtureEl.querySelector('[data-cx-toggle="tooltip"]')
        const dialog = new Dialog(dialogEl)

        const fakeTooltip = { hide: jasmine.createSpy('tooltipHide') }
        Data.set(tooltipTrigger, 'cx.tooltip', fakeTooltip)

        dialogEl.addEventListener('shown.cx.dialog', () => {
          dialog.hide()
        })

        dialogEl.addEventListener('hidden.cx.dialog', () => {
          expect(fakeTooltip.hide).toHaveBeenCalled()
          Data.remove(tooltipTrigger, 'cx.tooltip')
          resolve()
        })

        dialog.show()
      })
    })

    it('should hide popover instances inside dialog when dialog closes', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<dialog class="dialog">',
          '  <button data-cx-toggle="popover" title="pop">Click</button>',
          '</dialog>'
        ].join('')

        const dialogEl = fixtureEl.querySelector('.dialog')
        const popoverTrigger = fixtureEl.querySelector('[data-cx-toggle="popover"]')
        const dialog = new Dialog(dialogEl)

        const fakePopover = { hide: jasmine.createSpy('popoverHide') }
        Data.set(popoverTrigger, 'cx.popover', fakePopover)

        dialogEl.addEventListener('shown.cx.dialog', () => {
          dialog.hide()
        })

        dialogEl.addEventListener('hidden.cx.dialog', () => {
          expect(fakePopover.hide).toHaveBeenCalled()
          Data.remove(popoverTrigger, 'cx.popover')
          resolve()
        })

        dialog.show()
      })
    })

    it('should hide toast instances inside dialog when dialog closes', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<dialog class="dialog">',
          '  <div class="toast show">Toast content</div>',
          '</dialog>'
        ].join('')

        const dialogEl = fixtureEl.querySelector('.dialog')
        const toastEl = fixtureEl.querySelector('.toast')
        const dialog = new Dialog(dialogEl)

        const fakeToast = { hide: jasmine.createSpy('toastHide') }
        Data.set(toastEl, 'cx.toast', fakeToast)

        dialogEl.addEventListener('shown.cx.dialog', () => {
          dialog.hide()
        })

        dialogEl.addEventListener('hidden.cx.dialog', () => {
          expect(fakeToast.hide).toHaveBeenCalled()
          Data.remove(toastEl, 'cx.toast')
          resolve()
        })

        dialog.show()
      })
    })
  })

  describe('stacked modals', () => {
    it('should keep dialog-open on body when closing one of two open modal dialogs', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<dialog id="dialog1" class="dialog"></dialog>',
          '<dialog id="dialog2" class="dialog"></dialog>'
        ].join('')

        const dialog1El = fixtureEl.querySelector('#dialog1')
        const dialog2El = fixtureEl.querySelector('#dialog2')
        const dialog1 = new Dialog(dialog1El)
        const dialog2 = new Dialog(dialog2El)

        dialog1El.addEventListener('shown.cx.dialog', () => {
          dialog2.show()
        })

        dialog2El.addEventListener('shown.cx.dialog', () => {
          expect(document.body.classList.contains('dialog-open')).toBeTrue()
          dialog1.hide()
        })

        dialog1El.addEventListener('hidden.cx.dialog', () => {
          expect(dialog2El.open).toBeTrue()
          expect(document.body.classList.contains('dialog-open')).toBeTrue()
          dialog2.hide()
        })

        dialog2El.addEventListener('hidden.cx.dialog', () => {
          expect(document.body.classList.contains('dialog-open')).toBeFalse()
          resolve()
        })

        dialog1.show()
      })
    })
  })

  describe('dialog-instant', () => {
    it('should show and fire shown event when dialog-instant class is present', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog dialog-instant"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl)

        dialogEl.addEventListener('shown.cx.dialog', () => {
          expect(dialog._isTransitioning).toBeFalse()
          expect(dialogEl.open).toBeTrue()
          resolve()
        })

        dialog.show()
      })
    })

    it('should not report as animated when dialog-instant is present', () => {
      fixtureEl.innerHTML = '<dialog class="dialog dialog-instant"></dialog>'

      const dialogEl = fixtureEl.querySelector('.dialog')
      const dialog = new Dialog(dialogEl)

      expect(dialog._isAnimated()).toBeFalse()
    })

    it('should report as animated when dialog-instant is not present', () => {
      fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

      const dialogEl = fixtureEl.querySelector('.dialog')
      const dialog = new Dialog(dialogEl)

      expect(dialog._isAnimated()).toBeTrue()
    })
  })

  describe('hiding class', () => {
    it('should add hiding class during hide and remove after hidden', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl)

        dialogEl.addEventListener('shown.cx.dialog', () => {
          dialog.hide()
          // hiding class should be present during the transition
          expect(dialogEl.classList.contains('hiding')).toBeTrue()
        })

        dialogEl.addEventListener('hidden.cx.dialog', () => {
          expect(dialogEl.classList.contains('hiding')).toBeFalse()
          resolve()
        })

        dialog.show()
      })
    })
  })

  describe('hidePrevented', () => {
    it('should not add dialog-static class when hidePrevented is default prevented', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl, {
          backdrop: 'static'
        })

        dialogEl.addEventListener('shown.cx.dialog', () => {
          dialogEl.addEventListener('hidePrevented.cx.dialog', event => {
            event.preventDefault()

            setTimeout(() => {
              expect(dialogEl.classList.contains('dialog-static')).toBeFalse()
              resolve()
            }, 10)
          })

          const clickEvent = createEvent('click')
          Object.defineProperty(clickEvent, 'target', { value: dialogEl })
          dialogEl.dispatchEvent(clickEvent)
        })

        dialog.show()
      })
    })
  })

  describe('non-modal keyboard', () => {
    it('should fire cancel.cx.dialog event on Escape for non-modal dialog', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl, {
          modal: false,
          keyboard: true
        })

        dialogEl.addEventListener('shown.cx.dialog', () => {
          const keydownEvent = createEvent('keydown')
          keydownEvent.key = 'Escape'
          dialogEl.dispatchEvent(keydownEvent)
        })

        dialogEl.addEventListener('cancel.cx.dialog', () => {
          resolve()
        })

        dialog.show()
      })
    })

    it('should not close and not trigger backdrop transition for non-modal with keyboard = false on Escape', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="dialog"></dialog>'

        const dialogEl = fixtureEl.querySelector('.dialog')
        const dialog = new Dialog(dialogEl, {
          modal: false,
          keyboard: false
        })

        const hideSpy = spyOn(dialog, 'hide')
        const backdropSpy = spyOn(dialog, '_triggerBackdropTransition')

        dialogEl.addEventListener('shown.cx.dialog', () => {
          const keydownEvent = createEvent('keydown')
          keydownEvent.key = 'Escape'
          dialogEl.dispatchEvent(keydownEvent)

          setTimeout(() => {
            expect(hideSpy).not.toHaveBeenCalled()
            expect(backdropSpy).not.toHaveBeenCalled()
            resolve()
          }, 10)
        })

        dialog.show()
      })
    })
  })
})
