/*!
* Chassis notification.js v0.4.0-0 (https://chassis-ui.com)
* Copyright 2026 Ozgur Gunes <o.gunes@gmail.com>
* Licensed under MIT (https://github.com/chassis-ui/css/raw/main/LICENSE)
*/
import BaseComponent from "./base-component.js";
import EventHandler from "./dom/event-handler.js";
import { enableDismissTrigger } from "./util/component-functions.js";
//#region js/src/notification.ts
/**
* --------------------------------------------------------------------------
* Chassis CSS notification.ts
* Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
* --------------------------------------------------------------------------
*/
/**
* Constants
*/
const NAME = "notification";
const EVENT_KEY = `.cx.notification`;
const EVENT_CLOSE = `close${EVENT_KEY}`;
const EVENT_CLOSED = `closed${EVENT_KEY}`;
const CLASS_NAME_FADE = "fade";
const CLASS_NAME_SHOW = "show";
/**
* Class definition
*/
var Notification = class extends BaseComponent {
	static get NAME() {
		return NAME;
	}
	close() {
		if (EventHandler.trigger(this._element, EVENT_CLOSE).defaultPrevented) return;
		this._element.classList.remove(CLASS_NAME_SHOW);
		const isAnimated = this._element.classList.contains(CLASS_NAME_FADE);
		this._queueCallback(() => this._destroyElement(), this._element, isAnimated);
	}
	_destroyElement() {
		this._element.remove();
		EventHandler.trigger(this._element, EVENT_CLOSED);
		this.dispose();
	}
};
/**
* Data API implementation
*/
enableDismissTrigger(Notification, "close");
//#endregion
export { Notification as default };

//# sourceMappingURL=notification.js.map