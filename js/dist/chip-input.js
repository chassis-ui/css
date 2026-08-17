/*!
* Chassis chip-input.js v0.3.5 (https://chassis-ui.com)
* Copyright 2026 Ozgur Gunes <o.gunes@gmail.com>
* Licensed under MIT (https://github.com/chassis-ui/css/raw/main/LICENSE)
*/
import BaseComponent from "./base-component.js";
import Chip from "./chip.js";
import EventHandler from "./dom/event-handler.js";
import SelectorEngine from "./dom/selector-engine.js";
import { ARROW_LEFT_KEY, ARROW_RIGHT_KEY, BACKSPACE_KEY, DELETE_KEY, END_KEY, ENTER_KEY, ESCAPE_KEY, HOME_KEY, getClipboardText } from "./util/index.js";
//#region js/src/chip-input.ts
/**
* --------------------------------------------------------------------------
* Chassis CSS chip-input.ts
* Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
* --------------------------------------------------------------------------
*/
/**
* Constants
*/
const NAME = "chip-input";
const EVENT_KEY = `.cx.chip-input`;
const DATA_API_KEY = ".data-api";
const EVENT_ADD = `add${EVENT_KEY}`;
const EVENT_REMOVE = `remove${EVENT_KEY}`;
const EVENT_CHANGE = `change${EVENT_KEY}`;
const EVENT_SELECT = `select${EVENT_KEY}`;
const SELECTOR_DATA_CHIP_INPUT = "[data-cx-chips]";
const SELECTOR_GHOST_INPUT = ".ghost-input";
const SELECTOR_CHIP = ".chip";
const SELECTOR_CHIP_DISMISS = ".close-button";
const CLASS_NAME_CHIP = "chip";
const CLASS_NAME_CHIP_DISMISS = "close-button";
const CLASS_NAME_ACTIVE = "active";
const Default = {
	separator: ",",
	allowDuplicates: false,
	maxChips: null,
	placeholder: "",
	dismissible: true,
	createOnBlur: true,
	chipClass: "default",
	dismissText: "×"
};
const DefaultType = {
	separator: "(string|null)",
	allowDuplicates: "boolean",
	maxChips: "(number|null)",
	placeholder: "string",
	dismissible: "boolean",
	createOnBlur: "boolean",
	chipClass: "string",
	dismissText: "string"
};
/**
* Class definition
*/
var ChipInput = class extends BaseComponent {
	constructor(element, config) {
		super(element, config);
		const attrValue = this._element.dataset.cxChips?.trim();
		if (attrValue) this._config.chipClass = attrValue;
		this._input = SelectorEngine.findOne(SELECTOR_GHOST_INPUT, this._element);
		this._selectedChips = /* @__PURE__ */ new Set();
		this._anchorChip = null;
		if (!this._input) this._createInput();
		this._initializeExistingChips();
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
	add(value) {
		const trimmedValue = String(value).trim();
		if (!trimmedValue) return null;
		const currentValues = this.getValues();
		if (!this._config.allowDuplicates && currentValues.includes(trimmedValue)) return null;
		if (this._config.maxChips !== null && currentValues.length >= this._config.maxChips) return null;
		if (EventHandler.trigger(this._element, EVENT_ADD, {
			value: trimmedValue,
			relatedTarget: this._input
		}).defaultPrevented) return null;
		const chip = this._createChip(trimmedValue);
		this._element.insertBefore(chip, this._input);
		EventHandler.trigger(this._element, EVENT_CHANGE, { values: this.getValues() });
		return chip;
	}
	remove(chipOrValue) {
		if (!chipOrValue) return false;
		let chip;
		let value;
		if (typeof chipOrValue === "string") {
			value = chipOrValue;
			chip = this._findChipByValue(value);
		} else {
			chip = chipOrValue;
			value = this._getChipValue(chip);
		}
		if (!chip || !value) return false;
		if (EventHandler.trigger(this._element, EVENT_REMOVE, {
			value,
			chip,
			relatedTarget: this._input
		}).defaultPrevented) return false;
		this._selectedChips.delete(chip);
		if (this._anchorChip === chip) this._anchorChip = null;
		Chip.getInstance(chip)?.dispose();
		chip.remove();
		EventHandler.trigger(this._element, EVENT_CHANGE, { values: this.getValues() });
		return true;
	}
	removeSelected() {
		const chipsToRemove = [...this._selectedChips];
		for (const chip of chipsToRemove) this.remove(chip);
		this._input?.focus();
	}
	getValues() {
		return this._getChipElements().map((chip) => this._getChipValue(chip));
	}
	getSelectedValues() {
		return [...this._selectedChips].map((chip) => this._getChipValue(chip));
	}
	clear() {
		const chips = SelectorEngine.find(SELECTOR_CHIP, this._element);
		for (const chip of chips) {
			EventHandler.trigger(this._element, EVENT_REMOVE, {
				value: this._getChipValue(chip),
				chip,
				relatedTarget: this._input
			});
			Chip.getInstance(chip)?.dispose();
			chip.remove();
		}
		this._selectedChips.clear();
		this._anchorChip = null;
		EventHandler.trigger(this._element, EVENT_CHANGE, { values: [] });
	}
	clearSelection(silent = false) {
		for (const chip of this._selectedChips) {
			chip.classList.remove(CLASS_NAME_ACTIVE);
			chip.setAttribute("aria-selected", "false");
		}
		this._selectedChips.clear();
		this._anchorChip = null;
		if (!silent) EventHandler.trigger(this._element, EVENT_SELECT, { selected: [] });
	}
	selectChip(chip, options = {}) {
		const { addToSelection = false, rangeSelect = false } = options;
		const chipElements = this._getChipElements();
		if (!chipElements.includes(chip)) return;
		if (rangeSelect && this._anchorChip) {
			const anchorIndex = chipElements.indexOf(this._anchorChip);
			const chipIndex = chipElements.indexOf(chip);
			const start = Math.min(anchorIndex, chipIndex);
			const end = Math.max(anchorIndex, chipIndex);
			if (!addToSelection) this.clearSelection(true);
			for (let i = start; i <= end; i++) {
				this._selectedChips.add(chipElements[i]);
				chipElements[i].classList.add(CLASS_NAME_ACTIVE);
				chipElements[i].setAttribute("aria-selected", "true");
			}
		} else if (addToSelection) if (this._selectedChips.has(chip)) {
			this._selectedChips.delete(chip);
			chip.classList.remove(CLASS_NAME_ACTIVE);
			chip.setAttribute("aria-selected", "false");
		} else {
			this._selectedChips.add(chip);
			chip.classList.add(CLASS_NAME_ACTIVE);
			chip.setAttribute("aria-selected", "true");
			this._anchorChip = chip;
		}
		else {
			this.clearSelection();
			this._selectedChips.add(chip);
			chip.classList.add(CLASS_NAME_ACTIVE);
			chip.setAttribute("aria-selected", "true");
			this._anchorChip = chip;
		}
		EventHandler.trigger(this._element, EVENT_SELECT, { selected: this.getSelectedValues() });
	}
	focus() {
		this._input?.focus();
	}
	dispose() {
		for (const chip of this._getChipElements()) Chip.getInstance(chip)?.dispose();
		if (this._input) EventHandler.off(this._input, EVENT_KEY);
		super.dispose();
	}
	_getChipElements() {
		return SelectorEngine.find(SELECTOR_CHIP, this._element);
	}
	_createInput() {
		const input = document.createElement("input");
		input.type = "text";
		input.className = "ghost-input";
		if (this._config.placeholder) input.placeholder = this._config.placeholder;
		this._element.append(input);
		this._input = input;
	}
	_initializeExistingChips() {
		const existingChips = SelectorEngine.find(SELECTOR_CHIP, this._element);
		for (const chip of existingChips) {
			const value = this._getChipValue(chip);
			if (value) {
				chip.dataset.cxChipValue = value;
				this._setupChip(chip);
			}
		}
	}
	_setupChip(chip) {
		chip.setAttribute("tabindex", "0");
		chip.setAttribute("aria-selected", "false");
		for (const cls of this._config.chipClass.split(/\s+/).filter(Boolean)) chip.classList.add(cls);
		if (this._config.dismissible && !SelectorEngine.findOne(SELECTOR_CHIP_DISMISS, chip)) chip.append(this._createDismissButton());
		Chip.getOrCreateInstance(chip);
	}
	_createChip(value) {
		const chip = document.createElement("span");
		chip.className = CLASS_NAME_CHIP;
		chip.dataset.cxChipValue = value;
		chip.append(document.createTextNode(value));
		this._setupChip(chip);
		return chip;
	}
	_createDismissButton() {
		const button = document.createElement("button");
		button.type = "button";
		button.className = CLASS_NAME_CHIP_DISMISS;
		button.setAttribute("aria-label", "Remove");
		button.setAttribute("tabindex", "-1");
		button.textContent = this._config.dismissText;
		return button;
	}
	_findChipByValue(value) {
		return this._getChipElements().find((chip) => this._getChipValue(chip) === value);
	}
	_getChipValue(chip) {
		if (chip.dataset.cxChipValue) return chip.dataset.cxChipValue;
		const clone = chip.cloneNode(true);
		const dismiss = SelectorEngine.findOne(SELECTOR_CHIP_DISMISS, clone);
		if (dismiss) dismiss.remove();
		return clone.textContent?.trim() || "";
	}
	_addEventListeners() {
		EventHandler.on(this._input, `keydown${EVENT_KEY}`, (event) => this._handleInputKeydown(event));
		EventHandler.on(this._input, `input${EVENT_KEY}`, (event) => this._handleInput(event));
		EventHandler.on(this._input, `paste${EVENT_KEY}`, (event) => this._handlePaste(event));
		EventHandler.on(this._input, `focus${EVENT_KEY}`, () => this.clearSelection());
		if (this._config.createOnBlur) EventHandler.on(this._input, `blur${EVENT_KEY}`, (event) => {
			if (!event.relatedTarget?.closest(SELECTOR_CHIP)) this._createChipFromInput();
		});
		EventHandler.on(this._element, `click${EVENT_KEY}`, SELECTOR_CHIP, (event) => {
			if (event.target.closest(SELECTOR_CHIP_DISMISS)) return;
			const chip = event.target.closest(SELECTOR_CHIP);
			if (chip) {
				event.preventDefault();
				this.selectChip(chip, {
					addToSelection: event.metaKey || event.ctrlKey,
					rangeSelect: event.shiftKey
				});
				chip.focus();
			}
		});
		EventHandler.on(this._element, `click${EVENT_KEY}`, SELECTOR_CHIP_DISMISS, (event) => {
			event.stopPropagation();
			const chip = event.target.closest(SELECTOR_CHIP);
			if (chip) {
				this.remove(chip);
				this._input?.focus();
			}
		});
		EventHandler.on(this._element, `keydown${EVENT_KEY}`, SELECTOR_CHIP, (event) => {
			this._handleChipKeydown(event);
		});
		EventHandler.on(this._element, `click${EVENT_KEY}`, (event) => {
			if (event.target === this._element) {
				this.clearSelection();
				this._input?.focus();
			}
		});
	}
	_handleInputKeydown(event) {
		const { key } = event;
		switch (key) {
			case ENTER_KEY:
				event.preventDefault();
				this._createChipFromInput();
				break;
			case BACKSPACE_KEY:
			case DELETE_KEY:
				if (this._input.value === "") {
					event.preventDefault();
					const chips = this._getChipElements();
					if (chips.length > 0) {
						const lastChip = chips.at(-1);
						this.selectChip(lastChip);
						lastChip.focus();
					}
				}
				break;
			case ARROW_LEFT_KEY:
				if (this._input.selectionStart === 0 && this._input.selectionEnd === 0) {
					event.preventDefault();
					const chips = this._getChipElements();
					if (chips.length > 0) {
						const lastChip = chips.at(-1);
						if (event.shiftKey) this.selectChip(lastChip, { addToSelection: true });
						else this.selectChip(lastChip);
						lastChip.focus();
					}
				}
				break;
			case ESCAPE_KEY:
				this._input.value = "";
				this.clearSelection();
				this._input.blur();
				break;
		}
	}
	_handleChipKeydown(event) {
		const { key } = event;
		const chip = event.target.closest(SELECTOR_CHIP);
		if (!chip) return;
		const chips = this._getChipElements();
		const currentIndex = chips.indexOf(chip);
		switch (key) {
			case BACKSPACE_KEY:
			case DELETE_KEY:
				event.preventDefault();
				this._handleChipDelete(currentIndex, chips);
				break;
			case ARROW_LEFT_KEY:
				event.preventDefault();
				this._navigateChip(chips, currentIndex, -1, event.shiftKey);
				break;
			case ARROW_RIGHT_KEY:
				event.preventDefault();
				this._navigateChip(chips, currentIndex, 1, event.shiftKey);
				break;
			case HOME_KEY:
				event.preventDefault();
				this._navigateToEdge(chips, 0, event.shiftKey);
				break;
			case END_KEY:
				event.preventDefault();
				this.clearSelection();
				this._input?.focus();
				break;
			case "a":
				this._handleSelectAll(event, chips);
				break;
			case ESCAPE_KEY:
				event.preventDefault();
				this.clearSelection();
				this._input?.focus();
				break;
		}
	}
	_handleChipDelete(currentIndex, chips) {
		if (this._selectedChips.size === 0) return;
		const nextIndex = Math.min(currentIndex, chips.length - this._selectedChips.size - 1);
		this.removeSelected();
		const remainingChips = this._getChipElements();
		if (remainingChips.length > 0) {
			const focusIndex = Math.max(0, Math.min(nextIndex, remainingChips.length - 1));
			remainingChips[focusIndex].focus();
			this.selectChip(remainingChips[focusIndex]);
		} else this._input?.focus();
	}
	_navigateChip(chips, currentIndex, direction, shiftKey) {
		const targetIndex = currentIndex + direction;
		if (targetIndex >= 0 && targetIndex < chips.length) {
			const targetChip = chips[targetIndex];
			this.selectChip(targetChip, shiftKey ? {
				addToSelection: true,
				rangeSelect: true
			} : {});
			targetChip.focus();
		} else if (direction > 0) {
			this.clearSelection();
			this._input?.focus();
		}
	}
	_navigateToEdge(chips, targetIndex, shiftKey) {
		if (chips.length === 0) return;
		const targetChip = chips[targetIndex];
		this.selectChip(targetChip, shiftKey ? { rangeSelect: true } : {});
		targetChip.focus();
	}
	_handleSelectAll(event, chips) {
		if (!(event.metaKey || event.ctrlKey)) return;
		event.preventDefault();
		for (const c of chips) {
			this._selectedChips.add(c);
			c.classList.add(CLASS_NAME_ACTIVE);
			c.setAttribute("aria-selected", "true");
		}
		this._anchorChip = chips[0] ?? null;
		EventHandler.trigger(this._element, EVENT_SELECT, { selected: this.getSelectedValues() });
	}
	_handleInput(event) {
		const { value } = event.target;
		const { separator } = this._config;
		if (separator && value.includes(separator)) {
			const parts = value.split(separator);
			for (const part of parts.slice(0, -1)) this.add(part.trim());
			this._input.value = parts.at(-1);
		}
	}
	_handlePaste(event) {
		const { separator } = this._config;
		if (!separator) return;
		const pastedData = getClipboardText(event);
		if (pastedData.includes(separator)) {
			event.preventDefault();
			const parts = pastedData.split(separator);
			for (const part of parts.slice(0, -1)) this.add(part.trim());
			this._input.value = parts.at(-1);
		}
	}
	_createChipFromInput() {
		const value = this._input.value.trim();
		if (value) {
			this.add(value);
			this._input.value = "";
		}
	}
};
/**
* Data API implementation
*/
EventHandler.on(document, `DOMContentLoaded${EVENT_KEY}${DATA_API_KEY}`, () => {
	for (const element of SelectorEngine.find(SELECTOR_DATA_CHIP_INPUT)) ChipInput.getOrCreateInstance(element);
});
//#endregion
export { ChipInput as default };

//# sourceMappingURL=chip-input.js.map