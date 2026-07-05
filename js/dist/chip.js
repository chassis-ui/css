/*!
  * Chassis chip.js v0.3.0 (https://chassis-ui.com)
  * Copyright 2026 Ozgur Gunes <o.gunes@gmail.com>
  * Licensed under MIT (https://github.com/chassis-ui/css/raw/main/LICENSE)
  */
import BaseComponent from './base-component.js';
import EventHandler from './dom/event-handler.js';
import { enableDismissTrigger } from './util/component-functions.js';

/**
 * --------------------------------------------------------------------------
 * Chassis CSS chip.js
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */


/**
 * Constants
 */

const NAME = 'chip';
const DATA_KEY = 'cx.chip';
const EVENT_KEY = `.${DATA_KEY}`;
const DATA_API_KEY = '.data-api';
const CLASS_NAME_ACTIVE = 'active';
const SELECTOR_DATA_TOGGLE = '[data-cx-toggle="chip"]';
const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`;
const EVENT_CLOSE = `close${EVENT_KEY}`;
const EVENT_TOGGLE = `toggle${EVENT_KEY}`;

/**
 * Class definition
 */

class Chip extends BaseComponent {
  // Getters
  static get NAME() {
    return NAME;
  }

  // Public
  close() {
    const closeEvent = EventHandler.trigger(this._element, EVENT_CLOSE);
    if (closeEvent.defaultPrevented) {
      return;
    }
    this._element.remove();
    this.dispose();
  }
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
  const chip = event.target.closest(SELECTOR_DATA_TOGGLE);
  const data = Chip.getOrCreateInstance(chip);
  data.toggle();
});
enableDismissTrigger(Chip, 'close');

export { Chip as default };
//# sourceMappingURL=chip.js.map
