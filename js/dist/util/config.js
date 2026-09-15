/*!
* Chassis config.js v0.4.0 (https://chassis-ui.com)
* Copyright 2026 Ozgur Gunes <o.gunes@gmail.com>
* Licensed under MIT (https://github.com/chassis-ui/css/raw/main/LICENSE)
*/
import Manipulator from "../dom/manipulator.js";
import { isElement, toType } from "./index.js";
//#region js/src/util/config.ts
/**
* --------------------------------------------------------------------------
* Chassis CSS util/config.ts
* Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
* --------------------------------------------------------------------------
*/
/**
* Class definition
*/
var Config = class {
	static get Default() {
		return {};
	}
	static get DefaultType() {
		return {};
	}
	static get NAME() {
		throw new Error("You have to implement the static method \"NAME\", for each component!");
	}
	_getConfig(config) {
		let mergedConfig = this._mergeConfigObj(config);
		mergedConfig = this._configAfterMerge(mergedConfig);
		this._typeCheckConfig(mergedConfig);
		return mergedConfig;
	}
	_configAfterMerge(config) {
		return config;
	}
	_mergeConfigObj(config, element) {
		const jsonConfig = isElement(element) ? Manipulator.getDataAttribute(element, "config") : {};
		const dataAttributes = isElement(element) ? Manipulator.getDataAttributes(element) : {};
		for (const key of this._excludedConfigKeys()) {
			if (typeof jsonConfig === "object" && jsonConfig !== null) delete jsonConfig[key];
			delete dataAttributes[key];
		}
		return {
			...this.constructor.Default,
			...typeof jsonConfig === "object" ? jsonConfig : {},
			...dataAttributes,
			...typeof config === "object" ? config : {}
		};
	}
	_excludedConfigKeys() {
		return [];
	}
	_typeCheckConfig(config, configTypes = this.constructor.DefaultType) {
		for (const [property, expectedTypes] of Object.entries(configTypes)) {
			const value = config[property];
			const valueType = isElement(value) ? "element" : toType(value);
			if (!new RegExp(expectedTypes).test(valueType)) throw new TypeError(`${this.constructor.NAME.toUpperCase()}: Option "${property}" provided type "${valueType}" but expected type "${expectedTypes}".`);
		}
	}
};
//#endregion
export { Config as default };

//# sourceMappingURL=config.js.map