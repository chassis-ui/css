/**
 * --------------------------------------------------------------------------
 * Chassis CSS datepicker.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */
import { Calendar } from 'vanilla-calendar-pro';
import BaseComponent from './base-component.js';
import type { ComponentConfig } from './util/config.js';
type DatepickerConfig = {
    datepickerTheme: string | null;
    dateMin: string | number | Date | null;
    dateMax: string | number | Date | null;
    dateFormat: Intl.DateTimeFormatOptions | ((date: Date, locale?: string) => string) | null;
    displayElement: string | HTMLElement | boolean | null;
    displayMonthsCount: number;
    firstWeekday: number;
    inline: boolean;
    locale: string;
    positionElement: string | HTMLElement | null;
    selectedDates: string[];
    selectionMode: string;
    placement: string;
    vcpOptions: Record<string, any>;
    styles: Record<string, string>;
};
/**
 * Class definition
 */
declare class Datepicker extends BaseComponent {
    ['constructor']: typeof Datepicker;
    protected _config: DatepickerConfig;
    protected _calendar: Calendar | null;
    protected _isShown: boolean;
    protected _themeObserver: MutationObserver | null;
    protected _isInput: boolean;
    protected _isInline: boolean;
    protected _boundInput: HTMLInputElement | null;
    protected _positionElement: HTMLElement;
    protected _displayElement: HTMLElement | false | null;
    constructor(element?: string | Element | null, config?: Partial<DatepickerConfig> | null);
    static get Default(): DatepickerConfig;
    static get DefaultType(): Record<string, string>;
    static get NAME(): string;
    toggle(): void;
    show(): void;
    hide(): void;
    dispose(): void;
    getSelectedDates(): string[];
    setSelectedDates(dates: string[]): void;
    protected _configAfterMerge(config: ComponentConfig): ComponentConfig;
    protected _initCalendar(): void;
    protected _updateDisplayWithSelectedDates(): void;
    protected _updateOutputs(selectedDates: string[]): void;
    protected _resolvePositionElement(): HTMLElement;
    protected _resolveDisplayElement(): HTMLElement | false | null;
    protected _getThemeAncestor(): HTMLElement | null;
    protected _getEffectiveTheme(): string | null;
    protected _syncThemeAttribute(element?: HTMLElement | null): void;
    protected _setupThemeObserver(): void;
    protected _buildCalendarOptions(): Record<string, any>;
    protected _handleDateClick(self: Calendar, event: MouseEvent): void;
    protected _maybeHideAfterSelection(selectedDates: string[]): void;
    protected _parseDate(dateStr: string): Date;
    protected _formatDate(dateStr: string): string;
    protected _formatDateForInput(dates: string[]): string;
    protected _parseInputValue(): void;
}
export default Datepicker;
export type { DatepickerConfig };
//# sourceMappingURL=datepicker.d.ts.map