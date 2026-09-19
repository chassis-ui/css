/*!
* Chassis button.js v0.5.0 (https://chassis-ui.com)
* Copyright 2026 Ozgur Gunes <o.gunes@gmail.com>
* Licensed under MIT (https://github.com/chassis-ui/css/raw/main/LICENSE)
*/
import BaseComponent from "./base-component.js";
import EventHandler from "./dom/event-handler.js";
import { setAriaAttribute } from "./util/index.js";
//#region js/src/button.ts
/**
* --------------------------------------------------------------------------
* Chassis CSS button.ts
* Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
* --------------------------------------------------------------------------
*/
/**
* Constants
*/
const NAME = "button";
const EVENT_KEY = `.cx.button`;
const DATA_API_KEY = ".data-api";
const CLASS_NAME_ACTIVE = "active";
const SELECTOR_DATA_TOGGLE = "[data-cx-toggle=\"button\"]";
const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`;
/**
* Class definition
*/
var Button = class extends BaseComponent {
	static get NAME() {
		return NAME;
	}
	toggle() {
		setAriaAttribute(this._element, "aria-pressed", this._element.classList.toggle(CLASS_NAME_ACTIVE));
	}
};
/**
* Data API implementation
*/
EventHandler.on(document, EVENT_CLICK_DATA_API, SELECTOR_DATA_TOGGLE, (event) => {
	event.preventDefault();
	const button = event.target.closest(SELECTOR_DATA_TOGGLE);
	Button.getOrCreateInstance(button).toggle();
});
//#endregion
export { Button as default };

//# sourceMappingURL=button.js.map