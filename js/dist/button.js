/*!
  * Chassis button.js v0.3.3 (https://chassis-ui.com)
  * Copyright 2026 Ozgur Gunes <o.gunes@gmail.com>
  * Licensed under MIT (https://github.com/chassis-ui/css/raw/main/LICENSE)
  */
import BaseComponent from './base-component.js';
import EventHandler from './dom/event-handler.js';

/**
 * --------------------------------------------------------------------------
 * Chassis CSS button.js
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */


/**
 * Constants
 */

const NAME = 'button';
const DATA_KEY = 'cx.button';
const EVENT_KEY = `.${DATA_KEY}`;
const DATA_API_KEY = '.data-api';
const CLASS_NAME_ACTIVE = 'active';
const SELECTOR_DATA_TOGGLE = '[data-cx-toggle="button"]';
const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`;
const EVENT_TOGGLE = `toggle${EVENT_KEY}`;

/**
 * Class definition
 */

class Button extends BaseComponent {
  // Getters
  static get NAME() {
    return NAME;
  }

  // Public
  toggle() {
    const isActive = this._element.classList.toggle(CLASS_NAME_ACTIVE);
    this._element.setAttribute('aria-pressed', isActive);
    EventHandler.trigger(this._element, EVENT_TOGGLE, {
      active: isActive
    });
  }
}

/**
 * Data API implementation
 */

EventHandler.on(document, EVENT_CLICK_DATA_API, SELECTOR_DATA_TOGGLE, event => {
  event.preventDefault();
  const button = event.target.closest(SELECTOR_DATA_TOGGLE);
  const data = Button.getOrCreateInstance(button);
  data.toggle();
});

export { Button as default };
//# sourceMappingURL=button.js.map
