/**
 * --------------------------------------------------------------------------
 * Chassis CSS util/scrollbar.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */
/**
 * Class definition
 */
declare class ScrollBarHelper {
    protected _element: HTMLElement;
    constructor();
    getWidth(): number;
    hide(): void;
    reset(): void;
    isOverflowing(): boolean;
    protected _disableOverFlow(): void;
    protected _setElementAttributes(selector: string | Element, styleProperty: string, callback: (value: number) => number): void;
    protected _saveInitialAttribute(element: HTMLElement, styleProperty: string): void;
    protected _resetElementAttributes(selector: string | Element, styleProperty: string): void;
    protected _applyManipulationCallback(selector: string | Element, callBack: (element: HTMLElement) => void): void;
}
export default ScrollBarHelper;
//# sourceMappingURL=scrollbar.d.ts.map