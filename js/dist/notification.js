/*!
  * Chassis notification.js v0.3.0 (https://chassis-ui.com)
  * Copyright 2026 Ozgur Gunes <o.gunes@gmail.com>
  * Licensed under MIT (https://github.com/chassis-ui/css/raw/main/LICENSE)
  */
import BaseComponent from './base-component.js';
import EventHandler from './dom/event-handler.js';
import { enableDismissTrigger } from './util/component-functions.js';

/**
 * --------------------------------------------------------------------------
 * Chassis CSS notification.js
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */


/**
 * Constants
 */

const NAME = 'notification';
const DATA_KEY = 'cx.notification';
const EVENT_KEY = `.${DATA_KEY}`;
const EVENT_CLOSE = `close${EVENT_KEY}`;
const EVENT_CLOSED = `closed${EVENT_KEY}`;
const CLASS_NAME_FADE = 'fade';
const CLASS_NAME_SHOW = 'show';

/**
 * Class definition
 */

class Notification extends BaseComponent {
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
    this._element.classList.remove(CLASS_NAME_SHOW);
    const isAnimated = this._element.classList.contains(CLASS_NAME_FADE);
    this._queueCallback(() => this._destroyElement(), this._element, isAnimated);
  }

  // Private
  _destroyElement() {
    this._element.remove();
    EventHandler.trigger(this._element, EVENT_CLOSED);
    this.dispose();
  }
}

/**
 * Data API implementation
 */

enableDismissTrigger(Notification, 'close');

export { Notification as default };
//# sourceMappingURL=notification.js.map
