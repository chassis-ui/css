/**
 * --------------------------------------------------------------------------
 * Chassis CSS dom/selector-engine.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */
declare const SelectorEngine: {
    find<T extends Element = HTMLElement>(selector: string, element?: ParentNode): T[];
    findOne<T extends Element = HTMLElement>(selector: string, element?: ParentNode): T | null;
    children(element: Element, selector: string): Element[];
    parents(element: Element, selector: string): Element[];
    prev(element: Element, selector: string): Element[];
    next(element: Element, selector: string): Element[];
    focusableChildren(element: Element): HTMLElement[];
    getSelectorFromElement(element: Element): string | null;
    getElementFromSelector(element: Element): HTMLElement | null;
    getMultipleElementsFromSelector(element: Element): HTMLElement[];
};
export default SelectorEngine;
//# sourceMappingURL=selector-engine.d.ts.map