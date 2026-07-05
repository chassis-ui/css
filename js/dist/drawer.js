/*!
  * Chassis drawer.js v0.3.0 (https://chassis-ui.com)
  * Copyright 2026 Ozgur Gunes <o.gunes@gmail.com>
  * Licensed under MIT (https://github.com/chassis-ui/css/raw/main/LICENSE)
  */
import DialogBase from './dialog-base.js';
import EventHandler from './dom/event-handler.js';
import SelectorEngine from './dom/selector-engine.js';
import Swipe from './util/swipe.js';
import { isDisabled, isVisible, isRTL } from './util/index.js';

/**
 * --------------------------------------------------------------------------
 * Chassis CSS drawer.js
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */


/**
 * Constants
 */

const NAME = 'drawer';
const DATA_KEY = 'cx.drawer';
const EVENT_KEY = `.${DATA_KEY}`;
const DATA_API_KEY = '.data-api';
const EVENT_HIDDEN = `hidden${EVENT_KEY}`;
const EVENT_RESIZE = `resize${EVENT_KEY}`;
const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`;
const EVENT_CLICK_DISMISS = `click.dismiss${EVENT_KEY}`;
const EVENT_LOAD_DATA_API = `load${EVENT_KEY}${DATA_API_KEY}`;
const CLASS_NAME_INSTANT = 'instant';
const CLASS_NAME_STATIC = 'static';
const SELECTOR_DATA_TOGGLE = '[data-cx-toggle="drawer"]';
const SELECTOR_DATA_DISMISS = '[data-cx-dismiss="drawer"]';
const SELECTOR_OPEN_DRAWER = 'dialog.drawer[open], dialog[open][class*=":drawer"]';
const SELECTOR_RESPONSIVE_OPEN = 'dialog[open][class*=":drawer"]';
const Default = {
  backdrop: true,
  keyboard: true,
  scroll: false
};
const DefaultType = {
  backdrop: '(boolean|string)',
  keyboard: 'boolean',
  scroll: 'boolean'
};

/**
 * Class definition
 */

class Drawer extends DialogBase {
  constructor(element, config) {
    super(element, config);
    this._swipeHelper = null;
  }

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
  dispose() {
    if (this._swipeHelper) {
      this._swipeHelper.dispose();
    }
    super.dispose();
  }

  // Protected — hook overrides

  _getShowOptions() {
    const useModal = Boolean(this._config.backdrop) || !this._config.scroll;
    return {
      modal: useModal,
      preventBodyScroll: !this._config.scroll
    };
  }
  _onBeforeShow() {
    this._initSwipe();
  }
  _getInstantClassName() {
    return CLASS_NAME_INSTANT;
  }
  _getStaticClassName() {
    return CLASS_NAME_STATIC;
  }

  // Private

  _initSwipe() {
    if (this._swipeHelper || !Swipe.isSupported()) {
      return;
    }

    // Determine which swipe direction dismisses based on placement
    const swipeConfig = {};
    const element = this._element;
    if (element.classList.contains('drawer-bottom')) {
      swipeConfig.downCallback = () => this.hide();
    } else if (element.classList.contains('drawer-top')) {
      swipeConfig.upCallback = () => this.hide();
    } else if (element.classList.contains('drawer-end')) {
      swipeConfig[isRTL() ? 'leftCallback' : 'rightCallback'] = () => this.hide();
    } else {
      // drawer-start (default)
      swipeConfig[isRTL() ? 'rightCallback' : 'leftCallback'] = () => this.hide();
    }
    this._swipeHelper = new Swipe(element, swipeConfig);
  }
}

/**
 * Data API implementation
 */

EventHandler.on(document, EVENT_CLICK_DATA_API, SELECTOR_DATA_TOGGLE, function (event) {
  const target = SelectorEngine.getElementFromSelector(this);
  if (['A', 'AREA'].includes(this.tagName)) {
    event.preventDefault();
  }
  if (isDisabled(this)) {
    return;
  }
  EventHandler.one(target, EVENT_HIDDEN, () => {
    if (isVisible(this)) {
      this.focus();
    }
  });

  // Close any other open drawer before toggling this one
  const alreadyOpen = SelectorEngine.findOne(SELECTOR_OPEN_DRAWER);
  if (alreadyOpen && alreadyOpen !== target) {
    Drawer.getInstance(alreadyOpen)?.hide();
  }
  Drawer.getOrCreateInstance(target).toggle(this);
});
EventHandler.on(window, EVENT_LOAD_DATA_API, () => {
  for (const element of SelectorEngine.find(SELECTOR_OPEN_DRAWER)) {
    Drawer.getOrCreateInstance(element).show();
  }
});
EventHandler.on(window, EVENT_RESIZE, () => {
  for (const element of SelectorEngine.find(SELECTOR_RESPONSIVE_OPEN)) {
    if (getComputedStyle(element).position !== 'fixed') {
      Drawer.getOrCreateInstance(element).hide();
    }
  }
});

// Custom dismiss handler — extends the standard pattern to also resolve
// responsive drawer variants (e.g. .max-large:drawer) that have no .drawer class.
EventHandler.on(document, EVENT_CLICK_DISMISS, SELECTOR_DATA_DISMISS, function (event) {
  if (['A', 'AREA'].includes(this.tagName)) {
    event.preventDefault();
  }
  if (isDisabled(this)) {
    return;
  }
  const target = SelectorEngine.getElementFromSelector(this) || this.closest('.drawer') || this.closest('dialog[class*=":drawer"]');
  if (!target) {
    return;
  }
  Drawer.getOrCreateInstance(target).hide();
});

export { Drawer as default };
//# sourceMappingURL=drawer.js.map
