/*!
* Chassis floating-base.js v0.3.5 (https://chassis-ui.com)
* Copyright 2026 Ozgur Gunes <o.gunes@gmail.com>
* Licensed under MIT (https://github.com/chassis-ui/css/raw/main/LICENSE)
*/
import { arrow, flip, offset, shift } from "@floating-ui/dom";
import BaseComponent from "./base-component.js";
import { execute } from "./util/index.js";
//#region js/src/floating-base.ts
/**
* --------------------------------------------------------------------------
* Chassis CSS floating-base.ts
* Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
* --------------------------------------------------------------------------
*/
var FloatingBase = class FloatingBase extends BaseComponent {
	static get BREAKPOINTS() {
		const rootStyle = getComputedStyle(document.documentElement);
		const rootFontSize = Number.parseFloat(rootStyle.fontSize) || 16;
		const toPx = (property, fallback) => {
			const raw = rootStyle.getPropertyValue(property).trim();
			const value = Number.parseFloat(raw);
			if (Number.isNaN(value)) return fallback;
			return /r?em$/.test(raw) ? value * rootFontSize : value;
		};
		return {
			small: toPx("--breakpoint-small", 576),
			medium: toPx("--breakpoint-medium", 768),
			large: toPx("--breakpoint-large", 1024),
			xlarge: toPx("--breakpoint-xlarge", 1280),
			"2xlarge": toPx("--breakpoint-2xlarge", 1536)
		};
	}
	static parseResponsivePlacement(placementString, defaultPlacement = "bottom") {
		if (!placementString || !placementString.includes(":")) return null;
		const parts = placementString.split(/\s+/);
		const placements = { xsmall: defaultPlacement };
		const breakpoints = FloatingBase.BREAKPOINTS;
		for (const part of parts) if (part.includes(":")) {
			const [breakpoint, placement] = part.split(":");
			if (breakpoints[breakpoint] !== void 0) placements[breakpoint] = placement;
		} else placements.xsmall = part;
		return placements;
	}
	static getResponsivePlacement(responsivePlacements, defaultPlacement = "bottom") {
		if (!responsivePlacements) return defaultPlacement;
		const viewportWidth = window.innerWidth;
		const breakpoints = FloatingBase.BREAKPOINTS;
		let activePlacement = responsivePlacements.xsmall || defaultPlacement;
		for (const breakpoint of [
			"small",
			"medium",
			"large",
			"xlarge",
			"2xlarge"
		]) if (viewportWidth >= breakpoints[breakpoint] && responsivePlacements[breakpoint]) activePlacement = responsivePlacements[breakpoint];
		return activePlacement;
	}
	static createBreakpointListeners(callback) {
		const listeners = [];
		const breakpoints = FloatingBase.BREAKPOINTS;
		for (const breakpoint of Object.keys(breakpoints)) {
			const minWidth = breakpoints[breakpoint];
			const mql = window.matchMedia(`(min-width: ${minWidth}px)`);
			mql.addEventListener("change", callback);
			listeners.push({
				mql,
				handler: callback
			});
		}
		return listeners;
	}
	static disposeBreakpointListeners(listeners) {
		for (const { mql, handler } of listeners) mql.removeEventListener("change", handler);
	}
	constructor(element, config) {
		super(element, config);
		this._floatingCleanup = null;
		this._mediaQueryListeners = [];
		this._responsivePlacements = null;
	}
	_parseResponsivePlacements() {
		if (typeof this._config.placement !== "string") {
			this._responsivePlacements = null;
			return;
		}
		this._responsivePlacements = FloatingBase.parseResponsivePlacement(this._config.placement, this._getDefaultPlacement());
		if (this._responsivePlacements) this._setupMediaQueryListeners();
	}
	_getDefaultPlacement() {
		return "bottom";
	}
	_getResponsivePlacement() {
		return FloatingBase.getResponsivePlacement(this._responsivePlacements, this._getDefaultPlacement());
	}
	_setupMediaQueryListeners() {
		this._disposeMediaQueryListeners();
		this._mediaQueryListeners = FloatingBase.createBreakpointListeners(() => {
			if (this._isShown()) this._updateFloatingPosition();
		});
	}
	_disposeMediaQueryListeners() {
		FloatingBase.disposeBreakpointListeners(this._mediaQueryListeners);
		this._mediaQueryListeners = [];
	}
	_isShown() {
		throw new Error("You have to implement the private method \"_isShown\", for each component!");
	}
	_updateFloatingPosition() {
		throw new Error("You have to implement the private method \"_updateFloatingPosition\", for each component!");
	}
	_getOffset() {
		const { offset: offsetConfig } = this._config;
		if (typeof offsetConfig === "string") return offsetConfig.split(",").map((value) => Number.parseInt(value, 10));
		if (typeof offsetConfig === "function") return ({ placement, rects }) => {
			return offsetConfig({
				placement,
				reference: rects.reference,
				floating: rects.floating
			}, this._element);
		};
		return offsetConfig;
	}
	_getFallbackPlacements() {
		return this._config.fallbackPlacements || [];
	}
	_getFloatingMiddleware(arrowElement = null) {
		const offsetValue = this._getOffset();
		const middleware = [
			offset(typeof offsetValue === "function" ? offsetValue : {
				mainAxis: offsetValue[1] || 0,
				crossAxis: offsetValue[0] || 0
			}),
			flip({ fallbackPlacements: this._getFallbackPlacements() }),
			shift({ boundary: this._config.boundary === "clippingParents" ? "clippingAncestors" : this._config.boundary })
		];
		if (arrowElement) middleware.push(arrow({ element: arrowElement }));
		return middleware;
	}
	_getFloatingConfig(placement, middleware) {
		return this._mergeFloatingConfig({
			placement,
			middleware
		});
	}
	_mergeFloatingConfig(defaultConfig) {
		return {
			...defaultConfig,
			...execute(this._config.floatingConfig, [void 0, defaultConfig])
		};
	}
	_disposeFloating() {
		if (this._floatingCleanup) {
			this._floatingCleanup();
			this._floatingCleanup = null;
		}
	}
};
//#endregion
export { FloatingBase as default };

//# sourceMappingURL=floating-base.js.map