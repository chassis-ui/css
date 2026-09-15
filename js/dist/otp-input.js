/*!
* Chassis otp-input.js v0.5.0 (https://chassis-ui.com)
* Copyright 2026 Ozgur Gunes <o.gunes@gmail.com>
* Licensed under MIT (https://github.com/chassis-ui/css/raw/main/LICENSE)
*/
import BaseComponent from "./base-component.js";
import EventHandler from "./dom/event-handler.js";
import SelectorEngine from "./dom/selector-engine.js";
import { ARROW_LEFT_KEY, ARROW_RIGHT_KEY, BACKSPACE_KEY, DELETE_KEY, getClipboardText } from "./util/index.js";
//#region js/src/otp-input.ts
/**
* --------------------------------------------------------------------------
* Chassis CSS otp-input.ts
* Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
* --------------------------------------------------------------------------
*/
/**
* Constants
*/
const NAME = "otpInput";
const EVENT_KEY = `.cx.otp-input`;
const DATA_API_KEY = ".data-api";
const EVENT_COMPLETE = `complete${EVENT_KEY}`;
const EVENT_INPUT = `input${EVENT_KEY}`;
const SELECTOR_DATA_OTP = "[data-cx-otp]";
const SELECTOR_INPUT = "input";
const Default = {
	length: 6,
	mask: false
};
const DefaultType = {
	length: "number",
	mask: "boolean"
};
/**
* Class definition
*/
var OtpInput = class extends BaseComponent {
	constructor(element, config) {
		super(element, config);
		this._inputs = SelectorEngine.find(SELECTOR_INPUT, this._element);
		this._setupInputs();
		this._addEventListeners();
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
	getValue() {
		return this._inputs.map((input) => input.value).join("");
	}
	setValue(value) {
		const chars = [...String(value)];
		for (const [index, input] of this._inputs.entries()) input.value = chars[index] || "";
		this._checkComplete();
	}
	clear() {
		for (const input of this._inputs) input.value = "";
		this._inputs[0]?.focus();
	}
	focus() {
		const emptyInput = this._inputs.find((input) => !input.value);
		if (emptyInput) emptyInput.focus();
		else this._inputs.at(-1)?.focus();
	}
	_setupInputs() {
		for (const input of this._inputs) {
			input.setAttribute("maxlength", "1");
			input.setAttribute("inputmode", "numeric");
			input.setAttribute("pattern", "\\d*");
			if (input === this._inputs[0]) input.setAttribute("autocomplete", "one-time-code");
			else input.setAttribute("autocomplete", "off");
			if (this._config.mask) input.setAttribute("type", "password");
		}
	}
	_addEventListeners() {
		for (const [index, input] of this._inputs.entries()) {
			EventHandler.on(input, "input", (event) => this._handleInput(event, index));
			EventHandler.on(input, "keydown", (event) => this._handleKeydown(event, index));
			EventHandler.on(input, "paste", (event) => this._handlePaste(event));
			EventHandler.on(input, "focus", (event) => this._handleFocus(event));
		}
	}
	_handleInput(event, index) {
		const input = event.target;
		if (!/^\d*$/.test(input.value)) input.value = input.value.replace(/\D/g, "");
		const { value } = input;
		if (value.length > 1) {
			const chars = [...value];
			input.value = chars[0] || "";
			for (let i = 1; i < chars.length && index + i < this._inputs.length; i++) this._inputs[index + i].value = chars[i];
			const nextIndex = Math.min(index + chars.length, this._inputs.length - 1);
			this._inputs[nextIndex].focus();
		} else if (value && index < this._inputs.length - 1) this._inputs[index + 1].focus();
		EventHandler.trigger(this._element, EVENT_INPUT, {
			value: this.getValue(),
			index
		});
		this._checkComplete();
	}
	_handleKeydown(event, index) {
		const { key } = event;
		switch (key) {
			case BACKSPACE_KEY:
				if (!this._inputs[index].value && index > 0) {
					event.preventDefault();
					this._inputs[index - 1].value = "";
					this._inputs[index - 1].focus();
				}
				break;
			case DELETE_KEY:
				event.preventDefault();
				for (let i = index; i < this._inputs.length - 1; i++) this._inputs[i].value = this._inputs[i + 1].value;
				this._inputs.at(-1).value = "";
				break;
			case ARROW_LEFT_KEY:
				if (index > 0) {
					event.preventDefault();
					this._inputs[index - 1].focus();
				}
				break;
			case ARROW_RIGHT_KEY:
				if (index < this._inputs.length - 1) {
					event.preventDefault();
					this._inputs[index + 1].focus();
				}
				break;
		}
	}
	_handlePaste(event) {
		event.preventDefault();
		const digits = getClipboardText(event).replace(/\D/g, "").slice(0, this._inputs.length);
		if (digits) {
			this.setValue(digits);
			const lastIndex = Math.min(digits.length, this._inputs.length) - 1;
			this._inputs[lastIndex].focus();
		}
	}
	_handleFocus(event) {
		event.target.select();
	}
	_checkComplete() {
		const value = this.getValue();
		if (value.length === this._inputs.length && this._inputs.every((input) => input.value !== "")) EventHandler.trigger(this._element, EVENT_COMPLETE, { value });
	}
};
/**
* Data API implementation
*/
EventHandler.on(document, `DOMContentLoaded${EVENT_KEY}${DATA_API_KEY}`, () => {
	for (const element of SelectorEngine.find(SELECTOR_DATA_OTP)) OtpInput.getOrCreateInstance(element);
});
//#endregion
export { OtpInput as default };

//# sourceMappingURL=otp-input.js.map