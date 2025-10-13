/*!
  * Chassis accordion3.js v0.1.0 (https://github.com/chassis-ui/css/)
  * Copyright 2025 Ozgur Gunes, Chassis and Bootstrap contributors
  * Licensed under MIT (https://github.com/chassis-ui/main/LICENSE)
  */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('./base-component.js'), require('./util/index.js')) :
  typeof define === 'function' && define.amd ? define(['./base-component', './util/index'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Accordion3 = factory(global.BaseComponent, global.Index));
})(this, (function (BaseComponent, index_js) { 'use strict';

  /**
   * --------------------------------------------------------------------------
   * Chassis - CSS accordion.js
   * Licensed under MIT (https://github.com/chassis-ui//main/LICENSE)
   * --------------------------------------------------------------------------
   */

  const NAME = 'accordion';
  // const DATA_KEY = 'cx.accordion'
  // const EVENT_KEY = `.${DATA_KEY}`
  // const DATA_API_KEY = '.data-api'

  // const EVENT_OPEN = `open${EVENT_KEY}`
  // const EVENT_OPENED = `opened${EVENT_KEY}`
  // const EVENT_CLOSE = `close${EVENT_KEY}`
  // const EVENT_CLOSED = `closed${EVENT_KEY}`
  // const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`

  // const CLASS_NAME_OPEN = 'open'
  // const CLASS_NAME_CLOSE = 'collapse'
  // const CLASS_NAME_CLOSING = 'collapsing'
  // const CLASS_NAME_CLOSED = 'collapsed'
  // const CLASS_NAME_DEEPER_CHILDREN = `:scope .${CLASS_NAME_CLOSE} .${CLASS_NAME_CLOSING}`
  // const CLASS_NAME_HORIZONTAL = 'collapse-horizontal'

  // const SELECTOR_ACTIVES = '.open, .closing'

  class Accordion extends BaseComponent {
    static get NAME() {
      return NAME;
    }
    constructor(element, config) {
      super(element, config);
      // Store the <details> element
      // Store the <summary> element
      this._summary = element.querySelector('summary');
      // Store the <div class="content"> element
      this._content = element.querySelector('.accordion-body');
      // Store if the element is closing
      this._isOpening = false;
      // Store if the element is expanding
      this._isClosing = false;
      // Detect user clicks on the summary element
      this._summary.addEventListener('click', e => this.onClick(e));
      this._isStatic = this._element.parentElement.classList.contains('static');
    }
    onClick(e) {
      // Stop default behaviour from the browser
      e.preventDefault();
      // Add an overflow on the <details> to avoid content overflowing
      this._element.style.overflow = 'hidden';
      // reflow(this._element)
      // Check if the element is being closed or is already closed
      // console.log(this._element.open) // eslint-disable-line no-console
      if (this._isClosing || !this._element.open) {
        // Collapse other elements
        this._openItems = this._element.parentElement.querySelectorAll('details[open]');
        if (!this._isStatic && this._openItems) {
          for (const e of this._openItems) {
            const item = new Accordion(e);
            if (item._element !== this._element) {
              item._element.style.overflow = 'hidden';
              item.close();
            }
          }
        }
        // this.mode = this._element.querySelector('data-cx-accordion')

        // Store open elements
        this.open();
        // Check if the element is being openned or is already open
      } else if (this._isOpening || this._element.open) {
        this.close();
      }
    }
    open() {
      if (this._isOpening || this._element.open) {
        return;
      }

      // this._element.open = true

      // EventHandler.trigger(this._element, EVENT_OPEN)
      // if (startEvent.defaultPrevented) {
      //   return
      // }

      // this._element.classList.add(CLASS_NAME_CLOSING)

      this._element.style.height = `${this._element.offsetHeight}px`;

      // reflow(this._element)
      this._isOpening = true;
      const complete = () => {
        this._element.open = true;
        this._isOpening = false;
        // this._element.classList.remove(CLASS_NAME_CLOSING)
        this._element.style.overflow = '';
        this._element.style.height = '';
        // EventHandler.trigger(this._element, EVENT_OPENED)
      };
      this._element.style.height = `${this._summary.offsetHeight + this._content.offsetHeight}px`;
      this._queueCallback(complete, this._element, true);
    }
    close() {
      if (this._isClosing || !this._element.open) {
        return;
      }

      // EventHandler.trigger(this._element, EVENT_CLOSE)
      // if (startEvent.defaultPrevented) {
      //   return
      // }

      this._element.style.height = `${this._element.offsetHeight}px`;

      // reflow(this._element)

      // this._element.classList.add(CLASS_NAME_CLOSING)
      this._isClosing = true;
      const complete = () => {
        this._isClosing = false;
        // this._element.classList.remove(CLASS_NAME_CLOSING)
        this._element.open = false;
        this._element.style.overflow = '';
        this._element.style.height = '';
        // EventHandler.trigger(this._element, EVENT_CLOSED)
      };
      this._element.style.height = `${this._summary.offsetHeight}px`;
      this._queueCallback(complete, this._element, true);
    }
  }
  for (const element of document.querySelectorAll('.accordion > details')) {
    // eslint-disable-next-line no-new
    new Accordion(element);
  }
  index_js.defineJQueryPlugin(Accordion);

  return Accordion;

}));
//# sourceMappingURL=accordion3.js.map
