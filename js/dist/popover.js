/*!
* Chassis popover.js v0.4.0-0 (https://chassis-ui.com)
* Copyright 2026 Ozgur Gunes <o.gunes@gmail.com>
* Licensed under MIT (https://github.com/chassis-ui/css/raw/main/LICENSE)
*/
import Tooltip from "./tooltip.js";
import EventHandler from "./dom/event-handler.js";
//#region js/src/popover.ts
/**
* --------------------------------------------------------------------------
* Chassis CSS popover.ts
* Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
* --------------------------------------------------------------------------
*/
/**
* Constants
*/
const NAME = "popover";
const SELECTOR_TITLE = ".popover-header";
const SELECTOR_CONTENT = ".popover-body";
const SELECTOR_DATA_TOGGLE = "[data-cx-toggle=\"popover\"]";
const EVENT_CLICK = "click";
const EVENT_FOCUSIN = "focusin";
const EVENT_MOUSEENTER = "mouseenter";
const Default = {
	...Tooltip.Default,
	content: "",
	offset: [0, 8],
	placement: "right",
	template: "<div class=\"popover\" role=\"tooltip\"><div class=\"popover-arrow\"></div><h3 class=\"popover-header\"></h3><div class=\"popover-body\"></div></div>",
	trigger: "click"
};
const DefaultType = {
	...Tooltip.DefaultType,
	content: "(null|string|element|function)"
};
/**
* Class definition
*/
var Popover = class extends Tooltip {
	constructor(element, config) {
		super(element, config);
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
	_isWithContent() {
		return Boolean(this._getTitle() || this._getContent());
	}
	_getContentForTemplate() {
		return {
			[SELECTOR_TITLE]: this._getTitle(),
			[SELECTOR_CONTENT]: this._getContent()
		};
	}
	_getContent() {
		return this._resolvePossibleFunction(this._config.content);
	}
};
/**
* Data API implementation - auto-initialize popovers
*/
const initPopover = (event) => {
	const target = event.target.closest(SELECTOR_DATA_TOGGLE);
	if (!target) return;
	if (event.type === "click") event.preventDefault();
	Popover.getOrCreateInstance(target);
};
EventHandler.on(document, EVENT_CLICK, SELECTOR_DATA_TOGGLE, initPopover);
EventHandler.on(document, EVENT_FOCUSIN, SELECTOR_DATA_TOGGLE, initPopover);
EventHandler.on(document, EVENT_MOUSEENTER, SELECTOR_DATA_TOGGLE, initPopover);
//#endregion
export { Popover as default };

//# sourceMappingURL=popover.js.map