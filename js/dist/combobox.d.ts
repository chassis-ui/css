/**
 * --------------------------------------------------------------------------
 * Chassis CSS combobox.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */
import BaseComponent from './base-component.js';
import { type ChassisEvent } from './dom/event-handler.js';
import Menu from './menu.js';
type ComboboxConfig = {
    boundary: string | Element;
    multiple: boolean;
    name: string | null;
    offset: number[] | string | ((data: Record<string, any>, element: HTMLElement) => number[]);
    placeholder: string;
    placement: string;
    searchNormalize: boolean;
};
/**
 * Class definition
 */
declare class Combobox extends BaseComponent {
    protected _config: ComboboxConfig;
    protected _toggle: HTMLElement;
    protected _menu: HTMLElement;
    protected _valueDisplay: HTMLElement;
    _comboInput: HTMLInputElement | null;
    protected _searchInput: HTMLInputElement | null;
    protected _noResults: HTMLElement | null;
    protected _hiddenInput: HTMLInputElement | null;
    protected _menuInstance: Menu | null;
    protected _ignoreNextFocus: boolean;
    constructor(element?: string | Element | null, config?: Partial<ComboboxConfig> | null);
    static get Default(): ComboboxConfig;
    static get DefaultType(): Record<string, string>;
    static get NAME(): string;
    toggle(): void;
    show(): void;
    hide(): void;
    disable(): void;
    enable(): void;
    dispose(): void;
    protected _isShown(): boolean;
    protected _syncDisabledState(disabled?: boolean): void;
    protected _createHiddenInput(): void;
    protected _createMenuInstance(): void;
    protected _syncInitialSelection(): void;
    protected _restoreAfterClose(): void;
    protected _addEventListeners(): void;
    protected _selectItem(item: HTMLElement): void;
    protected _updateToggleText(): void;
    protected _showPlaceholder(): void;
    protected _updateHiddenInput(): void;
    protected _getSelectedItems(): HTMLElement[];
    protected _getVisibleItems(): HTMLElement[];
    protected _filterItems(query: string): number;
    protected _normalizeText(text: string): string;
    protected _handleToggleKeydown(event: ChassisEvent): void;
    protected _handleMenuKeydown(event: ChassisEvent): void;
}
export default Combobox;
export type { ComboboxConfig };
//# sourceMappingURL=combobox.d.ts.map