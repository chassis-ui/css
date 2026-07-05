/*!
  * Chassis menu.js v0.3.2 (https://chassis-ui.com)
  * Copyright 2026 Ozgur Gunes <o.gunes@gmail.com>
  * Licensed under MIT (https://github.com/chassis-ui/css/raw/main/LICENSE)
  */
import { computePosition, autoUpdate, offset, flip, shift } from '@floating-ui/dom';
import FloatingBase from './floating-base.js';
import EventHandler from './dom/event-handler.js';
import Manipulator from './dom/manipulator.js';
import SelectorEngine from './dom/selector-engine.js';
import { isDisabled, noop, isElement, getElement, execute, isRTL, isVisible, getNextActiveElement } from './util/index.js';

/**
 * --------------------------------------------------------------------------
 * Chassis CSS menu.js
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */


/**
 * Constants
 */

const NAME = 'menu';
const DATA_KEY = 'cx.menu';
const EVENT_KEY = `.${DATA_KEY}`;
const DATA_API_KEY = '.data-api';
const ESCAPE_KEY = 'Escape';
const TAB_KEY = 'Tab';
const ARROW_UP_KEY = 'ArrowUp';
const ARROW_DOWN_KEY = 'ArrowDown';
const ARROW_LEFT_KEY = 'ArrowLeft';
const ARROW_RIGHT_KEY = 'ArrowRight';
const HOME_KEY = 'Home';
const END_KEY = 'End';
const ENTER_KEY = 'Enter';
const SPACE_KEY = ' ';
const RIGHT_MOUSE_BUTTON = 2;
const SUBMENU_CLOSE_DELAY = 100;
const EVENT_HIDE = `hide${EVENT_KEY}`;
const EVENT_HIDDEN = `hidden${EVENT_KEY}`;
const EVENT_SHOW = `show${EVENT_KEY}`;
const EVENT_SHOWN = `shown${EVENT_KEY}`;
const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`;
const EVENT_KEYDOWN_DATA_API = `keydown${EVENT_KEY}${DATA_API_KEY}`;
const EVENT_KEYUP_DATA_API = `keyup${EVENT_KEY}${DATA_API_KEY}`;
const CLASS_NAME_SHOW = 'show';
const CLASS_NAME_STACKED = 'submenu-stacked';
const SELECTOR_DATA_TOGGLE = '[data-cx-toggle="menu"]:not(.disabled):not(:disabled)';
const SELECTOR_MENU = '.menu';
const SELECTOR_SUBMENU = '.submenu';
const SELECTOR_SUBMENU_TOGGLE = '.submenu > .menu-item';
const SELECTOR_SUBMENU_BACK = '.submenu-back';
const SELECTOR_NAVBAR_NAV = '.navbar-nav';
const SELECTOR_VISIBLE_ITEMS = ':is(.menu-item, .submenu-back):not(.disabled):not(:disabled)';

// Items navigable by arrow / Home / End keys at the current menu level. Covers:
// - Direct children matching .menu-item or .submenu-back (the standard items).
// - Submenu triggers, which are .menu-item elements nested inside .submenu
//   (per SELECTOR_SUBMENU_TOGGLE = '.submenu > .menu-item'). Without this
//   second branch, keyboard nav silently skips over any submenu trigger
//   because it isn't a direct child of the .menu.
const SELECTOR_KB_NAV_ITEMS = [`:scope > ${SELECTOR_VISIBLE_ITEMS}`, `:scope > .submenu > .menu-item:not(.disabled):not(:disabled)`].join(', ');
const DEFAULT_PLACEMENT = 'bottom-start';
const SUBMENU_PLACEMENT = 'end-start';
const resolveLogicalPlacement = placement => {
  if (isRTL()) {
    return placement.replace(/^start(?=-|$)/, 'right').replace(/^end(?=-|$)/, 'left');
  }
  return placement.replace(/^start(?=-|$)/, 'left').replace(/^end(?=-|$)/, 'right');
};
const triangleSign = (p1, p2, p3) => (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
const Default = {
  autoClose: true,
  boundary: 'clippingParents',
  container: false,
  display: 'dynamic',
  offset: [0, 2],
  floatingConfig: null,
  menu: null,
  placement: DEFAULT_PLACEMENT,
  reference: 'toggle',
  strategy: 'absolute',
  submenuTrigger: 'both',
  submenuDelay: SUBMENU_CLOSE_DELAY
};
const DefaultType = {
  autoClose: '(boolean|string)',
  boundary: '(string|element)',
  container: '(string|element|boolean)',
  display: 'string',
  offset: '(array|string|function)',
  floatingConfig: '(null|object|function)',
  menu: '(null|element)',
  placement: 'string',
  reference: '(string|element|object)',
  strategy: 'string',
  submenuTrigger: 'string',
  submenuDelay: 'number'
};

/**
 * Class definition
 */

class Menu extends FloatingBase {
  static _openInstances = new Set();
  constructor(element, config) {
    if (typeof computePosition === 'undefined') {
      throw new TypeError('Chassis CSS\'s menus require Floating UI (https://floating-ui.com)');
    }
    super(element, config);
    this._parent = this._element.parentNode;
    this._isSubmenu = this._parent.classList?.contains('submenu');
    this._openSubmenus = new Map();
    this._submenuCloseTimeouts = new Map();
    this._hoverIntentSamples = [];
    this._menu = this._config.menu || this._findMenu();
    this._menuOriginalParent = this._menu?.parentNode;
    this._parseResponsivePlacements();
    this._setupSubmenuListeners();
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
  toggle() {
    return this._isShown() ? this.hide() : this.show();
  }
  show() {
    if (isDisabled(this._element) || this._isShown()) {
      return;
    }
    const relatedTarget = {
      relatedTarget: this._element
    };
    const showEvent = EventHandler.trigger(this._element, EVENT_SHOW, relatedTarget);
    if (showEvent.defaultPrevented) {
      return;
    }
    this._moveMenuToContainer();
    this._createFloating();
    if ('ontouchstart' in document.documentElement && !this._parent.closest(SELECTOR_NAVBAR_NAV)) {
      for (const element of document.body.children) {
        EventHandler.on(element, 'mouseover', noop);
      }
    }
    this._element.focus({
      focusVisible: false
    });
    this._element.setAttribute('aria-expanded', 'true');
    this._menu.classList.add(CLASS_NAME_SHOW);
    this._element.classList.add(CLASS_NAME_SHOW);
    if (this._parent) {
      this._parent.classList.add(CLASS_NAME_SHOW);
    }
    Menu._openInstances.add(this);
    EventHandler.trigger(this._element, EVENT_SHOWN, relatedTarget);
  }
  hide() {
    if (isDisabled(this._element) || !this._isShown()) {
      return;
    }
    const relatedTarget = {
      relatedTarget: this._element
    };
    this._completeHide(relatedTarget);
  }
  dispose() {
    this._closeAllSubmenus();
    this._clearAllSubmenuTimeouts();
    this._disposeFloating();
    this._restoreMenuToOriginalParent();
    this._disposeMediaQueryListeners();
    if (this._menu) {
      EventHandler.off(this._menu, 'mouseenter');
      EventHandler.off(this._menu, 'mouseleave');
      EventHandler.off(this._menu, 'mousemove');
      EventHandler.off(this._menu, 'click');
      if (this._menu.classList.contains(CLASS_NAME_SHOW)) {
        this._menu.classList.remove(CLASS_NAME_SHOW);
        this._menu.style.position = '';
        this._menu.style.left = '';
        this._menu.style.top = '';
        this._menu.style.margin = '';
        Manipulator.removeDataAttribute(this._menu, 'placement');
        Manipulator.removeDataAttribute(this._menu, 'display');
      }
    }
    this._element.classList.remove(CLASS_NAME_SHOW);
    this._element.setAttribute('aria-expanded', 'false');
    Menu._openInstances.delete(this);
    super.dispose();
  }
  update() {
    if (this._floatingCleanup) {
      this._updateFloatingPosition();
    }
  }

  // Private
  _findMenu() {
    return SelectorEngine.next(this._element, SELECTOR_MENU)[0] || SelectorEngine.prev(this._element, SELECTOR_MENU)[0] || SelectorEngine.findOne(SELECTOR_MENU, this._parent);
  }
  _completeHide(relatedTarget) {
    const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE, relatedTarget);
    if (hideEvent.defaultPrevented) {
      return;
    }
    this._closeAllSubmenus();
    if ('ontouchstart' in document.documentElement) {
      for (const element of document.body.children) {
        EventHandler.off(element, 'mouseover', noop);
      }
    }
    this._disposeFloating();
    this._restoreMenuToOriginalParent();
    this._menu.classList.remove(CLASS_NAME_SHOW);
    this._element.classList.remove(CLASS_NAME_SHOW);
    if (this._parent) {
      this._parent.classList.remove(CLASS_NAME_SHOW);
    }
    this._element.setAttribute('aria-expanded', 'false');
    Manipulator.removeDataAttribute(this._menu, 'placement');
    Manipulator.removeDataAttribute(this._menu, 'display');
    Menu._openInstances.delete(this);
    EventHandler.trigger(this._element, EVENT_HIDDEN, relatedTarget);
  }
  _getConfig(config) {
    config = super._getConfig(config);
    if (typeof config.reference === 'object' && !isElement(config.reference) && typeof config.reference.getBoundingClientRect !== 'function') {
      throw new TypeError(`${NAME.toUpperCase()}: Option "reference" provided type "object" without a required "getBoundingClientRect" method.`);
    }
    return config;
  }
  _createFloating() {
    if (this._config.display === 'static') {
      Manipulator.setDataAttribute(this._menu, 'display', 'static');
      return;
    }
    let referenceElement = this._element;
    if (this._config.reference === 'parent') {
      referenceElement = this._parent;
    } else if (isElement(this._config.reference)) {
      referenceElement = getElement(this._config.reference);
    } else if (typeof this._config.reference === 'object') {
      referenceElement = this._config.reference;
    }
    this._updateFloatingPosition(referenceElement);
    this._floatingCleanup = autoUpdate(referenceElement, this._menu, () => this._updateFloatingPosition(referenceElement));
  }
  async _updateFloatingPosition(referenceElement = null) {
    if (!this._menu) {
      return;
    }
    if (!referenceElement) {
      if (this._config.reference === 'parent') {
        referenceElement = this._parent;
      } else if (isElement(this._config.reference)) {
        referenceElement = getElement(this._config.reference);
      } else if (typeof this._config.reference === 'object') {
        referenceElement = this._config.reference;
      } else {
        referenceElement = this._element;
      }
    }
    const placement = this._getPlacement();
    const middleware = this._getFloatingMiddleware();
    const floatingConfig = this._getFloatingConfig(placement, middleware);
    await this._applyFloatingPosition(referenceElement, this._menu, floatingConfig.placement, floatingConfig.middleware, floatingConfig.strategy);
  }
  _isShown() {
    return this._menu.classList.contains(CLASS_NAME_SHOW);
  }
  _getPlacement() {
    const placement = this._responsivePlacements ? this._getResponsivePlacement() : this._config.placement;
    return resolveLogicalPlacement(placement);
  }
  _getDefaultPlacement() {
    return DEFAULT_PLACEMENT;
  }
  _getFallbackPlacements() {
    const placement = this._getPlacement();
    const fallbackMap = {
      bottom: ['top', 'bottom-start', 'bottom-end', 'top-start', 'top-end'],
      'bottom-start': ['top-start', 'bottom-end', 'top-end'],
      'bottom-end': ['top-end', 'bottom-start', 'top-start'],
      top: ['bottom', 'top-start', 'top-end', 'bottom-start', 'bottom-end'],
      'top-start': ['bottom-start', 'top-end', 'bottom-end'],
      'top-end': ['bottom-end', 'top-start', 'bottom-start'],
      right: ['left', 'right-start', 'right-end', 'left-start', 'left-end'],
      'right-start': ['left-start', 'right-end', 'left-end', 'top-start', 'bottom-start'],
      'right-end': ['left-end', 'right-start', 'left-start', 'top-end', 'bottom-end'],
      left: ['right', 'left-start', 'left-end', 'right-start', 'right-end'],
      'left-start': ['right-start', 'left-end', 'right-end', 'top-start', 'bottom-start'],
      'left-end': ['right-end', 'left-start', 'right-start', 'top-end', 'bottom-end']
    };
    return fallbackMap[placement] || ['top', 'bottom', 'right', 'left'];
  }
  _getFloatingConfig(placement, middleware) {
    const defaultConfig = {
      placement,
      middleware,
      strategy: this._config.strategy
    };
    return {
      ...defaultConfig,
      ...execute(this._config.floatingConfig, [undefined, defaultConfig])
    };
  }
  _getContainer() {
    const {
      container
    } = this._config;
    if (container === false) {
      return null;
    }
    return container === true ? document.body : getElement(container);
  }
  _moveMenuToContainer() {
    const container = this._getContainer();
    if (!container || !this._menu) {
      return;
    }
    if (this._menu.parentNode !== container) {
      container.append(this._menu);
    }
  }
  _restoreMenuToOriginalParent() {
    if (!this._menuOriginalParent || !this._menu) {
      return;
    }
    if (this._menu.parentNode !== this._menuOriginalParent) {
      this._menuOriginalParent.append(this._menu);
    }
  }
  async _applyFloatingPosition(reference, floating, placement, middleware, strategy = 'absolute') {
    if (!floating.isConnected || !floating.classList.contains(CLASS_NAME_SHOW)) {
      return null;
    }
    const {
      x,
      y,
      placement: finalPlacement
    } = await computePosition(reference, floating, {
      placement,
      middleware,
      strategy
    });
    if (!floating.isConnected || !floating.classList.contains(CLASS_NAME_SHOW)) {
      return null;
    }
    Object.assign(floating.style, {
      position: strategy,
      left: `${x}px`,
      top: `${y}px`,
      margin: '0'
    });
    Manipulator.setDataAttribute(floating, 'placement', finalPlacement);
    return finalPlacement;
  }

  // -------------------------------------------------------------------------
  // Submenu handling
  // -------------------------------------------------------------------------

  _setupSubmenuListeners() {
    if (!this._menu || !SelectorEngine.findOne(SELECTOR_SUBMENU, this._menu)) {
      return;
    }
    const supportsHover = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: hover)').matches;
    if (supportsHover && (this._config.submenuTrigger === 'hover' || this._config.submenuTrigger === 'both')) {
      EventHandler.on(this._menu, 'mouseenter', SELECTOR_SUBMENU_TOGGLE, event => {
        this._onSubmenuTriggerEnter(event);
      });
      EventHandler.on(this._menu, 'mouseleave', SELECTOR_SUBMENU, event => {
        this._onSubmenuLeave(event);
      });
      EventHandler.on(this._menu, 'mousemove', event => {
        this._trackMousePosition(event);
      });
    }
    if (this._config.submenuTrigger === 'click' || this._config.submenuTrigger === 'both') {
      EventHandler.on(this._menu, 'click', SELECTOR_SUBMENU_TOGGLE, event => {
        this._onSubmenuTriggerClick(event);
      });
    }
    EventHandler.on(this._menu, 'click', SELECTOR_SUBMENU_BACK, event => {
      this._onSubmenuBackClick(event);
    });
  }
  _onSubmenuTriggerEnter(event) {
    const trigger = event.target.closest(SELECTOR_SUBMENU_TOGGLE);
    if (!trigger) {
      return;
    }
    const submenuWrapper = trigger.closest(SELECTOR_SUBMENU);
    const submenu = SelectorEngine.findOne(SELECTOR_MENU, submenuWrapper);
    if (!submenu) {
      return;
    }
    this._cancelSubmenuCloseTimeout(submenu);
    this._closeSiblingSubmenus(submenuWrapper);
    this._openSubmenu(trigger, submenu, submenuWrapper);
  }
  _onSubmenuLeave(event) {
    const submenuWrapper = event.target.closest(SELECTOR_SUBMENU);
    const submenu = SelectorEngine.findOne(SELECTOR_MENU, submenuWrapper);
    if (!submenu || !this._openSubmenus.has(submenu)) {
      return;
    }
    if (this._isMovingTowardSubmenu(event, submenu)) {
      return;
    }
    this._scheduleSubmenuClose(submenu, submenuWrapper);
  }
  _onSubmenuTriggerClick(event) {
    const trigger = event.target.closest(SELECTOR_SUBMENU_TOGGLE);
    if (!trigger) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const submenuWrapper = trigger.closest(SELECTOR_SUBMENU);
    const submenu = SelectorEngine.findOne(SELECTOR_MENU, submenuWrapper);
    if (!submenu) {
      return;
    }
    if (this._openSubmenus.has(submenu)) {
      this._closeSubmenu(submenu, submenuWrapper);
      return;
    }
    this._closeSiblingSubmenus(submenuWrapper);
    this._openSubmenu(trigger, submenu, submenuWrapper);
    if (submenu.classList.contains(CLASS_NAME_STACKED)) {
      requestAnimationFrame(() => {
        const focusTarget = SelectorEngine.findOne(SELECTOR_SUBMENU_BACK, submenu) || SelectorEngine.findOne(SELECTOR_VISIBLE_ITEMS, submenu);
        focusTarget?.focus();
      });
    }
  }
  _openSubmenu(trigger, submenu, submenuWrapper) {
    if (this._openSubmenus.has(submenu)) {
      return;
    }
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-haspopup', 'true');
    submenu.classList.add(CLASS_NAME_SHOW);
    submenuWrapper.classList.add(CLASS_NAME_SHOW);
    const cleanup = this._createSubmenuFloating(trigger, submenu, submenuWrapper);
    this._openSubmenus.set(submenu, cleanup);
    EventHandler.on(submenu, 'mouseenter', () => {
      this._cancelSubmenuCloseTimeout(submenu);
    });
  }
  _onSubmenuBackClick(event) {
    const back = event.target.closest(SELECTOR_SUBMENU_BACK);
    if (!back) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const wrapper = back.closest(SELECTOR_SUBMENU);
    const submenu = back.closest(SELECTOR_MENU);
    if (!wrapper || !submenu) {
      return;
    }
    this._closeSubmenu(submenu, wrapper);
    const trigger = SelectorEngine.findOne(SELECTOR_SUBMENU_TOGGLE, wrapper);
    if (trigger) {
      trigger.focus();
    }
  }
  _closeSubmenu(submenu, submenuWrapper) {
    if (!this._openSubmenus.has(submenu)) {
      return;
    }
    const nestedSubmenus = SelectorEngine.find(`${SELECTOR_SUBMENU} ${SELECTOR_MENU}.${CLASS_NAME_SHOW}`, submenu);
    for (const nested of nestedSubmenus) {
      const nestedWrapper = nested.closest(SELECTOR_SUBMENU);
      this._closeSubmenu(nested, nestedWrapper);
    }
    const trigger = SelectorEngine.findOne(SELECTOR_SUBMENU_TOGGLE, submenuWrapper);
    const cleanup = this._openSubmenus.get(submenu);
    if (cleanup) {
      cleanup();
    }
    this._openSubmenus.delete(submenu);
    EventHandler.off(submenu, 'mouseenter');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    }
    submenu.classList.remove(CLASS_NAME_SHOW);
    submenuWrapper.classList.remove(CLASS_NAME_SHOW);
  }
  _closeAllSubmenus() {
    for (const [submenu] of this._openSubmenus) {
      const submenuWrapper = submenu.closest(SELECTOR_SUBMENU);
      this._closeSubmenu(submenu, submenuWrapper);
    }
  }
  _closeSiblingSubmenus(currentSubmenuWrapper) {
    const parent = currentSubmenuWrapper.parentNode;
    const siblingSubmenus = SelectorEngine.find(`${SELECTOR_SUBMENU} > ${SELECTOR_MENU}.${CLASS_NAME_SHOW}`, parent);
    for (const siblingMenu of siblingSubmenus) {
      const siblingWrapper = siblingMenu.closest(SELECTOR_SUBMENU);
      if (siblingWrapper !== currentSubmenuWrapper) {
        this._closeSubmenu(siblingMenu, siblingWrapper);
      }
    }
  }
  _createSubmenuFloating(trigger, submenu, submenuWrapper) {
    const referenceElement = submenuWrapper;
    const placement = resolveLogicalPlacement(SUBMENU_PLACEMENT);
    const middleware = [offset({
      mainAxis: 0,
      crossAxis: -4
    }), flip({
      fallbackPlacements: [resolveLogicalPlacement('start-start'), resolveLogicalPlacement('end-end'), resolveLogicalPlacement('start-end')]
    }), shift({
      padding: 8
    })];
    const updatePosition = () => this._applyFloatingPosition(referenceElement, submenu, placement, middleware);
    updatePosition();
    return autoUpdate(referenceElement, submenu, updatePosition);
  }
  _scheduleSubmenuClose(submenu, submenuWrapper) {
    this._cancelSubmenuCloseTimeout(submenu);
    const timeoutId = setTimeout(() => {
      this._closeSubmenu(submenu, submenuWrapper);
      this._submenuCloseTimeouts.delete(submenu);
    }, this._config.submenuDelay);
    this._submenuCloseTimeouts.set(submenu, timeoutId);
  }
  _cancelSubmenuCloseTimeout(submenu) {
    const timeoutId = this._submenuCloseTimeouts.get(submenu);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this._submenuCloseTimeouts.delete(submenu);
    }
  }
  _clearAllSubmenuTimeouts() {
    for (const timeoutId of this._submenuCloseTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    this._submenuCloseTimeouts.clear();
  }

  // -------------------------------------------------------------------------
  // Hover intent / Safe triangle
  // -------------------------------------------------------------------------

  _trackMousePosition(event) {
    const now = Date.now();
    this._hoverIntentSamples.push({
      x: event.clientX,
      y: event.clientY,
      t: now
    });
    while (this._hoverIntentSamples.length > 0 && now - this._hoverIntentSamples[0].t > 300) {
      this._hoverIntentSamples.shift();
    }
  }
  _isMovingTowardSubmenu(event, submenu) {
    if (this._hoverIntentSamples.length < 2) {
      return false;
    }
    const now = Date.now();
    let oldSample = null;
    for (let i = this._hoverIntentSamples.length - 1; i >= 0; i--) {
      if (now - this._hoverIntentSamples[i].t >= 50) {
        oldSample = this._hoverIntentSamples[i];
        break;
      }
    }
    if (!oldSample) {
      return false;
    }
    const submenuRect = submenu.getBoundingClientRect();
    const currentPos = {
      x: event.clientX,
      y: event.clientY
    };
    const lastPos = {
      x: oldSample.x,
      y: oldSample.y
    };
    const isRtl = isRTL();
    const targetX = isRtl ? submenuRect.right : submenuRect.left;
    const topCorner = {
      x: targetX,
      y: submenuRect.top
    };
    const bottomCorner = {
      x: targetX,
      y: submenuRect.bottom
    };
    return this._pointInTriangle(currentPos, lastPos, topCorner, bottomCorner);
  }
  _pointInTriangle(point, v1, v2, v3) {
    const d1 = triangleSign(point, v1, v2);
    const d2 = triangleSign(point, v2, v3);
    const d3 = triangleSign(point, v3, v1);
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hasNeg && hasPos);
  }

  // -------------------------------------------------------------------------
  // Keyboard navigation
  // -------------------------------------------------------------------------

  _selectMenuItem({
    key,
    target
  }) {
    const currentMenu = target.closest(SELECTOR_MENU) || this._menu;
    const items = SelectorEngine.find(SELECTOR_KB_NAV_ITEMS, currentMenu).filter(element => isVisible(element));
    if (!items.length) {
      return;
    }
    getNextActiveElement(items, target, key === ARROW_DOWN_KEY, !items.includes(target)).focus();
  }
  _handleSubmenuKeydown(event) {
    const {
      key,
      target
    } = event;
    const isRtl = isRTL();
    const enterKey = isRtl ? ARROW_LEFT_KEY : ARROW_RIGHT_KEY;
    const exitKey = isRtl ? ARROW_RIGHT_KEY : ARROW_LEFT_KEY;
    const submenuWrapper = target.closest(SELECTOR_SUBMENU);
    const isSubmenuTrigger = submenuWrapper && target.matches(SELECTOR_SUBMENU_TOGGLE);
    if (isSubmenuTrigger && (key === ENTER_KEY || key === SPACE_KEY || key === enterKey)) {
      event.preventDefault();
      event.stopPropagation();
      const submenu = SelectorEngine.findOne(SELECTOR_MENU, submenuWrapper);
      if (submenu) {
        this._closeSiblingSubmenus(submenuWrapper);
        this._openSubmenu(target, submenu, submenuWrapper);
        requestAnimationFrame(() => {
          const firstItem = SelectorEngine.findOne(SELECTOR_VISIBLE_ITEMS, submenu);
          if (firstItem) {
            firstItem.focus();
          }
        });
      }
      return true;
    }
    if (key === exitKey) {
      const currentMenu = target.closest(SELECTOR_MENU);
      const parentSubmenuWrapper = currentMenu?.closest(SELECTOR_SUBMENU);
      if (parentSubmenuWrapper) {
        event.preventDefault();
        event.stopPropagation();
        const parentTrigger = SelectorEngine.findOne(SELECTOR_SUBMENU_TOGGLE, parentSubmenuWrapper);
        this._closeSubmenu(currentMenu, parentSubmenuWrapper);
        if (parentTrigger) {
          parentTrigger.focus();
        }
        return true;
      }
    }
    if (key === HOME_KEY || key === END_KEY) {
      event.preventDefault();
      event.stopPropagation();
      const currentMenu = target.closest(SELECTOR_MENU);
      const items = SelectorEngine.find(SELECTOR_KB_NAV_ITEMS, currentMenu).filter(element => isVisible(element));
      if (items.length) {
        const targetItem = key === HOME_KEY ? items[0] : items.at(-1);
        targetItem.focus();
      }
      return true;
    }
    return false;
  }
  static clearMenus(event) {
    if (event.button === RIGHT_MOUSE_BUTTON || event.type === 'keyup' && event.key !== TAB_KEY) {
      return;
    }
    for (const instance of Menu._openInstances) {
      if (instance._config.autoClose === false) {
        continue;
      }
      const composedPath = event.composedPath();
      const isMenuTarget = composedPath.includes(instance._menu);
      if (composedPath.includes(instance._element) || instance._config.autoClose === 'inside' && !isMenuTarget || instance._config.autoClose === 'outside' && isMenuTarget) {
        continue;
      }
      if (instance._menu.contains(event.target) && (event.type === 'keyup' && event.key === TAB_KEY || /input|select|option|textarea|form/i.test(event.target.tagName))) {
        continue;
      }
      const relatedTarget = {
        relatedTarget: instance._element
      };
      if (event.type === 'click') {
        relatedTarget.clickEvent = event;
      }
      instance._completeHide(relatedTarget);
    }
  }
  static dataApiKeydownHandler(event) {
    const isInput = /input|textarea/i.test(event.target.tagName);
    const isEscapeEvent = event.key === ESCAPE_KEY;
    const isUpOrDownEvent = [ARROW_UP_KEY, ARROW_DOWN_KEY].includes(event.key);
    const isLeftOrRightEvent = [ARROW_LEFT_KEY, ARROW_RIGHT_KEY].includes(event.key);
    const isHomeOrEndEvent = [HOME_KEY, END_KEY].includes(event.key);
    const isEnterOrSpaceEvent = [ENTER_KEY, SPACE_KEY].includes(event.key);
    const isSubmenuTrigger = event.target.matches(SELECTOR_SUBMENU_TOGGLE);
    if (!isUpOrDownEvent && !isEscapeEvent && !isLeftOrRightEvent && !isHomeOrEndEvent && !(isEnterOrSpaceEvent && isSubmenuTrigger)) {
      return;
    }
    if (isInput && !isEscapeEvent) {
      return;
    }

    // Find the toggle button that owns the menu containing this event. The
    // common cases (toggle as prev/next sibling of the matched .menu, or
    // descendant of its parent) cover top-level menus. The walk-up fallback
    // covers events fired inside nested submenus, where `this` is the inner
    // .menu — its siblings are submenu content, not the toggle. We walk
    // through every enclosing .submenu to reach the outermost .menu, whose
    // prev sibling is the original toggle.
    let getToggleButton = this.matches(SELECTOR_DATA_TOGGLE) ? this : SelectorEngine.prev(this, SELECTOR_DATA_TOGGLE)[0] || SelectorEngine.next(this, SELECTOR_DATA_TOGGLE)[0] || SelectorEngine.findOne(SELECTOR_DATA_TOGGLE, event.delegateTarget.parentNode);
    if (!getToggleButton) {
      let rootMenu = this;
      let enclosingSubmenu = rootMenu.parentElement?.closest(SELECTOR_SUBMENU);
      while (enclosingSubmenu) {
        const enclosingMenu = enclosingSubmenu.closest(SELECTOR_MENU);
        if (!enclosingMenu || enclosingMenu === rootMenu) {
          break;
        }
        rootMenu = enclosingMenu;
        enclosingSubmenu = rootMenu.parentElement?.closest(SELECTOR_SUBMENU);
      }
      if (rootMenu !== this) {
        getToggleButton = SelectorEngine.prev(rootMenu, SELECTOR_DATA_TOGGLE)[0] || SelectorEngine.next(rootMenu, SELECTOR_DATA_TOGGLE)[0] || SelectorEngine.findOne(SELECTOR_DATA_TOGGLE, rootMenu.parentNode);
      }
      if (!getToggleButton) {
        return;
      }
    }
    const instance = Menu.getOrCreateInstance(getToggleButton);
    if ((isLeftOrRightEvent || isHomeOrEndEvent || isEnterOrSpaceEvent && isSubmenuTrigger) && instance._handleSubmenuKeydown(event)) {
      return;
    }
    if (isUpOrDownEvent) {
      event.preventDefault();
      event.stopPropagation();
      instance.show();
      instance._selectMenuItem(event);
      return;
    }
    if (isEscapeEvent && instance._isShown()) {
      event.preventDefault();
      event.stopPropagation();
      const currentMenu = event.target.closest(SELECTOR_MENU);
      const parentSubmenuWrapper = currentMenu?.closest(SELECTOR_SUBMENU);
      if (parentSubmenuWrapper && instance._openSubmenus.size > 0) {
        const parentTrigger = SelectorEngine.findOne(SELECTOR_SUBMENU_TOGGLE, parentSubmenuWrapper);
        instance._closeSubmenu(currentMenu, parentSubmenuWrapper);
        if (parentTrigger) {
          parentTrigger.focus();
        }
        return;
      }
      instance.hide();
      getToggleButton.focus();
    }
  }
}

/**
 * Data API implementation
 *
 * Note on duplicate registration: under bundlers like Karma+rollup, each
 * spec.js becomes its own bundle that re-runs this module's top-level code,
 * so handlers can be registered N times. `clearMenus` and the keydown handler
 * are safe to run N times — each operates only on its own bundle's
 * `Menu._openInstances` and `Menu.getOrCreateInstance(...)`, which keeps
 * spy-based tests on those statics working.
 *
 * The click toggle handler is NOT safe to run N times though: each invocation
 * flips `_isShown`, so N=2 reopens then immediately hides. The per-event
 * marker `_chassisMenuToggled` makes the toggle action run only once per
 * click while still letting every bundle's `Menu.getOrCreateInstance` fire
 * (which spy-based tests depend on).
 */

EventHandler.on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_DATA_TOGGLE, Menu.dataApiKeydownHandler);
EventHandler.on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_MENU, Menu.dataApiKeydownHandler);
EventHandler.on(document, EVENT_CLICK_DATA_API, Menu.clearMenus);
EventHandler.on(document, EVENT_KEYUP_DATA_API, Menu.clearMenus);
EventHandler.on(document, EVENT_CLICK_DATA_API, SELECTOR_DATA_TOGGLE, function (event) {
  event.preventDefault();
  const instance = Menu.getOrCreateInstance(this);
  if (event._chassisMenuToggled) {
    return;
  }
  event._chassisMenuToggled = true;
  instance.toggle();
});

export { Menu as default };
//# sourceMappingURL=menu.js.map
