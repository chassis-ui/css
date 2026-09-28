// NOTICE!!! Initially embedded in our docs this JavaScript
// file contains elements that can help you create reproducible
// use cases in StackBlitz for instance.
// In a real project please adapt this content to your needs.
// ++++++++++++++++++++++++++++++++++++++++++

/*
 * JavaScript for Chassis's docs (https://chassis-ui.com/)
 * Copyright 2011-2025 The Chassis Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 * For details, see https://creativecommons.org/licenses/by/3.0/.
 */

import { Tooltip, Popover, Toast, Carousel, Dialog } from '@chassis-ui/css'

export default () => {
  // --------
  // Tooltips
  // --------
  // Instantiate all tooltips in a docs or StackBlitz
  document.querySelectorAll('[data-cx-toggle="tooltip"]')
    .forEach(tooltip => {
      new Tooltip(tooltip)
    })

  // --------
  // Popovers
  // --------
  // Instantiate all popovers in docs or StackBlitz
  document.querySelectorAll('[data-cx-toggle="popover"]')
    .forEach(popover => {
      new Popover(popover)
    })

  // -------------------------------
  // Toasts
  // -------------------------------
  // Used by 'Placement' example in docs or StackBlitz
  const toastPlacement = document.getElementById('toastPlacement')
  if (toastPlacement) {
    document.getElementById('selectToastPlacement').addEventListener('change', function () {
      if (!toastPlacement.dataset.originalClass) {
        toastPlacement.dataset.originalClass = toastPlacement.className
      }

      toastPlacement.className = `${toastPlacement.dataset.originalClass} ${this.value}`
    })
  }

  // Instantiate all toasts in docs pages only
  document.querySelectorAll('.cxd-example .toast')
    .forEach(toastNode => {
      if (toastNode.closest('dialog')) {
        return
      }

      const toast = new Toast(toastNode, {
        autohide: false
      })

      toast.show()
    })

  // Instantiate all toasts in docs pages only
  // js-docs-start live-toast
  const toastTrigger = document.getElementById('liveToastButton')
  const toastLiveExample = document.getElementById('liveToast')

  if (toastTrigger) {
    const toastChassis = Toast.getOrCreateInstance(toastLiveExample)
    toastTrigger.addEventListener('click', () => {
      toastChassis.show()
    })
  }
  // js-docs-end live-toast
  const dialogToastTrigger = document.getElementById('dialogToastButton')
  const dialogToastEl = document.getElementById('dialogToast')

  if (dialogToastTrigger) {
    const dialogToast = Toast.getOrCreateInstance(dialogToastEl)
    dialogToastTrigger.addEventListener('click', () => {
      dialogToast.show()
    })
  }

  // -------------------------------
  // Notifications
  // -------------------------------
  // Used in 'Show live notification' example in docs or StackBlitz

  // js-docs-start live-notification
  const notificationTrigger = document.getElementById('notificationButton')
  const notificationStack = document.getElementById('notificationStack')

  const showNotification = (message, context, role) => {
    const wrapper = document.createElement('div')
    wrapper.innerHTML = `
      <div class="notification ${context}" role="${role}">
        <p>${message}</p>
      </div>
    `.trim()

    notificationStack.prepend(wrapper.firstElementChild)
  }

  if (notificationTrigger && notificationStack) {
    notificationTrigger.addEventListener('click', () => {
      showNotification('An example notification — prepended to the stack.', 'primary', 'status')
    })
  }
  // js-docs-end live-notification

  // --------
  // Carousels
  // --------
  // Instantiate all non-autoplaying carousels in docs or StackBlitz
  document.querySelectorAll('.carousel:not([data-cx-ride="carousel"])')
    .forEach(carousel => {
      Carousel.getOrCreateInstance(carousel)
    })

  // -------------------------------
  // Checks & Radios
  // -------------------------------
  // Indeterminate checkbox example in docs and StackBlitz
  document.querySelectorAll('.cxd-example-indeterminate [type="checkbox"]')
    .forEach(checkbox => {
      if (checkbox.id.includes('Indeterminate')) {
        checkbox.indeterminate = true
      }
    })

  // -------------------------------
  // Links
  // -------------------------------
  // Disable empty links in docs examples only
  document.querySelectorAll('.cxd-content [href="#"]')
    .forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault()
      })
    })

  // -------------------------------
  // Modal
  // -------------------------------
  // Modal 'Varying modal content' example in docs and StackBlitz
  // js-docs-start varying-modal-window
  // JavaScript to handle dynamic content in the modal
  const dynamicModal = document.getElementById('dynamicModal')
  if (dynamicModal) {
    dynamicModal.addEventListener('show.cx.dialog', event => {
      // Button that triggered the modal
      const button = event.relatedTarget
      // Extract data from data-cx-* attributes
      const recipient = button.getAttribute('data-cx-whatever')
      // Get the modal elements that need to be updated
      const modalTitle = dynamicModal.querySelector('.modal-title')
      const recipientInput = dynamicModal.querySelector('#recipient-name')
      // Update the modal's content.
      modalTitle.textContent = `New message to ${recipient}`
      recipientInput.value = recipient
    })
  }
  // js-docs-end varying-modal-window

  // Modal 'Stacked modal' example in docs and StackBlitz
  // js-docs-start stacked-modal
  // JavaScript to handle showing a stacked modal
  const showStackedModal = document.getElementById('showStackedModal')
  if (showStackedModal) {
    showStackedModal.addEventListener('click', () => {
      Dialog.getOrCreateInstance('#stackedModal').show()
    })
  }
  // js-docs-end stacked-modal

  // -------------------------------
  // Drawer
  // -------------------------------
  // 'Drawer components' example in docs only
  const myDrawer = document.querySelectorAll('.cxd-example-drawer dialog.drawer')
  if (myDrawer) {
    myDrawer.forEach(drawer => {
      drawer.addEventListener('show.cx.drawer', event => {
        event.preventDefault()
      }, false)
    })
  }
}
