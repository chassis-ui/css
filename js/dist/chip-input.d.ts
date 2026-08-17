/**
 * --------------------------------------------------------------------------
 * Chassis CSS chip-input.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */
import BaseComponent from './base-component.js';
import { type ChassisEvent } from './dom/event-handler.js';
type SelectChipOptions = {
    addToSelection?: boolean;
    rangeSelect?: boolean;
};
type ChipInputConfig = {
    separator: string | null;
    allowDuplicates: boolean;
    maxChips: number | null;
    placeholder: string;
    dismissible: boolean;
    createOnBlur: boolean;
    chipClass: string;
    dismissText: string;
};
/**
 * Class definition
 */
declare class ChipInput extends BaseComponent {
    ['constructor']: typeof ChipInput;
    protected _config: ChipInputConfig;
    protected _input: HTMLInputElement | null;
    protected _chips: string[];
    protected _selectedChips: Set<HTMLElement>;
    protected _anchorChip: HTMLElement | null;
    constructor(element?: string | Element | null, config?: Partial<ChipInputConfig> | null);
    static get Default(): ChipInputConfig;
    static get DefaultType(): Record<string, string>;
    static get NAME(): string;
    add(value: string): HTMLElement | null;
    remove(chipOrValue: HTMLElement | string): boolean;
    removeSelected(): void;
    getValues(): string[];
    getSelectedValues(): string[];
    clear(): void;
    clearSelection(): void;
    selectChip(chip: HTMLElement, options?: SelectChipOptions): void;
    focus(): void;
    dispose(): void;
    protected _clearSelectionSilent(): void;
    protected _getChipElements(): HTMLElement[];
    protected _createInput(): void;
    protected _initializeExistingChips(): void;
    protected _setupChip(chip: HTMLElement): void;
    protected _createChip(value: string): HTMLElement;
    protected _createDismissButton(): HTMLButtonElement;
    protected _findChipByValue(value: string): HTMLElement | undefined;
    protected _getChipValue(chip: HTMLElement): string;
    protected _addEventListeners(): void;
    protected _handleInputKeydown(event: ChassisEvent): void;
    protected _handleChipKeydown(event: ChassisEvent): void;
    protected _handleChipDelete(currentIndex: number, chips: HTMLElement[]): void;
    protected _navigateChip(chips: HTMLElement[], currentIndex: number, direction: number, shiftKey: boolean): void;
    protected _navigateToEdge(chips: HTMLElement[], targetIndex: number, shiftKey: boolean): void;
    protected _handleSelectAll(event: ChassisEvent, chips: HTMLElement[]): void;
    protected _handleInput(event: ChassisEvent): void;
    protected _handlePaste(event: ChassisEvent): void;
    protected _createChipFromInput(): void;
}
export default ChipInput;
export type { ChipInputConfig };
//# sourceMappingURL=chip-input.d.ts.map