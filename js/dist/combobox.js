/*!
* Chassis combobox.js v0.3.5 (https://chassis-ui.com)
* Copyright 2026 Ozgur Gunes <o.gunes@gmail.com>
* Licensed under MIT (https://github.com/chassis-ui/css/raw/main/LICENSE)
*/
import BaseComponent from "./base-component.js";
import EventHandler from "./dom/event-handler.js";
import SelectorEngine from "./dom/selector-engine.js";
import Menu from "./menu.js";
import { getNextActiveElement, isDisabled, isVisible } from "./util/index.js";
//#region js/src/combobox.ts
/**
* --------------------------------------------------------------------------
* Chassis CSS combobox.ts
* Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
* --------------------------------------------------------------------------
*/
/**
* Constants
*/
const NAME = "combobox";
const EVENT_KEY = `.cx.combobox`;
const DATA_API_KEY = ".data-api";
const ESCAPE_KEY = "Escape";
const TAB_KEY = "Tab";
const ARROW_UP_KEY = "ArrowUp";
const ARROW_DOWN_KEY = "ArrowDown";
const HOME_KEY = "Home";
const END_KEY = "End";
const ENTER_KEY = "Enter";
const SPACE_KEY = " ";
const EVENT_CHANGE = `change${EVENT_KEY}`;
const EVENT_SHOW = `show${EVENT_KEY}`;
const EVENT_SHOWN = `shown${EVENT_KEY}`;
const EVENT_HIDE = `hide${EVENT_KEY}`;
const EVENT_HIDDEN = `hidden${EVENT_KEY}`;
const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`;
const CLASS_NAME_SHOW = "show";
const CLASS_NAME_SELECTED = "selected";
const CLASS_NAME_PLACEHOLDER = "combobox-placeholder";
const SELECTOR_DATA_TOGGLE = "[data-cx-toggle=\"combobox\"]";
const SELECTOR_MENU = ".menu";
const SELECTOR_MENU_ITEM = ".menu-item[data-cx-value]";
const SELECTOR_VISIBLE_ITEMS = ".menu-item[data-cx-value]:not(.disabled):not(:disabled)";
const SELECTOR_VALUE = ".combobox-value";
const SELECTOR_SEARCH_INPUT = ".combobox-search-input";
const SELECTOR_NO_RESULTS = ".combobox-no-results";
const FILTER_DEBOUNCE_DELAY = 150;
const Default = {
	boundary: "clippingParents",
	multiple: false,
	name: null,
	offset: [0, 2],
	placeholder: "",
	placement: "bottom-start",
	searchNormalize: false
};
const DefaultType = {
	boundary: "(string|element)",
	multiple: "boolean",
	name: "(string|null)",
	offset: "(array|string|function)",
	placeholder: "string",
	placement: "string",
	searchNormalize: "boolean"
};
/**
* Class definition
*/
var Combobox = class Combobox extends BaseComponent {
	constructor(element, config) {
		super(element, config);
		this._toggle = this._element;
		this._menu = SelectorEngine.next(this._toggle, SELECTOR_MENU)[0];
		this._valueDisplay = SelectorEngine.findOne(SELECTOR_VALUE, this._toggle);
		this._comboInput = this._valueDisplay instanceof HTMLInputElement ? this._valueDisplay : null;
		this._searchInput = this._comboInput ? null : SelectorEngine.findOne(SELECTOR_SEARCH_INPUT, this._menu);
		this._noResults = SelectorEngine.findOne(SELECTOR_NO_RESULTS, this._menu);
		this._hiddenInput = null;
		this._menuInstance = null;
		this._ignoreNextFocus = false;
		this._filterDebounceTimer = null;
		this._createHiddenInput();
		this._createMenuInstance();
		this._syncDisabledState();
		this._syncInitialSelection();
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
	toggle() {
		return this._isShown() ? this.hide() : this.show();
	}
	show() {
		if (isDisabled(this._toggle) || this._isShown()) return;
		if (EventHandler.trigger(this._toggle, EVENT_SHOW).defaultPrevented) return;
		this._menuInstance.show();
		this._cancelFilterDebounce();
		if (this._searchInput) {
			this._searchInput.value = "";
			this._filterItems("");
			requestAnimationFrame(() => this._searchInput?.focus());
		} else if (this._comboInput) {
			this._filterItems("");
			requestAnimationFrame(() => {
				this._comboInput?.focus();
				this._comboInput?.select();
			});
		}
		EventHandler.trigger(this._toggle, EVENT_SHOWN);
	}
	hide() {
		if (!this._isShown()) return;
		if (EventHandler.trigger(this._toggle, EVENT_HIDE).defaultPrevented) return;
		this._menuInstance.hide();
		EventHandler.trigger(this._toggle, EVENT_HIDDEN);
	}
	disable() {
		if (this._isShown()) this.hide();
		this._syncDisabledState(true);
	}
	enable() {
		this._syncDisabledState(false);
	}
	dispose() {
		this._cancelFilterDebounce();
		if (this._menuInstance) {
			this._menuInstance.dispose();
			this._menuInstance = null;
		}
		if (this._hiddenInput) {
			this._hiddenInput.remove();
			this._hiddenInput = null;
		}
		EventHandler.off(this._menu, EVENT_KEY);
		EventHandler.off(this._toggle, EVENT_KEY);
		if (this._comboInput) EventHandler.off(this._comboInput, EVENT_KEY);
		if (this._searchInput) EventHandler.off(this._searchInput, EVENT_KEY);
		super.dispose();
	}
	_isShown() {
		return this._menu.classList.contains(CLASS_NAME_SHOW);
	}
	_syncDisabledState(disabled) {
		if (disabled === void 0) {
			const toggleDisabled = this._toggle.classList.contains("disabled") || this._toggle.getAttribute("aria-disabled") === "true";
			const inputDisabled = this._comboInput?.disabled ?? false;
			disabled = toggleDisabled || inputDisabled;
		}
		this._toggle.classList.toggle("disabled", disabled);
		if (disabled) this._toggle.setAttribute("aria-disabled", "true");
		else this._toggle.removeAttribute("aria-disabled");
		if (this._comboInput) this._comboInput.disabled = disabled;
		if (this._hiddenInput) this._hiddenInput.disabled = disabled;
	}
	_createHiddenInput() {
		const { name } = this._config;
		if (!name) return;
		this._hiddenInput = document.createElement("input");
		this._hiddenInput.type = "hidden";
		this._hiddenInput.name = name;
		this._hiddenInput.value = "";
		this._toggle.parentNode.insertBefore(this._hiddenInput, this._toggle);
	}
	_createMenuInstance() {
		this._menuInstance = new Menu(this._toggle, {
			menu: this._menu,
			autoClose: this._config.multiple ? "outside" : true,
			boundary: this._config.boundary,
			offset: this._config.offset,
			placement: this._config.placement
		});
	}
	_syncInitialSelection() {
		for (const item of SelectorEngine.find(SELECTOR_MENU_ITEM, this._menu)) item.setAttribute("aria-selected", item.classList.contains(CLASS_NAME_SELECTED) ? "true" : "false");
		if (this._getSelectedItems().length > 0) {
			this._updateToggleText();
			this._updateHiddenInput();
		} else this._showPlaceholder();
	}
	_restoreAfterClose() {
		if (!this._comboInput) return;
		this._cancelFilterDebounce();
		this._filterItems("");
		if (this._getSelectedItems().length > 0) this._updateToggleText();
		else this._comboInput.value = "";
	}
	_addEventListeners() {
		EventHandler.on(this._toggle, "hidden.cx.menu", () => {
			this._restoreAfterClose();
		});
		EventHandler.on(this._menu, `click${EVENT_KEY}`, SELECTOR_MENU_ITEM, (event) => {
			const item = event.target.closest(SELECTOR_MENU_ITEM);
			if (!item || isDisabled(item)) return;
			event.preventDefault();
			event.stopPropagation();
			this._selectItem(item);
		});
		EventHandler.on(this._toggle, `keydown${EVENT_KEY}`, (event) => {
			this._handleToggleKeydown(event);
		});
		EventHandler.on(this._menu, `keydown${EVENT_KEY}`, (event) => {
			this._handleMenuKeydown(event);
		});
		if (this._comboInput) {
			EventHandler.on(this._comboInput, `focus${EVENT_KEY}`, () => {
				if (this._ignoreNextFocus) {
					this._ignoreNextFocus = false;
					return;
				}
				if (!this._isShown()) this.show();
			});
			EventHandler.on(this._comboInput, `input${EVENT_KEY}`, () => {
				this._scheduleFilter(this._comboInput.value, (visibleCount) => {
					if (visibleCount > 0 && !this._isShown()) this._menuInstance.show();
					else if (visibleCount === 0 && this._isShown()) this._menuInstance.hide();
				});
			});
		}
		if (this._searchInput) {
			EventHandler.on(this._searchInput, `input${EVENT_KEY}`, () => {
				this._scheduleFilter(this._searchInput.value);
			});
			EventHandler.on(this._searchInput, `keydown${EVENT_KEY}`, (event) => {
				if (event.key === ARROW_DOWN_KEY) {
					event.preventDefault();
					event.stopPropagation();
					const items = this._getVisibleItems();
					if (items.length > 0) items[0].focus();
				}
				if (event.key === ESCAPE_KEY) {
					this._ignoreNextFocus = true;
					this.hide();
					(this._comboInput ?? this._toggle).focus();
				}
			});
		}
	}
	_selectItem(item) {
		if (this._config.multiple) {
			const isNowSelected = item.classList.toggle(CLASS_NAME_SELECTED);
			item.setAttribute("aria-selected", isNowSelected ? "true" : "false");
		} else {
			const previouslySelected = SelectorEngine.find(`.${CLASS_NAME_SELECTED}`, this._menu);
			for (const prev of previouslySelected) {
				if (prev === item) continue;
				prev.classList.remove(CLASS_NAME_SELECTED);
				prev.setAttribute("aria-selected", "false");
			}
			item.classList.add(CLASS_NAME_SELECTED);
			item.setAttribute("aria-selected", "true");
		}
		this._updateToggleText();
		this._updateHiddenInput();
		const value = this._config.multiple ? this._getSelectedItems().map((el) => el.dataset.cxValue) : item.dataset.cxValue;
		EventHandler.trigger(this._toggle, EVENT_CHANGE, {
			value,
			item
		});
		if (!this._config.multiple) {
			this._ignoreNextFocus = true;
			this.hide();
			(this._comboInput ?? this._toggle).focus();
		}
	}
	_updateToggleText() {
		const selectedItems = this._getSelectedItems();
		if (selectedItems.length === 0) {
			this._showPlaceholder();
			return;
		}
		let text;
		if (this._config.multiple && selectedItems.length > 1) text = `${selectedItems.length} selected`;
		else {
			const item = selectedItems[0];
			const label = SelectorEngine.findOne(".menu-item-content > span:first-child", item);
			text = label ? label.textContent ?? "" : item.textContent.trim();
		}
		if (this._comboInput) this._comboInput.value = text;
		else {
			this._valueDisplay.classList.remove(CLASS_NAME_PLACEHOLDER);
			this._valueDisplay.textContent = text;
		}
	}
	_showPlaceholder() {
		const { placeholder } = this._config;
		if (this._comboInput) this._comboInput.value = "";
		else if (placeholder) {
			this._valueDisplay.textContent = placeholder;
			this._valueDisplay.classList.add(CLASS_NAME_PLACEHOLDER);
		}
	}
	_updateHiddenInput() {
		if (!this._hiddenInput) return;
		const values = this._getSelectedItems().map((el) => el.dataset.cxValue);
		this._hiddenInput.value = this._config.multiple ? values.join(",") : values[0] || "";
	}
	_getSelectedItems() {
		return SelectorEngine.find(`.${CLASS_NAME_SELECTED}`, this._menu);
	}
	_getVisibleItems() {
		return SelectorEngine.find(SELECTOR_VISIBLE_ITEMS, this._menu).filter((item) => isVisible(item));
	}
	_scheduleFilter(query, onFiltered) {
		this._cancelFilterDebounce();
		this._filterDebounceTimer = setTimeout(() => {
			this._filterDebounceTimer = null;
			const visibleCount = this._filterItems(query);
			onFiltered?.(visibleCount);
		}, FILTER_DEBOUNCE_DELAY);
	}
	_cancelFilterDebounce() {
		if (this._filterDebounceTimer !== null) {
			clearTimeout(this._filterDebounceTimer);
			this._filterDebounceTimer = null;
		}
	}
	_filterItems(query) {
		const normalizedQuery = this._normalizeText(query.toLowerCase().trim());
		const items = SelectorEngine.find(SELECTOR_MENU_ITEM, this._menu);
		let visibleCount = 0;
		for (const item of items) {
			const text = this._normalizeText((item.textContent ?? "").toLowerCase().trim());
			const matches = !normalizedQuery || text.includes(normalizedQuery);
			item.style.display = matches ? "" : "none";
			if (matches) visibleCount++;
		}
		if (this._noResults) this._noResults.classList.toggle("d-none", visibleCount > 0);
		return visibleCount;
	}
	_normalizeText(text) {
		if (this._config.searchNormalize) return text.normalize("NFD").replace(/[\u0300-\u036F]/g, "");
		return text;
	}
	_handleToggleKeydown(event) {
		const { key } = event;
		if (key === ARROW_DOWN_KEY || key === ARROW_UP_KEY) {
			event.preventDefault();
			if (!this._isShown()) this.show();
			const items = this._getVisibleItems();
			if (items.length > 0) (key === ARROW_DOWN_KEY ? items[0] : items.at(-1)).focus();
			return;
		}
		if ((key === ENTER_KEY || key === SPACE_KEY) && !this._isShown() && event.target !== this._comboInput) {
			event.preventDefault();
			this.show();
		}
	}
	_handleMenuKeydown(event) {
		const { key, target } = event;
		if (key === ESCAPE_KEY) {
			event.preventDefault();
			event.stopPropagation();
			this._ignoreNextFocus = true;
			this.hide();
			(this._comboInput ?? this._toggle).focus();
			return;
		}
		if (key === TAB_KEY) {
			this.hide();
			return;
		}
		const isInput = target.matches("input");
		if (key === ARROW_DOWN_KEY || key === ARROW_UP_KEY) {
			event.preventDefault();
			const items = this._getVisibleItems();
			if (items.length > 0) getNextActiveElement(items, target, key === ARROW_DOWN_KEY, !items.includes(target)).focus();
			return;
		}
		if (key === HOME_KEY || key === END_KEY) {
			event.preventDefault();
			const items = this._getVisibleItems();
			if (items.length > 0) (key === HOME_KEY ? items[0] : items.at(-1)).focus();
			return;
		}
		if ((key === ENTER_KEY || key === SPACE_KEY) && !isInput) {
			event.preventDefault();
			const item = target.closest(SELECTOR_MENU_ITEM);
			if (item && !isDisabled(item)) this._selectItem(item);
		}
	}
	static dataApiClickHandler(event) {
		const instance = Combobox.getOrCreateInstance(this);
		if (event.target === instance._comboInput) {
			instance.show();
			return;
		}
		event.preventDefault();
		instance.toggle();
	}
};
/**
* Data API implementation
*/
EventHandler.on(document, EVENT_CLICK_DATA_API, SELECTOR_DATA_TOGGLE, Combobox.dataApiClickHandler);
EventHandler.on(document, "DOMContentLoaded", () => {
	for (const toggle of SelectorEngine.find(SELECTOR_DATA_TOGGLE)) Combobox.getOrCreateInstance(toggle);
});
//#endregion
export { Combobox as default };

//# sourceMappingURL=combobox.js.map