/**
 * --------------------------------------------------------------------------
 * Chassis CSS dialog-base.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */

import BaseComponent from './base-component.js'
import Data from './dom/data.js'
import EventHandler from './dom/event-handler.js'
import SelectorEngine from './dom/selector-engine.js'
import { isVisible } from './util/index.js'

/**
 * Constants
 */

const CLASS_NAME_OPEN = 'dialog-open'

type DialogBaseConfig = {
  backdrop: boolean | string
  keyboard: boolean
}

/**
 * Class definition
 *
 * Shared base class for Dialog and Drawer components that use
 * the native <dialog> element. Provides common behavior for:
 * - Show/hide/toggle lifecycle with events
 * - Opening/closing via showModal()/show()/close()
 * - Escape key handling (modal and non-modal)
 * - Backdrop click handling
 * - Static backdrop transition ("bounce")
 * - Body scroll prevention
 * - Transition coordination
 * - Child component cleanup (tooltips, popovers, toasts)
 */

class DialogBase extends BaseComponent {
  protected declare _element: HTMLDialogElement
  protected declare _config: DialogBaseConfig
  protected declare _isTransitioning: boolean
  protected declare _openedAsModal: boolean
  protected declare _closeExpected: boolean
  protected declare _nativeCloseHandler: () => void

  constructor(element?: string | Element | null, config?: Partial<DialogBaseConfig> | null) {
    super(element, config)

    this._isTransitioning = false
    this._openedAsModal = false
    this._closeExpected = false
    this._nativeCloseHandler = () => this._onNativeClose()
    this._addDialogListeners()
  }

  // Getters — subclasses override NAME with their own component name.
  static override get NAME(): string {
    return 'dialogbase'
  }

  // Shared by Dialog/Drawer's top-level data-API click handlers: once `target`
  // (the dialog/drawer element) fires its next `hidden` event, refocus
  // `trigger` (the element that opened it) if it's still visible.
  static restoreFocusOnHide(target: Element, trigger: HTMLElement): void {
    EventHandler.one(target, this.eventName('hidden'), () => {
      if (isVisible(trigger)) {
        trigger.focus()
      }
    })
  }

  // Public — shared lifecycle methods

  override dispose(): void {
    // Close the native <dialog> and drop the body scroll-lock class if
    // dispose() is called directly on an open instance, bypassing hide()'s
    // _closeAndCleanup(). _closeAndCleanup() is safe to call on an
    // already-closed dialog — close() is a no-op in that case.
    if (this._element.open) {
      this._closeAndCleanup()
    }

    this._element.removeEventListener('close', this._nativeCloseHandler)
    super.dispose()
  }

  toggle(relatedTarget?: HTMLElement): void {
    return this._element.open ? this.hide() : this.show(relatedTarget)
  }

  show(relatedTarget?: HTMLElement): void {
    if (this._element.open || this._isTransitioning) {
      return
    }

    const showEvent = EventHandler.trigger(
      this._element,
      this.constructor.eventName('show'),
      { relatedTarget }
    )

    if (showEvent.defaultPrevented) {
      return
    }

    this._isTransitioning = true
    this._onBeforeShow()

    const { modal, preventBodyScroll } = this._getShowOptions()
    this._showElement({ modal, preventBodyScroll })

    this._queueCallback(() => {
      this._isTransitioning = false
      EventHandler.trigger(
        this._element,
        this.constructor.eventName('shown'),
        { relatedTarget }
      )
    }, this._element, this._isAnimated())
  }

  hide(): void {
    if (!this._element.open || this._isTransitioning) {
      return
    }

    const hideEvent = EventHandler.trigger(
      this._element,
      this.constructor.eventName('hide')
    )

    if (hideEvent.defaultPrevented) {
      return
    }

    this._isTransitioning = true
    this._hideElement()

    this._queueCallback(() => {
      // For subclasses that defer close() until the exit transition ends
      // (so the dialog stays in the top layer with its ::backdrop), close()
      // happens here instead of in _hideElement().
      if (this._element.open) {
        this._closeAndCleanup()
      }

      this._element.classList.remove('hiding')
      this._onAfterHide()
      this._isTransitioning = false
      EventHandler.trigger(
        this._element,
        this.constructor.eventName('hidden')
      )
    }, this._element, this._isAnimated())
  }

  // Protected — hooks for subclasses to override

  protected _getShowOptions(): { modal: boolean, preventBodyScroll: boolean } {
    return { modal: true, preventBodyScroll: true }
  }

  protected _onBeforeShow(): void {
    // No-op by default — Dialog overrides to add nonmodal class
  }

  protected _onAfterHide(): void {
    // No-op by default — Dialog overrides to remove nonmodal class
  }

  protected _isAnimated(): boolean {
    return !this._element.classList.contains(this._getInstantClassName())
  }

  protected _getInstantClassName(): string {
    return 'instant'
  }

  protected _getStaticClassName(): string {
    return 'dialog-static'
  }

  protected _onCancel(): void {
    // No-op by default — Dialog overrides to fire cancel event
  }

  // Protected — shared mechanics

  protected _showElement({ modal = true, preventBodyScroll = true }: { modal?: boolean, preventBodyScroll?: boolean } = {}): void {
    this._openedAsModal = modal

    if (modal) {
      this._element.showModal()
    } else {
      this._element.show()
    }

    if (preventBodyScroll) {
      document.body.classList.add(CLASS_NAME_OPEN)
    }

    // Move focus into the dialog. Browsers don't reliably re-process the
    // autofocus attribute on already-in-DOM elements when showModal() is
    // called, so we handle all three cases explicitly:
    //   [autofocus] descendant → focus it
    //   no autofocus           → focus the dialog itself (prevents the browser
    //                            from defaulting to the first focusable child,
    //                            usually the close button)
    const autofocusEl = this._element.querySelector<HTMLElement>('[autofocus]')
    if (autofocusEl) {
      autofocusEl.focus()
    } else {
      this._element.setAttribute('tabindex', '-1')
      this._element.focus()
    }
  }

