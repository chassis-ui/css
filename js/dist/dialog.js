/*!
* Chassis dialog.js v0.5.2 (https://chassis-ui.com)
* Copyright 2026 Ozgur Gunes <o.gunes@gmail.com>
* Licensed under MIT (https://github.com/chassis-ui/css/raw/main/LICENSE)
*/
import DialogBase from "./dialog-base.js";
import EventHandler from "./dom/event-handler.js";
import Manipulator from "./dom/manipulator.js";
import SelectorEngine from "./dom/selector-engine.js";
import { enableDismissTrigger } from "./util/component-functions.js";
import { preventNavigationForAnchor } from "./util/index.js";
//#region js/src/dialog.ts
/**
* --------------------------------------------------------------------------
* Chassis CSS dialog.ts
* Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
* --------------------------------------------------------------------------
*/
/**
* Constants
*/
const NAME = "dialog";
const EVENT_KEY = `.cx.dialog`;
const DATA_API_KEY = ".data-api";
const EVENT_SHOW = `show${EVENT_KEY}`;
const EVENT_HIDDEN = `hidden${EVENT_KEY}`;
const EVENT_CANCEL = `cancel${EVENT_KEY}`;
const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`;
const CLASS_NAME_NONMODAL = "nonmodal";
const CLASS_NAME_INSTANT = "instant";
const CLASS_NAME_SWAP_IN = "swap-in";
const SELECTOR_DATA_TOGGLE = "[data-cx-toggle=\"dialog\"]";
const Default = {
	backdrop: true,
	keyboard: true,
	modal: true
};
const DefaultType = {
	backdrop: "(boolean|string)",
	keyboard: "boolean",
	modal: "boolean"
};
/**
* Class definition
*/
var Dialog = class extends DialogBase {
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
	handleUpdate() {}
	_getShowOptions() {
		return {
			modal: this._config.modal,
			preventBodyScroll: this._config.modal
		};
	}
	_onBeforeShow() {
		if (!this._config.modal) this._element.classList.add(CLASS_NAME_NONMODAL);
	}
	_onAfterHide() {
		this._element.classList.remove(CLASS_NAME_NONMODAL);
	}
	_onCancel() {
		EventHandler.trigger(this._element, EVENT_CANCEL);
	}
};
/**
* Data API implementation
*/
EventHandler.on(document, EVENT_CLICK_DATA_API, SELECTOR_DATA_TOGGLE, function(event) {
	const target = SelectorEngine.getElementFromSelector(this);
	preventNavigationForAnchor(event, this);
	if (!target) return;
	EventHandler.one(target, EVENT_SHOW, (showEvent) => {
		if (showEvent.defaultPrevented) return;
		Dialog.restoreFocusOnHide(target, this);
	});
	const config = Manipulator.getDataAttributes(this);
	const currentDialog = this.closest("dialog[open]");
	if (currentDialog && currentDialog !== target) {
		const newDialog = Dialog.getOrCreateInstance(target, config);
		target.classList.add(CLASS_NAME_SWAP_IN);
		newDialog.show(this);
		EventHandler.one(target, `shown${EVENT_KEY}`, () => {
			target.classList.remove(CLASS_NAME_SWAP_IN);
		});
		const currentInstance = Dialog.getInstance(currentDialog);
		if (currentInstance) {
			currentDialog.classList.add(CLASS_NAME_INSTANT);
			EventHandler.one(currentDialog, EVENT_HIDDEN, () => {
				currentDialog.classList.remove(CLASS_NAME_INSTANT);
			});
			currentInstance.hide();
		}
		return;
	}
	Dialog.getOrCreateInstance(target, config).toggle(this);
});
enableDismissTrigger(Dialog);
//#endregion
export { Dialog as default };

//# sourceMappingURL=dialog.js.map