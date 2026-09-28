import Dialog from '../../src/dialog.js'
import { clearBodyAndDocument, clearFixture, createEvent, getFixture } from '../helpers/fixture.js'

// Alerts use the Dialog plugin with <dialog class="alert dialog" role="alertdialog"> markup.
// Structure: optional .alert-icon + .alert-body (.alert-title, optional .alert-code) + .alert-footer.
// Typical config enforces explicit acknowledgement: backdrop: 'static', keyboard: false.

describe('Alert (Dialog plugin)', () => {
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

  describe('show', () => {
    it('should show with full alert structure and add dialog-open to body', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<dialog class="alert dialog" role="alertdialog" aria-labelledby="alertLabel" aria-describedby="alertDesc">',
          '  <div class="alert-body">',
          '    <h2 class="alert-title" id="alertLabel">Confirm action</h2>',
          '    <p id="alertDesc">Are you sure you want to proceed?</p>',
          '  </div>',
          '  <div class="alert-footer">',
          '    <button type="button" class="button danger">Confirm</button>',
          '    <button type="button" class="button default" data-cx-dismiss="dialog">Cancel</button>',
          '  </div>',
          '</dialog>'
        ].join('')

        const alertEl = fixtureEl.querySelector('.alert')
        const alert = new Dialog(alertEl)

        alertEl.addEventListener('shown.cx.dialog', () => {
          expect(alertEl.open).toBeTrue()
          expect(document.body.classList.contains('dialog-open')).toBeTrue()
          resolve()
        })

        alert.show()
      })
    })
  })

  describe('hide', () => {
    it('should hide and remove dialog-open class from body', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="alert dialog" role="alertdialog"></dialog>'

        const alertEl = fixtureEl.querySelector('.alert')
        const alert = new Dialog(alertEl)

        alertEl.addEventListener('shown.cx.dialog', () => {
          alert.hide()
        })

        alertEl.addEventListener('hidden.cx.dialog', () => {
          expect(alertEl.open).toBeFalse()
          expect(document.body.classList.contains('dialog-open')).toBeFalse()
          resolve()
        })

        alert.show()
      })
    })
  })

  describe('dismiss', () => {
    it('should close when a footer button with data-cx-dismiss="dialog" is clicked', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<dialog class="alert dialog" role="alertdialog">',
          '  <div class="alert-body"><p>Confirm?</p></div>',
          '  <div class="alert-footer">',
          '    <button type="button" class="button danger">Confirm</button>',
          '    <button type="button" class="button default" data-cx-dismiss="dialog">Cancel</button>',
          '  </div>',
          '</dialog>'
        ].join('')

        const alertEl = fixtureEl.querySelector('.alert')
        const alert = new Dialog(alertEl)

        alertEl.addEventListener('shown.cx.dialog', () => {
          alertEl.querySelector('[data-cx-dismiss="dialog"]').click()
        })

        alertEl.addEventListener('hidden.cx.dialog', () => {
          expect(alertEl.open).toBeFalse()
          resolve()
        })

        alert.show()
      })
    })

    it('should close when a close-button with data-cx-dismiss="dialog" is clicked', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<dialog class="alert dialog" role="alertdialog">',
          '  <button type="button" class="close-button" data-cx-dismiss="dialog" aria-label="Close"></button>',
          '  <div class="alert-body"><p>Alert content</p></div>',
          '</dialog>'
        ].join('')

        const alertEl = fixtureEl.querySelector('.alert')
        const alert = new Dialog(alertEl)

        alertEl.addEventListener('shown.cx.dialog', () => {
          alertEl.querySelector('.close-button').click()
        })

        alertEl.addEventListener('hidden.cx.dialog', () => {
          expect(alertEl.open).toBeFalse()
          resolve()
        })

        alert.show()
      })
    })
  })

  describe('static backdrop (typical alert config)', () => {
    it('should not close and should fire hidePrevented.cx.dialog when backdrop is clicked', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="alert dialog" role="alertdialog"></dialog>'

        const alertEl = fixtureEl.querySelector('.alert')
        const alert = new Dialog(alertEl, { backdrop: 'static' })

        alertEl.addEventListener('shown.cx.dialog', () => {
          alertEl.addEventListener('hidePrevented.cx.dialog', () => {
            setTimeout(() => {
              expect(alertEl.open).toBeTrue()
              resolve()
            }, 10)
          })

          const clickEvent = createEvent('click')
          Object.defineProperty(clickEvent, 'target', { value: alertEl })
          alertEl.dispatchEvent(clickEvent)
        })

        alert.show()
      })
    })
  })

  describe('keyboard: false (typical alert config)', () => {
    it('should not close and should fire hidePrevented.cx.dialog on escape', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = '<dialog class="alert dialog" role="alertdialog"></dialog>'

        const alertEl = fixtureEl.querySelector('.alert')
        const alert = new Dialog(alertEl, { keyboard: false })

        const hideSpy = spyOn(alert, 'hide')

        alertEl.addEventListener('shown.cx.dialog', () => {
          alertEl.addEventListener('hidePrevented.cx.dialog', () => {
            setTimeout(() => {
              expect(hideSpy).not.toHaveBeenCalled()
              expect(alertEl.open).toBeTrue()
              resolve()
            }, 10)
          })

          const cancelEvent = createEvent('cancel')
          alertEl.dispatchEvent(cancelEvent)
        })

        alert.show()
      })
    })
  })

  describe('with icon', () => {
    it('should show an alert with an alert-icon element', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<dialog class="alert dialog" role="alertdialog">',
          '  <div class="alert-icon" aria-hidden="true">⚠️</div>',
          '  <div class="alert-body">',
          '    <h2 class="alert-title">Warning</h2>',
          '    <p>This action cannot be undone.</p>',
          '  </div>',
          '  <div class="alert-footer">',
          '    <button type="button" class="button danger">Delete</button>',
          '    <button type="button" class="button default" data-cx-dismiss="dialog">Cancel</button>',
          '  </div>',
          '</dialog>'
        ].join('')

        const alertEl = fixtureEl.querySelector('.alert')
        const alert = new Dialog(alertEl)

        alertEl.addEventListener('shown.cx.dialog', () => {
          expect(alertEl.open).toBeTrue()
          expect(alertEl.querySelector('.alert-icon')).not.toBeNull()
          expect(alertEl.querySelector('.alert-body')).not.toBeNull()
          expect(alertEl.querySelector('.alert-footer')).not.toBeNull()
          resolve()
        })

        alert.show()
      })
    })
  })

  describe('with code', () => {
    it('should show an alert with an alert-code element', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<dialog class="alert dialog" role="alertdialog">',
          '  <div class="alert-body">',
          '    <h2 class="alert-title">Error</h2>',
          '    <div class="alert-code"><code>ERR_CONNECTION_REFUSED</code></div>',
          '  </div>',
          '  <div class="alert-footer">',
          '    <button type="button" class="button default" data-cx-dismiss="dialog">OK</button>',
          '  </div>',
          '</dialog>'
        ].join('')

        const alertEl = fixtureEl.querySelector('.alert')
        const alert = new Dialog(alertEl)

        alertEl.addEventListener('shown.cx.dialog', () => {
          expect(alertEl.open).toBeTrue()
          expect(alertEl.querySelector('.alert-code')).not.toBeNull()
          resolve()
        })

        alert.show()
      })
    })
  })

  describe('data-api', () => {
    it('should open alert and read backdrop/keyboard config from trigger data attributes', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<button type="button" data-cx-toggle="dialog" data-cx-target="#configAlert"',
          '  data-cx-backdrop="static" data-cx-keyboard="false">Open</button>',
          '<dialog class="alert dialog" id="configAlert" role="alertdialog">',
          '  <div class="alert-body"><p>Confirm?</p></div>',
          '  <div class="alert-footer">',
          '    <button type="button" class="button default" data-cx-dismiss="dialog">Cancel</button>',
          '  </div>',
          '</dialog>'
        ].join('')

        const triggerEl = fixtureEl.querySelector('[data-cx-toggle="dialog"]')
        const alertEl = fixtureEl.querySelector('.alert')

        alertEl.addEventListener('shown.cx.dialog', () => {
          expect(alertEl.open).toBeTrue()
          const instance = Dialog.getInstance(alertEl)
          expect(instance._config.backdrop).toEqual('static')
          expect(instance._config.keyboard).toBeFalse()
          resolve()
        })

        triggerEl.click()
      })
    })
  })
})
