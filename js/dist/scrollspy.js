/*!
* Chassis scrollspy.js v0.5.0 (https://chassis-ui.com)
* Copyright 2026 Ozgur Gunes <o.gunes@gmail.com>
* Licensed under MIT (https://github.com/chassis-ui/css/raw/main/LICENSE)
*/
import BaseComponent from "./base-component.js";
import EventHandler from "./dom/event-handler.js";
import SelectorEngine from "./dom/selector-engine.js";
import { getElement, isDisabled, isVisible } from "./util/index.js";
//#region js/src/scrollspy.ts
/**
* --------------------------------------------------------------------------
* Chassis CSS scrollspy.ts
* Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
* --------------------------------------------------------------------------
*/
/**
* Constants
*/
const NAME = "scrollspy";
const EVENT_KEY = `.cx.scrollspy`;
const DATA_API_KEY = ".data-api";
const EVENT_ACTIVATE = `activate${EVENT_KEY}`;
const EVENT_CLICK = `click${EVENT_KEY}`;
const EVENT_LOAD_DATA_API = `load${EVENT_KEY}${DATA_API_KEY}`;
const CLASS_NAME_MENU_ITEM = "menu-item";
const CLASS_NAME_ACTIVE = "active";
const SELECTOR_DATA_SPY = "[data-cx-spy=\"scroll\"]";
const SELECTOR_TARGET_LINKS = "[href]";
const SELECTOR_NAV_LIST_GROUP = ".nav, .list-group";
const SELECTOR_NAV_LINKS = ".nav-link";
const SELECTOR_LINK_ITEMS = `${SELECTOR_NAV_LINKS}, .nav-item > ${SELECTOR_NAV_LINKS}, .list-item`;
const SELECTOR_MENU_TOGGLE = "[data-cx-toggle=\"menu\"]";
const Default = {
	rootMargin: "0px 0px -25%",
	smoothScroll: false,
	target: null,
	threshold: [
		.1,
		.5,
		1
	]
};
const DefaultType = {
	rootMargin: "string",
	smoothScroll: "boolean",
	target: "element",
	threshold: "array"
};
/**
* Class definition
*/
var ScrollSpy = class extends BaseComponent {
	constructor(element, config) {
		super(element, config);
		this._targetLinks = /* @__PURE__ */ new Map();
		this._observableSections = /* @__PURE__ */ new Map();
		this._rootElement = getComputedStyle(this._element).overflowY === "visible" ? null : this._element;
		this._activeTarget = null;
		this._observer = null;
		this._previousScrollData = {
			visibleEntryTop: 0,
			parentScrollTop: 0
		};
		this.refresh();
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
	refresh() {
		this._initializeTargetsAndObservables();
		this._maybeEnableSmoothScroll();
		if (this._observer) this._observer.disconnect();
		else this._observer = this._getNewObserver();
		for (const section of this._observableSections.values()) this._observer.observe(section);
	}
	dispose() {
		this._observer.disconnect();
		super.dispose();
	}
	_configAfterMerge(config) {
		config.target = getElement(config.target) || document.body;
		if (typeof config.threshold === "string") config.threshold = config.threshold.split(",").map((value) => Number.parseFloat(value));
		return config;
	}
	_maybeEnableSmoothScroll() {
		if (!this._config.smoothScroll) return;
		EventHandler.off(this._config.target, EVENT_CLICK);
		EventHandler.on(this._config.target, EVENT_CLICK, SELECTOR_TARGET_LINKS, (event) => {
			const observableSection = this._observableSections.get(event.target.hash);
			if (observableSection) {
				event.preventDefault();
				const root = this._rootElement || window;
				const height = observableSection.offsetTop - this._element.offsetTop;
				if (root.scrollTo) {
					root.scrollTo({
						top: height,
						behavior: "smooth"
					});
					return;
				}
				root.scrollTop = height;
			}
		});
	}
	_getNewObserver() {
		const options = {
			root: this._rootElement,
			threshold: this._config.threshold,
			rootMargin: this._config.rootMargin
		};
		return new IntersectionObserver((entries) => this._observerCallback(entries), options);
	}
	_observerCallback(entries) {
		const targetElement = (entry) => this._targetLinks.get(`#${entry.target.id}`);
		const activate = (entry) => {
			this._previousScrollData.visibleEntryTop = entry.target.offsetTop;
			this._process(targetElement(entry));
		};
		const parentScrollTop = (this._rootElement || document.documentElement).scrollTop;
		const userScrollsDown = parentScrollTop >= this._previousScrollData.parentScrollTop;
		this._previousScrollData.parentScrollTop = parentScrollTop;
		for (const entry of entries) {
			if (!entry.isIntersecting) {
				this._activeTarget = null;
				this._clearActiveClass(targetElement(entry));
				continue;
			}
			const entryIsLowerThanPrevious = entry.target.offsetTop >= this._previousScrollData.visibleEntryTop;
			if (userScrollsDown && entryIsLowerThanPrevious) {
				activate(entry);
				if (!parentScrollTop) return;
				continue;
			}
			if (!userScrollsDown && !entryIsLowerThanPrevious) activate(entry);
		}
	}
	_initializeTargetsAndObservables() {
		this._targetLinks = /* @__PURE__ */ new Map();
		this._observableSections = /* @__PURE__ */ new Map();
		const targetLinks = SelectorEngine.find(SELECTOR_TARGET_LINKS, this._config.target);
		for (const anchor of targetLinks) {
			if (!anchor.hash || isDisabled(anchor)) continue;
			const observableSection = SelectorEngine.findOne(decodeURI(anchor.hash), this._element);
			if (isVisible(observableSection)) {
				this._targetLinks.set(decodeURI(anchor.hash), anchor);
				this._observableSections.set(anchor.hash, observableSection);
			}
		}
	}
	_process(target) {
		if (this._activeTarget === target) return;
		this._clearActiveClass(this._config.target);
		this._activeTarget = target;
		target.classList.add(CLASS_NAME_ACTIVE);
		this._activateParents(target);
		EventHandler.trigger(this._element, EVENT_ACTIVATE, { relatedTarget: target });
	}
	_activateParents(target) {
		if (target.classList.contains(CLASS_NAME_MENU_ITEM)) {
			const menuToggle = target.closest(".menu")?.previousElementSibling;
			if (menuToggle?.matches(SELECTOR_MENU_TOGGLE)) menuToggle.classList.add(CLASS_NAME_ACTIVE);
			return;
		}
		for (const listGroup of SelectorEngine.parents(target, SELECTOR_NAV_LIST_GROUP)) for (const item of SelectorEngine.prev(listGroup, SELECTOR_LINK_ITEMS)) item.classList.add(CLASS_NAME_ACTIVE);
	}
	_clearActiveClass(parent) {
		parent.classList.remove(CLASS_NAME_ACTIVE);
		const activeNodes = SelectorEngine.find(`${SELECTOR_TARGET_LINKS}.${CLASS_NAME_ACTIVE}`, parent);
		for (const node of activeNodes) node.classList.remove(CLASS_NAME_ACTIVE);
	}
};
/**
* Data API implementation
*/
EventHandler.on(window, EVENT_LOAD_DATA_API, () => {
	for (const spy of SelectorEngine.find(SELECTOR_DATA_SPY)) ScrollSpy.getOrCreateInstance(spy);
});
//#endregion
export { ScrollSpy as default };

//# sourceMappingURL=scrollspy.js.map