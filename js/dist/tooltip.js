/*!
* Chassis tooltip.js v0.4.0-0 (https://chassis-ui.com)
* Copyright 2026 Ozgur Gunes <o.gunes@gmail.com>
* Licensed under MIT (https://github.com/chassis-ui/css/raw/main/LICENSE)
*/
import { autoUpdate, computePosition } from "@floating-ui/dom";
import FloatingBase from "./floating-base.js";
import EventHandler from "./dom/event-handler.js";
import Manipulator from "./dom/manipulator.js";
import { execute, findShadowRoot, getElement, getUID, isRTL, noop } from "./util/index.js";
import { DefaultAllowlist } from "./util/sanitizer.js";
import TemplateFactory from "./util/template-factory.js";
//#region js/src/tooltip.ts
/**
* --------------------------------------------------------------------------
* Chassis CSS tooltip.ts
* Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
* --------------------------------------------------------------------------
*/
/**
* Constants
*/
const NAME = "tooltip";
const DISALLOWED_ATTRIBUTES = /* @__PURE__ */ new Set([
	"sanitize",
	"allowList",
	"sanitizeFn"
]);
const CLASS_NAME_FADE = "fade";
const CLASS_NAME_MODAL = "modal";
const CLASS_NAME_SHOW = "show";
const SELECTOR_TOOLTIP_INNER = ".tooltip-inner";
const SELECTOR_MODAL = `.${CLASS_NAME_MODAL}`;
const SELECTOR_DATA_TOGGLE = "[data-cx-toggle=\"tooltip\"]";
const EVENT_MODAL_HIDE = "hide.cx.modal";
const TRIGGER_HOVER = "hover";
const TRIGGER_FOCUS = "focus";
const TRIGGER_CLICK = "click";
const TRIGGER_MANUAL = "manual";
const EVENT_HIDE = "hide";
const EVENT_HIDDEN = "hidden";
const EVENT_SHOW = "show";
const EVENT_SHOWN = "shown";
const EVENT_INSERTED = "inserted";
const EVENT_CLICK = "click";
const EVENT_FOCUSIN = "focusin";
const EVENT_FOCUSOUT = "focusout";
const EVENT_MOUSEENTER = "mouseenter";
const EVENT_MOUSELEAVE = "mouseleave";
const Default = {
	allowList: DefaultAllowlist,
	animation: true,
	boundary: "clippingParents",
	container: false,
	customClass: "",
	delay: 0,
	fallbackPlacements: [
		"top",
		"right",
		"bottom",
		"left"
	],
	html: false,
	offset: [0, 6],
	placement: "top",
	floatingConfig: null,
	sanitize: true,
	sanitizeFn: null,
	selector: false,
	template: "<div class=\"tooltip\" role=\"tooltip\"><div class=\"tooltip-arrow\"></div><div class=\"tooltip-inner\"></div></div>",
	title: "",
	trigger: "hover focus"
};
const DefaultType = {
	allowList: "object",
	animation: "boolean",
	boundary: "(string|element)",
	container: "(string|element|boolean)",
	customClass: "(string|function)",
	delay: "(number|object)",
	fallbackPlacements: "array",
	html: "boolean",
	offset: "(array|string|function)",
	placement: "(string|function)",
	floatingConfig: "(null|object|function)",
	sanitize: "boolean",
	sanitizeFn: "(null|function)",
	selector: "(string|boolean)",
	template: "string",
	title: "(string|element|function)",
	trigger: "string"
};
/**
* Class definition
*/
var Tooltip = class extends FloatingBase {
	constructor(element, config) {
		if (typeof computePosition === "undefined") throw new TypeError("Chassis CSS's tooltips require Floating UI (https://floating-ui.com)");
		super(element, config);
		this._isEnabled = true;
		this._timeout = 0;
		this._isHovered = null;
		this._activeTrigger = {};
		this._templateFactory = null;
		this._newContent = null;
		this.tip = null;
		this._parseResponsivePlacements();
		this._setListeners();
		if (!this._config.selector) this._fixTitle();
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
	enable() {
		this._isEnabled = true;
	}
	disable() {
		this._isEnabled = false;
	}
	toggleEnabled() {
		this._isEnabled = !this._isEnabled;
	}
	toggle() {
		if (!this._isEnabled) return;
		if (this._isShown()) {
			this._leave();
			return;
		}
		this._enter();
	}
	dispose() {
		clearTimeout(this._timeout);
		EventHandler.off(this._element.closest(SELECTOR_MODAL), EVENT_MODAL_HIDE, this._hideModalHandler);
		if (this._element.getAttribute("data-cx-original-title")) this._element.setAttribute("title", this._element.getAttribute("data-cx-original-title"));
		this._disposeFloating();
		this._disposeMediaQueryListeners();
		super.dispose();
	}
	show() {
		if (this._element.style.display === "none") throw new Error("Please use show on visible elements");
		return this._show();
	}
	async _show() {
		if (!(this._isWithContent() && this._isEnabled)) return;
		const showEvent = EventHandler.trigger(this._element, this.constructor.eventName(EVENT_SHOW));
		const isInTheDom = (findShadowRoot(this._element) || this._element.ownerDocument.documentElement).contains(this._element);
		if (showEvent.defaultPrevented || !isInTheDom) return;
		this._disposeFloating();
		const tip = this._getTipElement();
		this._element.setAttribute("aria-describedby", tip.getAttribute("id"));
		let { container } = this._config;
		const closestDialog = this._element.closest("dialog[open]");
		if (closestDialog && container === document.body) container = closestDialog;
		if (!this._element.ownerDocument.documentElement.contains(this.tip)) {
			container.append(tip);
			EventHandler.trigger(this._element, this.constructor.eventName(EVENT_INSERTED));
		}
		await this._createFloating(tip);
		tip.classList.add(CLASS_NAME_SHOW);
		if ("ontouchstart" in document.documentElement) for (const element of document.body.children) EventHandler.on(element, "mouseover", noop);
		const complete = () => {
			EventHandler.trigger(this._element, this.constructor.eventName(EVENT_SHOWN));
			if (this._isHovered === false) this._leave();
			this._isHovered = false;
		};
		this._queueCallback(complete, this.tip, this._isAnimated());
	}
	hide() {
		if (!this._isShown()) return;
		if (EventHandler.trigger(this._element, this.constructor.eventName(EVENT_HIDE)).defaultPrevented) return;
		this._getTipElement().classList.remove(CLASS_NAME_SHOW);
		if ("ontouchstart" in document.documentElement) for (const element of document.body.children) EventHandler.off(element, "mouseover", noop);
		this._activeTrigger[TRIGGER_CLICK] = false;
		this._activeTrigger[TRIGGER_FOCUS] = false;
		this._activeTrigger[TRIGGER_HOVER] = false;
		this._isHovered = null;
		const complete = () => {
			if (this._isWithActiveTrigger()) return;
			if (!this._isHovered) this._disposeFloating();
			this._element.removeAttribute("aria-describedby");
			EventHandler.trigger(this._element, this.constructor.eventName(EVENT_HIDDEN));
		};
		this._queueCallback(complete, this.tip, this._isAnimated());
	}
	update() {
		if (this._floatingCleanup && this.tip) this._updateFloatingPosition();
	}
	_isWithContent() {
		return Boolean(this._getTitle());
	}
	_getTipElement() {
		if (!this.tip) this.tip = this._createTipElement(this._newContent || this._getContentForTemplate());
		return this.tip;
	}
	_createTipElement(content) {
		const tip = this._getTemplateFactory(content).toHtml();
		tip.classList.remove(CLASS_NAME_FADE, CLASS_NAME_SHOW);
		tip.classList.add(`cx-${this.constructor.NAME}-auto`);
		const tipId = getUID(this.constructor.NAME).toString();
		tip.setAttribute("id", tipId);
		if (this._isAnimated()) tip.classList.add(CLASS_NAME_FADE);
		return tip;
	}
	setContent(content) {
		this._newContent = content;
		if (this._isShown()) {
			this._disposeFloating();
			this.show();
		}
	}
	_getTemplateFactory(content) {
		if (this._templateFactory) this._templateFactory.changeContent(content);
		else this._templateFactory = new TemplateFactory({
			...this._config,
			content,
			extraClass: this._resolvePossibleFunction(this._config.customClass)
		});
		return this._templateFactory;
	}
	_getContentForTemplate() {
		return { [SELECTOR_TOOLTIP_INNER]: this._getTitle() };
	}
	_getTitle() {
		return this._resolvePossibleFunction(this._config.title) || this._element.getAttribute("data-cx-original-title");
	}
	_initializeOnDelegatedTarget(event) {
		return this.constructor.getOrCreateInstance(event.delegateTarget, this._getDelegateConfig());
	}
	_isAnimated() {
		return this._config.animation || this.tip !== null && this.tip.classList.contains(CLASS_NAME_FADE);
	}
	_isShown() {
		return Boolean(this.tip && this.tip.classList.contains(CLASS_NAME_SHOW));
	}
	_getPlacement(tip) {
		const toPhysical = (placement) => {
			const rtl = isRTL();
			switch (String(placement).toLowerCase()) {
				case "start": return rtl ? "right" : "left";
				case "end": return rtl ? "left" : "right";
				default: return String(placement).toLowerCase();
			}
		};
		if (this._responsivePlacements) return toPhysical(this._getResponsivePlacement());
		return toPhysical(execute(this._config.placement, [
			this,
			tip,
			this._element
		]));
	}
	_getDefaultPlacement() {
		return "top";
	}
	async _createFloating(tip) {
		const placement = this._getPlacement(tip);
		const arrowElement = tip.querySelector(`.${this.constructor.NAME}-arrow`);
		await this._updateFloatingPosition(tip, placement, arrowElement);
		this._floatingCleanup = autoUpdate(this._element, tip, () => this._updateFloatingPosition(tip, null, arrowElement));
	}
	async _updateFloatingPosition(tip = this.tip, placement = null, arrowElement = null) {
		if (!tip) return;
		if (!placement) placement = this._getPlacement(tip);
		if (!arrowElement) arrowElement = tip.querySelector(`.${this.constructor.NAME}-arrow`);
		const middleware = this._getFloatingMiddleware(arrowElement);
		const floatingConfig = this._getFloatingConfig(placement, middleware);
		const { x, y, placement: finalPlacement, middlewareData } = await computePosition(this._element, tip, floatingConfig);
		Object.assign(tip.style, {
			position: "absolute",
			left: `${x}px`,
			top: `${y}px`
		});
		if (arrowElement) arrowElement.style.position = "absolute";
		Manipulator.setDataAttribute(tip, "placement", finalPlacement);
		if (arrowElement && middlewareData.arrow) {
			const { x: arrowX, y: arrowY } = middlewareData.arrow;
			const isVertical = finalPlacement.startsWith("top") || finalPlacement.startsWith("bottom");
			Object.assign(arrowElement.style, {
				left: isVertical && arrowX !== null ? `${arrowX}px` : "",
				top: !isVertical && arrowY !== null ? `${arrowY}px` : "",
				right: "",
				bottom: ""
			});
		}
	}
	_resolvePossibleFunction(arg) {
		return execute(arg, [this._element, this._element]);
	}
	_setListeners() {
		const triggers = this._config.trigger.split(" ");
		for (const trigger of triggers) if (trigger === "click") EventHandler.on(this._element, this.constructor.eventName(EVENT_CLICK), this._config.selector, (event) => {
			const context = this._initializeOnDelegatedTarget(event);
			context._activeTrigger[TRIGGER_CLICK] = !(context._isShown() && context._activeTrigger[TRIGGER_CLICK]);
			context.toggle();
		});
		else if (trigger !== TRIGGER_MANUAL) {
			const eventIn = trigger === TRIGGER_HOVER ? this.constructor.eventName(EVENT_MOUSEENTER) : this.constructor.eventName(EVENT_FOCUSIN);
			const eventOut = trigger === TRIGGER_HOVER ? this.constructor.eventName(EVENT_MOUSELEAVE) : this.constructor.eventName(EVENT_FOCUSOUT);
			EventHandler.on(this._element, eventIn, this._config.selector, (event) => {
				const context = this._initializeOnDelegatedTarget(event);
				context._activeTrigger[event.type === "focusin" ? TRIGGER_FOCUS : TRIGGER_HOVER] = true;
				context._enter();
			});
			EventHandler.on(this._element, eventOut, this._config.selector, (event) => {
				const context = this._initializeOnDelegatedTarget(event);
				context._activeTrigger[event.type === "focusout" ? TRIGGER_FOCUS : TRIGGER_HOVER] = context._element.contains(event.relatedTarget);
				context._leave();
			});
		}
		this._hideModalHandler = () => {
			if (this._element) this.hide();
		};
		EventHandler.on(this._element.closest(SELECTOR_MODAL), EVENT_MODAL_HIDE, this._hideModalHandler);
	}
	_fixTitle() {
		const title = this._element.getAttribute("title");
		if (!title) return;
		if (!this._element.getAttribute("aria-label") && !this._element.textContent.trim()) this._element.setAttribute("aria-label", title);
		this._element.setAttribute("data-cx-original-title", title);
		this._element.removeAttribute("title");
	}
	_enter() {
		if (this._isShown() || this._isHovered) {
			this._isHovered = true;
			return;
		}
		this._isHovered = true;
		this._setTimeout(() => {
			if (this._isHovered) this.show();
		}, this._config.delay.show);
	}
	_leave() {
		if (this._isWithActiveTrigger()) return;
		this._isHovered = false;
		this._setTimeout(() => {
			if (!this._isHovered) this.hide();
		}, this._config.delay.hide);
	}
	_setTimeout(handler, timeout) {
		clearTimeout(this._timeout);
		this._timeout = setTimeout(handler, timeout);
	}
	_isWithActiveTrigger() {
		return Object.values(this._activeTrigger).includes(true);
	}
	_excludedConfigKeys() {
		return [...DISALLOWED_ATTRIBUTES];
	}
	_configAfterMerge(config) {
		config.container = config.container === false ? document.body : getElement(config.container);
		if (typeof config.delay === "number") config.delay = {
			show: config.delay,
			hide: config.delay
		};
		if (typeof config.title === "number") config.title = config.title.toString();
		if (typeof config.content === "number") config.content = config.content.toString();
		return config;
	}
	_getDelegateConfig() {
		const config = {};
		for (const [key, value] of Object.entries(this._config)) if (this.constructor.Default[key] !== value) config[key] = value;
		config.selector = false;
		config.trigger = "manual";
		return config;
	}
	_disposeFloating() {
		super._disposeFloating();
		if (this.tip) {
			this.tip.remove();
			this.tip = null;
		}
	}
};
/**
* Data API implementation - auto-initialize tooltips
*/
const initTooltip = (event) => {
	const target = event.target.closest(SELECTOR_DATA_TOGGLE);
	if (!target) return;
	Tooltip.getOrCreateInstance(target);
};
EventHandler.on(document, EVENT_FOCUSIN, SELECTOR_DATA_TOGGLE, initTooltip);
EventHandler.on(document, EVENT_MOUSEENTER, SELECTOR_DATA_TOGGLE, initTooltip);
//#endregion
export { Tooltip as default };

//# sourceMappingURL=tooltip.js.map