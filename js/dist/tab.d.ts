/**
 * --------------------------------------------------------------------------
 * Chassis CSS tab.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */
import BaseComponent from './base-component.js';
import { type ChassisEvent } from './dom/event-handler.js';
/**
 * Class definition
 */
declare class Tab extends BaseComponent {
    protected _parent: Element | null;
    constructor(element?: string | Element | null);
    static get NAME(): string;
    show(): void;
    protected _activate(element: HTMLElement | null, relatedElem?: HTMLElement | null): void;
    protected _deactivate(element: HTMLElement | null, relatedElem?: HTMLElement | null): void;
    protected _keydown(event: ChassisEvent): void;
    protected _getChildren(): HTMLElement[];
    protected _getActiveElem(): HTMLElement | null;
    protected _setInitialAttributes(parent: Element, children: HTMLElement[]): void;
    protected _setInitialAttributesOnChild(child: HTMLElement): void;
    protected _setInitialAttributesOnTargetPanel(child: HTMLElement): void;
    protected _toggleMenu(element: HTMLElement, open: boolean): void;
    protected _setAttributeIfNotExists(element: Element, attribute: string, value: string): void;
    protected _elemIsActive(elem: HTMLElement): boolean;
    protected _getInnerElement(elem: HTMLElement): HTMLElement | null;
    protected _getOuterElement(elem: HTMLElement): Element;
}
export default Tab;
//# sourceMappingURL=tab.d.ts.map