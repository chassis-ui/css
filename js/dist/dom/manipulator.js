/*!
  * Chassis manipulator.js v0.1.0 (https://chassis-ui.com)
  * Copyright 2026 Ozgur Gunes <o.gunes@gmail.com>
  * Licensed under MIT (https://github.com/chassis-ui/css/raw/main/LICENSE)
  */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Manipulator = factory());
})(this, (function () { 'use strict';

  /**
   * --------------------------------------------------------------------------
   * Chassis - CSS dom/manipulator.js
   * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */

  function normalizeData(value) {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    if (value === Number(value).toString()) {
      return Number(value);
    }
    if (value === '' || value === 'null') {
      return null;
    }
    if (typeof value !== 'string') {
      return value;
    }
    try {
      return JSON.parse(decodeURIComponent(value));
    } catch {
      return value;
    }
  }
  function normalizeDataKey(key) {
    return key.replace(/[A-Z]/g, chr => `-${chr.toLowerCase()}`);
  }
  const Manipulator = {
    setDataAttribute(element, key, value) {
      element.setAttribute(`data-cx-${normalizeDataKey(key)}`, value);
    },
    removeDataAttribute(element, key) {
      element.removeAttribute(`data-cx-${normalizeDataKey(key)}`);
    },
    getDataAttributes(element) {
      if (!element) {
        return {};
      }
      const attributes = {};
      const cxKeys = Object.keys(element.dataset).filter(key => key.startsWith('cx') && !key.startsWith('cxConfig'));
      for (const key of cxKeys) {
        let pureKey = key.replace(/^cx/, '');
        pureKey = pureKey.charAt(0).toLowerCase() + pureKey.slice(1);
        attributes[pureKey] = normalizeData(element.dataset[key]);
      }
      return attributes;
    },
    getDataAttribute(element, key) {
      return normalizeData(element.getAttribute(`data-cx-${normalizeDataKey(key)}`));
    }
  };

  return Manipulator;

}));
//# sourceMappingURL=manipulator.js.map
