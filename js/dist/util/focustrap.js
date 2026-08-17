/*!
* Chassis focustrap.js v0.3.5 (https://chassis-ui.com)
* Copyright 2026 Ozgur Gunes <o.gunes@gmail.com>
* Licensed under MIT (https://github.com/chassis-ui/css/raw/main/LICENSE)
*/
import EventHandler from "../dom/event-handler.js";
import SelectorEngine from "../dom/selector-engine.js";
import Config from "./config.js";
//#region js/src/util/focustrap.ts
/**
* --------------------------------------------------------------------------
* Chassis CSS util/focustrap.ts
* Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
* --------------------------------------------------------------------------
*/
/**
* Constants
*/
const NAME = "focustrap";
const EVENT_KEY = `.cx.focustrap`;
const EVENT_FOCUSIN = `focusin${EVENT_KEY}`;
const EVENT_KEYDOWN_TAB = `keydown.tab${EVENT_KEY}`;
const TAB_KEY = "Tab";
const TAB_NAV_FORWARD = "forward";
const TAB_NAV_BACKWARD = "backward";
const Default = {
	autofocus: true,
	trapElement: null
};
const DefaultType = {
	autofocus: "boolean",
	trapElement: "element"
};
/**
* Class definition
*/
var FocusTrap = class extends Config {
	constructor(config) {
		super();
		this._config = this._getConfig(config);
		this._isActive = false;
		this._lastTabNavDirection = null;
	}
	static get Default() {
		return Default;
	}
	static get DefaultType() {
		return DefaultType;
	}
	static get NAME() {
		return NAME;
	}
	activate() {
		if (this._isActive) return;
		if (this._config.autofocus) this._config.trapElement.focus();
		EventHandler.off(document, EVENT_KEY);
		EventHandler.on(document, EVENT_FOCUSIN, (event) => this._handleFocusin(event));
		EventHandler.on(document, EVENT_KEYDOWN_TAB, (event) => this._handleKeydown(event));
		this._isActive = true;
	}
	deactivate() {
		if (!this._isActive) return;
		this._isActive = false;
		EventHandler.off(document, EVENT_KEY);
	}
	_handleFocusin(event) {
		const { trapElement } = this._config;
		if (event.target === document || event.target === trapElement || trapElement.contains(event.target)) return;
		const elements = SelectorEngine.focusableChildren(trapElement);
		if (elements.length === 0) trapElement.focus();
		else if (this._lastTabNavDirection === TAB_NAV_BACKWARD) elements.at(-1).focus();
		else elements[0].focus();
	}
	_handleKeydown(event) {
		if (event.key !== TAB_KEY) return;
		this._lastTabNavDirection = event.shiftKey ? TAB_NAV_BACKWARD : TAB_NAV_FORWARD;
	}
};
//#endregion
export { FocusTrap as default };

//# sourceMappingURL=focustrap.js.map