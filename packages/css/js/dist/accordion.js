/*!
* Chassis accordion.js v0.11.1 (https://chassis-ui.com)
* Copyright 2026 Ozgur Gunes <o.gunes@gmail.com>
* Licensed under MIT (https://github.com/chassis-ui/css/raw/main/LICENSE)
*/
import BaseComponent from "./base-component.js";
import EventHandler from "./dom/event-handler.js";
import SelectorEngine from "./dom/selector-engine.js";
import { getTransitionDurationFromElement } from "./util/index.js";
// js/src/accordion.ts
/**
* --------------------------------------------------------------------------
* Chassis CSS accordion.ts
* Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
* --------------------------------------------------------------------------
*/
/**
* Constants
*/
const NAME = "accordion";
const EVENT_KEY = `.cx.accordion`;
const DATA_API_KEY = ".data-api";
const EVENT_OPEN = `open${EVENT_KEY}`;
const EVENT_OPENED = `opened${EVENT_KEY}`;
const EVENT_CLOSE = `close${EVENT_KEY}`;
const EVENT_CLOSED = `closed${EVENT_KEY}`;
const ATTR_CLONE = "data-cx-clone";
const SELECTOR_DETAILS = `[data-cx-accordion] > details:not([${ATTR_CLONE}])`;
const SELECTOR_SUMMARY = "summary";
const SELECTOR_CONTENT = ".accordion-body";
const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`;
const TRANSITION_END = "transitionend";
const DURATION_PADDING = 5;
/**
* Class definition
*/
var Accordion = class extends BaseComponent {
	static get NAME() {
		return NAME;
	}
	constructor(element, config) {
		super(element, config);
		this._summary = SelectorEngine.findOne(SELECTOR_SUMMARY, this._element);
		this._content = SelectorEngine.findOne(SELECTOR_CONTENT, this._element);
		this._isTransitioning = false;
		this._transition = null;
		if (!this._summary || !this._content) return;
		this._observer = this._createObserver();
		this._observer.observe(this._element, { attributes: true });
	}
	toggle() {
		if (this._element.open) this.close();
		else this.open();
	}
	open() {
		if (!this._summary || !this._content || this._transition?.opening) return;
		if (EventHandler.trigger(this._element, EVENT_OPEN).defaultPrevented) return;
		const element = this._element;
		const fromHeight = this._transition?.clone?.offsetHeight ?? this._summary.offsetHeight;
		this._dropTransition();
		element.style.overflow = "clip";
		element.style.height = `${fromHeight}px`;
		element.style.height = `${this._summary.offsetHeight + this._content.offsetHeight}px`;
		this._startTransition(true, null, () => {
			element.style.overflow = "";
			element.style.height = "";
			EventHandler.trigger(element, EVENT_OPENED);
		});
	}
	close() {
		if (!this._summary || !this._content || this._transition && !this._transition.opening) return;
		if (EventHandler.trigger(this._element, EVENT_CLOSE).defaultPrevented) return;
		const element = this._element;
		const fromHeight = this._transition ? element.offsetHeight : null;
		this._dropTransition();
		const clone = this._createClone(fromHeight);
		element.style.height = `${this._summary.offsetHeight + this._content.offsetHeight}px`;
		element.style.height = `${this._summary.offsetHeight}px`;
		this._startTransition(false, clone, () => {
			element.style.overflow = "";
			element.style.height = "";
			clone.remove();
			EventHandler.trigger(element, EVENT_CLOSED);
		});
	}
	dispose() {
		if (this._observer) this._observer.disconnect();
		super.dispose();
	}
	_createObserver() {
		return new MutationObserver((mutationsList) => {
			for (const mutation of mutationsList) if (mutation.attributeName === "open") {
				if (this._element.open) this.open();
				else this.close();
				break;
			}
		});
	}
	_startTransition(opening, clone, settle) {
		this._isTransitioning = true;
		this._transition = {
			opening,
			clone,
			cancel: this._afterTransition(this._element, () => {
				this._isTransitioning = false;
				this._transition = null;
				settle();
			})
		};
	}
	_dropTransition() {
		if (!this._transition) return;
		this._transition.cancel();
		this._transition.clone?.remove();
		this._transition = null;
		this._isTransitioning = false;
	}
	_afterTransition(element, callback) {
		let settled = false;
		const settle = () => {
			if (!settled) {
				settled = true;
				callback();
			}
		};
		const onTransitionEnd = ({ target }) => {
			if (target === element) {
				element.removeEventListener(TRANSITION_END, onTransitionEnd);
				settle();
			}
		};
		element.addEventListener(TRANSITION_END, onTransitionEnd);
		const timer = setTimeout(() => {
			element.removeEventListener(TRANSITION_END, onTransitionEnd);
			settle();
		}, getTransitionDurationFromElement(element) + DURATION_PADDING);
		return () => {
			settled = true;
			clearTimeout(timer);
			element.removeEventListener(TRANSITION_END, onTransitionEnd);
		};
	}
	_createClone(height = null) {
		const clone = this._element.cloneNode(true);
		clone.name = "";
		clone.open = true;
		clone.inert = true;
		clone.setAttribute(ATTR_CLONE, "");
		const cloneSummary = SelectorEngine.findOne(SELECTOR_SUMMARY, clone);
		this._element.before(clone);
		clone.style.overflow = "hidden";
		clone.style.position = "absolute";
		clone.style.background = "none";
		clone.style.border = "0";
		clone.style.width = `${this._element.offsetWidth}px`;
		clone.style.height = `${height ?? clone.offsetHeight}px`;
		cloneSummary.style.visibility = "hidden";
		clone.style.height = `${this._summary.offsetHeight}px`;
		return clone;
	}
};
/**
* Data API implementation
*/
EventHandler.on(document, EVENT_CLICK_DATA_API, SELECTOR_DETAILS, function() {
	Accordion.getOrCreateInstance(this);
	const name = this.getAttribute("name");
	if (name) for (const sibling of SelectorEngine.find(`details[name="${CSS.escape(name)}"]`, this.parentElement)) Accordion.getOrCreateInstance(sibling);
});
export { Accordion as default };

//# sourceMappingURL=accordion.js.map