  protected _hideElement(): void {
    this._hideChildComponents()

    // Add .hiding before close() so CSS exit transitions can play.
    // Without this, the navbar's `:not([open])` transition-kill rule
    // would prevent the slide-out animation.
    this._element.classList.add('hiding')

    // Subclasses can defer close() until after the exit transition by
    // returning true from _shouldDeferClose(). This is needed for the
    // native modal <dialog> centered case: close() removes the dialog
    // from the top layer immediately, which strips its auto-centering
    // and the ::backdrop, breaking the exit animation.
    if (!this._shouldDeferClose()) {
      this._closeAndCleanup()
    }
  }

  // Closes the native <dialog> and tears down body-scroll prevention.
  // Safe to call multiple times — close() is a no-op on a closed dialog.
  protected _closeAndCleanup(): void {
    // The native close event comes later, in a task of its own
    this._closeExpected = this._closeExpected || this._element.open
    this._element.close()
    this._openedAsModal = false

    // Only restore body scroll if no other modal dialogs are open
    if (!document.querySelector('dialog[open]:modal')) {
      document.body.classList.remove(CLASS_NAME_OPEN)
    }
  }

  // Keep the dialog in the top layer until the exit transition ends. Both the native
  // ::backdrop and (for subclasses whose positioning relies on it, e.g. Dialog's centering)
  // the browser's own top-layer placement disappear synchronously the moment close() is
  // called — closing immediately would cut those off while the rest of the element is still
  // visibly animating out. Only skipped when there's no transition to protect (`.instant`).
  protected _shouldDeferClose(): boolean {
    return this._isAnimated()
  }

  protected _triggerBackdropTransition(): void {
    const hidePreventedEvent = EventHandler.trigger(
      this._element,
      this.constructor.eventName('hidePrevented')
    )

    if (hidePreventedEvent.defaultPrevented) {
      return
    }

    const staticClass = this._getStaticClassName()
    this._element.classList.add(staticClass)
    this._queueCallback(() => {
      this._element.classList.remove(staticClass)
    }, this._element)
  }

  // Handles a dialog the browser closed by itself, when the cancel event could not be
  // prevented or `close()` was called on the element: hide() did not run, so the body would
  // keep its scroll lock and no event would tell that the dialog is closed
  protected _onNativeClose(): void {
    if (this._closeExpected) {
      this._closeExpected = false
      return
    }

    // hide() is waiting for its transition, and finishes the work when it ends
    if (this._isTransitioning && this._element.classList.contains('hiding')) {
      return
    }

    this._hideChildComponents()
    this._closeAndCleanup()
    this._onAfterHide()
    this._isTransitioning = false
    EventHandler.trigger(this._element, this.constructor.eventName('hidden'))
  }

  protected _handleEscape(): void {
    if (!this._config.keyboard) {
      // A non-modal dialog has no backdrop to bounce against
      if (this._openedAsModal) {
        this._triggerBackdropTransition()
      }

      return
    }

    this._onCancel()
    this.hide()
  }

  // Hide any tooltips, popovers, or toasts inside the dialog before closing.
  // These components append to the dialog (for top-layer rendering) and would
  // otherwise persist visibly after close().
  protected _hideChildComponents(): void {
    const selector = '[data-cx-toggle="tooltip"], [data-cx-toggle="popover"], [data-cx-toggle="menu"]'

    for (const el of SelectorEngine.find(selector, this._element)) {
      const instance = Data.getAny(el)
      if (instance && typeof instance.hide === 'function') {
        instance.hide()
      }
    }

    // Hide any visible toasts
    for (const el of SelectorEngine.find('.toast.show', this._element)) {
      const instance = Data.getAny(el)
      if (instance && typeof instance.hide === 'function') {
        instance.hide()
      }
    }
  }

  // Private

  protected _addDialogListeners(): void {
    const eventKey = this.constructor.EVENT_KEY

    // Handle Escape on the keydown, for modal and non-modal dialogs. A modal dialog would
    // also get a native cancel event, but a browser makes that event not cancelable when
    // Escape is pressed again without another interaction, and closes the dialog by itself.
    // Preventing the keydown keeps the browser from starting that close request.
    EventHandler.on(this._element, `keydown${eventKey}`, event => {
      if (event.key !== 'Escape' || event.defaultPrevented) {
        return
      }

      event.preventDefault()
      this._handleEscape()
    })

    // Handle the native cancel event of a modal dialog: a close request that did not come
    // through the keydown above (focus outside the dialog, the back gesture of Android)
    EventHandler.on(this._element, `cancel${eventKey}`, event => {
      event.preventDefault()
      this._handleEscape()
    })

    // `close` is the name of an event of other plugins (`close.cx.chip`), so EventHandler
    // does not take it for the native event
    this._element.addEventListener('close', this._nativeCloseHandler)

    // Handle backdrop clicks — only applies to modal dialogs
    EventHandler.on(this._element, `click${eventKey}`, event => {
      if (event.target !== this._element || !this._openedAsModal) {
        return
      }

      if (this._config.backdrop === 'static') {
        this._triggerBackdropTransition()
        return
      }

      this.hide()
    })
  }
}

export default DialogBase
export type { DialogBaseConfig }
