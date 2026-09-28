import Dialog from '../../src/dialog.js'
import { clearBodyAndDocument, clearFixture, getFixture } from '../helpers/fixture.js'

// Modals use the Dialog plugin with <dialog class="modal dialog"> markup.
// Structure: .modal-header (with optional .close-button) + .modal-body + .modal-footer.

describe('Modal (Dialog plugin)', () => {
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
    it('should show with full header/body/footer structure and add dialog-open to body', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<dialog class="modal dialog" aria-labelledby="modalLabel">',
          '  <div class="modal-header">',
          '    <h1 class="modal-title" id="modalLabel">Modal title</h1>',
          '    <button type="button" class="close-button" data-cx-dismiss="dialog" aria-label="Close"></button>',
          '  </div>',
          '  <div class="modal-body"><p>Modal body text</p></div>',
          '  <div class="modal-footer">',
          '    <button type="button" class="button secondary" data-cx-dismiss="dialog">Close</button>',
          '    <button type="button" class="button primary">Save changes</button>',
          '  </div>',
          '</dialog>'
        ].join('')

        const modalEl = fixtureEl.querySelector('.modal')
        const modal = new Dialog(modalEl)

        modalEl.addEventListener('shown.cx.dialog', () => {
          expect(modalEl.open).toBeTrue()
          expect(document.body.classList.contains('dialog-open')).toBeTrue()
          resolve()
        })

        modal.show()
      })
    })

    it('should set tabindex="-1" on the dialog when no autofocus element is present', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<dialog class="modal dialog">',
          '  <div class="modal-body"><p>Body</p></div>',
          '</dialog>'
        ].join('')

        const modalEl = fixtureEl.querySelector('.modal')
        const modal = new Dialog(modalEl)

        modalEl.addEventListener('shown.cx.dialog', () => {
          expect(modalEl.getAttribute('tabindex')).toBe('-1')
          resolve()
        })

        modal.show()
      })
    })

    it('should not set tabindex="-1" on the dialog when an autofocus element is present', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<dialog class="modal dialog">',
          '  <div class="modal-body">',
          '    <input type="text" autofocus>',
          '  </div>',
          '</dialog>'
        ].join('')

        const modalEl = fixtureEl.querySelector('.modal')
        const modal = new Dialog(modalEl)

        modalEl.addEventListener('shown.cx.dialog', () => {
          expect(modalEl.hasAttribute('tabindex')).toBeFalse()
          resolve()
        })

        modal.show()
      })
    })
  })

  describe('hide', () => {
    it('should hide and remove dialog-open class from body', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<dialog class="modal dialog">',
          '  <div class="modal-body"><p>Body</p></div>',
          '</dialog>'
        ].join('')

        const modalEl = fixtureEl.querySelector('.modal')
        const modal = new Dialog(modalEl)

        modalEl.addEventListener('shown.cx.dialog', () => {
          modal.hide()
        })

        modalEl.addEventListener('hidden.cx.dialog', () => {
          expect(modalEl.open).toBeFalse()
          expect(document.body.classList.contains('dialog-open')).toBeFalse()
          resolve()
        })

        modal.show()
      })
    })
  })

  describe('dismiss', () => {
    it('should close when the header close button is clicked', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<dialog class="modal dialog">',
          '  <div class="modal-header">',
          '    <h1 class="modal-title">Modal title</h1>',
          '    <button type="button" class="close-button" data-cx-dismiss="dialog" aria-label="Close"></button>',
          '  </div>',
          '  <div class="modal-body"><p>Body</p></div>',
          '</dialog>'
        ].join('')

        const modalEl = fixtureEl.querySelector('.modal')
        const modal = new Dialog(modalEl)

        modalEl.addEventListener('shown.cx.dialog', () => {
          modalEl.querySelector('.close-button[data-cx-dismiss="dialog"]').click()
        })

        modalEl.addEventListener('hidden.cx.dialog', () => {
          expect(modalEl.open).toBeFalse()
          resolve()
        })

        modal.show()
      })
    })

    it('should close when a footer button with data-cx-dismiss="dialog" is clicked', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<dialog class="modal dialog">',
          '  <div class="modal-body"><p>Body</p></div>',
          '  <div class="modal-footer">',
          '    <button type="button" class="button secondary" data-cx-dismiss="dialog">Close</button>',
          '    <button type="button" class="button primary">Save</button>',
          '  </div>',
          '</dialog>'
        ].join('')

        const modalEl = fixtureEl.querySelector('.modal')
        const modal = new Dialog(modalEl)

        modalEl.addEventListener('shown.cx.dialog', () => {
          modalEl.querySelector('[data-cx-dismiss="dialog"]').click()
        })

        modalEl.addEventListener('hidden.cx.dialog', () => {
          expect(modalEl.open).toBeFalse()
          resolve()
        })

        modal.show()
      })
    })
  })

  describe('data-api', () => {
    it('should open modal via data-cx-toggle="dialog" trigger', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<button type="button" data-cx-toggle="dialog" data-cx-target="#myModal">Open modal</button>',
          '<dialog class="modal dialog" id="myModal">',
          '  <div class="modal-header">',
          '    <h1 class="modal-title">Modal</h1>',
          '    <button type="button" class="close-button" data-cx-dismiss="dialog" aria-label="Close"></button>',
          '  </div>',
          '  <div class="modal-body"><p>Body</p></div>',
          '</dialog>'
        ].join('')

        const triggerEl = fixtureEl.querySelector('[data-cx-toggle="dialog"]')
        const modalEl = fixtureEl.querySelector('.modal')

        modalEl.addEventListener('shown.cx.dialog', () => {
          expect(modalEl.open).toBeTrue()
          resolve()
        })

        triggerEl.click()
      })
    })

    it('should return focus to the trigger when modal closes', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<button type="button" id="trigger" data-cx-toggle="dialog" data-cx-target="#focusModal">Open</button>',
          '<dialog class="modal dialog" id="focusModal">',
          '  <div class="modal-footer">',
          '    <button type="button" class="button secondary" data-cx-dismiss="dialog">Close</button>',
          '  </div>',
          '</dialog>'
        ].join('')

        const triggerEl = fixtureEl.querySelector('#trigger')
        const modalEl = fixtureEl.querySelector('.modal')

        const spy = spyOn(triggerEl, 'focus')

        modalEl.addEventListener('shown.cx.dialog', () => {
          modalEl.querySelector('[data-cx-dismiss="dialog"]').click()
        })

        modalEl.addEventListener('hidden.cx.dialog', () => {
          setTimeout(() => {
            expect(spy).toHaveBeenCalled()
            resolve()
          }, 20)
        })

        triggerEl.click()
      })
    })
  })

  describe('stacked modals', () => {
    it('should keep dialog-open on body when closing one of two open modals', () => {
      return new Promise(resolve => {
        fixtureEl.innerHTML = [
          '<dialog id="modal1" class="modal dialog"><div class="modal-body"><p>First</p></div></dialog>',
          '<dialog id="modal2" class="modal dialog"><div class="modal-body"><p>Second</p></div></dialog>'
        ].join('')

        const modal1El = fixtureEl.querySelector('#modal1')
        const modal2El = fixtureEl.querySelector('#modal2')
        const modal1 = new Dialog(modal1El)
        const modal2 = new Dialog(modal2El)

        modal1El.addEventListener('shown.cx.dialog', () => {
          modal2.show()
        })

        modal2El.addEventListener('shown.cx.dialog', () => {
          expect(document.body.classList.contains('dialog-open')).toBeTrue()
          modal1.hide()
        })

        modal1El.addEventListener('hidden.cx.dialog', () => {
          expect(modal2El.open).toBeTrue()
          expect(document.body.classList.contains('dialog-open')).toBeTrue()
          modal2.hide()
        })

        modal2El.addEventListener('hidden.cx.dialog', () => {
          expect(document.body.classList.contains('dialog-open')).toBeFalse()
          resolve()
        })

        modal1.show()
      })
    })
  })
})
