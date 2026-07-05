/*!
  * Chassis toggler.js v0.3.0 (https://chassis-ui.com)
  * Copyright 2026 Ozgur Gunes <o.gunes@gmail.com>
  * Licensed under MIT (https://github.com/chassis-ui/css/raw/main/LICENSE)
  */
import BaseComponent from './base-component.js';
import EventHandler from './dom/event-handler.js';
import { eventActionOnPlugin } from './util/component-functions.js';

/**
 * --------------------------------------------------------------------------
 * Chassis CSS toggler.js
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */


/**
 * Constants
 */

const NAME = 'toggler';
const DATA_KEY = 'cx.toggler';
const EVENT_KEY = `.${DATA_KEY}`;
const EVENT_TOGGLE = `toggle${EVENT_KEY}`;
const EVENT_TOGGLED = `toggled${EVENT_KEY}`;
const EVENT_CLICK = 'click';
const SELECTOR_DATA_TOGGLE = '[data-cx-toggle="toggler"]';
const DefaultType = {
  attribute: 'string',
  value: '(string|number|boolean)'
};
const Default = {
  attribute: 'class',
  value: null
};

/**
 * Class definition
 */

class Toggler extends BaseComponent {
  // Getters
  static get Default() {
    return Default;
  }
  static get DefaultType() {
    return DefaultType;
  }
  static get NAME() {
    return NAME;
  }

  // Public
  toggle() {
    const toggleEvent = EventHandler.trigger(this._element, EVENT_TOGGLE);
    if (toggleEvent.defaultPrevented) {
      return;
    }
    this._execute();
    EventHandler.trigger(this._element, EVENT_TOGGLED);
  }

  // Private
  _execute() {
    const {
      attribute,
      value
    } = this._config;
    if (attribute === 'id') {
      return; // You have to be kidding
    }
    if (attribute === 'class') {
      this._element.classList.toggle(value);
      return;
    }

    // Compare as strings since getAttribute() always returns a string
    if (this._element.getAttribute(attribute) === String(value)) {
      this._element.removeAttribute(attribute);
      return;
    }
    this._element.setAttribute(attribute, value);
  }
}

/**
 * Data API implementation
 */

eventActionOnPlugin(Toggler, EVENT_CLICK, SELECTOR_DATA_TOGGLE, 'toggle');

export { Toggler as default };
//# sourceMappingURL=toggler.js.map
