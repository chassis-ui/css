/*!
  * Chassis accordion2.js v0.1.0 (https://github.com/chassis-ui/css/)
  * Copyright 2025 Ozgur Gunes, Chassis and Bootstrap contributors
  * Licensed under MIT (https://github.com/chassis-ui/main/LICENSE)
  */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('./base-component.js'), require('./dom/selector-engine.js'), require('./dom/event-handler.js'), require('./util/index.js')) :
  typeof define === 'function' && define.amd ? define(['./base-component', './dom/selector-engine', './dom/event-handler', './util/index'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Accordion2 = factory(global.BaseComponent, global.SelectorEngine, global.EventHandler, global.Index));
})(this, (function (BaseComponent, SelectorEngine, EventHandler, index_js) { 'use strict';

  /**
   * --------------------------------------------------------------------------
   * Chassis - CSS accordion.js
   * Licensed under MIT (https://github.com/chassis-ui//main/LICENSE)
   * --------------------------------------------------------------------------
   */

  const NAME = 'accordion';
  const DATA_KEY = 'cx.accordion';
  const EVENT_KEY = `.${DATA_KEY}`;
  const DATA_API_KEY = '.data-api';
  const EVENT_OPEN = `open${EVENT_KEY}`;
  const EVENT_OPENED = `opened${EVENT_KEY}`;
  const EVENT_CLOSE = `close${EVENT_KEY}`;
  const EVENT_CLOSED = `closed${EVENT_KEY}`;
  const SELECTOR_DETAILS = '.accordion > details';
  const SELECTOR_SUMMARY = 'summary';
  const SELECTOR_CONTENT = '.accordion-body';
  const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`;
  class Accordion extends BaseComponent {
    static get NAME() {
      return NAME;
    }
    constructor(element, config) {
      super(element, config);
      this._summary = SelectorEngine.findOne(SELECTOR_SUMMARY, element);
      this._content = SelectorEngine.findOne(SELECTOR_CONTENT, element);
      this._isTransitioning = false;
      const observer = new MutationObserver(mutationsList => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'open') {
            if (this._element.open) {
              this.open();
            } else {
              this.close();
            }
          }
        }
      });
      observer.observe(this._element, {
        attributes: true
      });
    }
    open() {
      if (this._isTransitioning) {
        return;
      }
      const startEvent = EventHandler.trigger(this._element, EVENT_OPEN);
      if (startEvent.defaultPrevented) {
        return;
      }
      this._isTransitioning = true;
      this._summary.style['box-shadow'] = 'none';
      this._element.style.overflow = 'hidden';
      this._element.style.height = `${this._summary.offsetHeight}px`;
      this._element.style.height = `${this._summary.offsetHeight + this._content.offsetHeight}px`;
      const complete = () => {
        this._isTransitioning = false;
        this._summary.style['box-shadow'] = '';
        this._element.style.overflow = '';
        this._element.style.height = '';
        EventHandler.trigger(this._element, EVENT_OPENED);
      };
      this._queueCallback(complete, this._element, true);
    }
    close() {
      if (this._isTransitioning) {
        return;
      }
      const startEvent = EventHandler.trigger(this._element, EVENT_CLOSE);
      if (startEvent.defaultPrevented) {
        return;
      }
      this._isTransitioning = true;
      this._element.style.height = `${this._summary.offsetHeight + this._content.offsetHeight}px`;
      this._element.style.height = `${this._summary.offsetHeight}px`;
      const complete = () => {
        this._isTransitioning = false;
        this._element.style.height = '';
        EventHandler.trigger(this._element, EVENT_CLOSED);
      };
      this._queueCallback(complete, this._element, true);
    }
  }
  EventHandler.on(document, EVENT_CLICK_DATA_API, SELECTOR_DETAILS, () => {
    for (const element of SelectorEngine.find(SELECTOR_DETAILS)) {
      Accordion.getOrCreateInstance(element);
    }
  });
  index_js.defineJQueryPlugin(Accordion);

  return Accordion;

}));
//# sourceMappingURL=accordion2.js.map
