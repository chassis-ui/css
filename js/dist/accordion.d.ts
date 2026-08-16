/**
 * --------------------------------------------------------------------------
 * Chassis CSS accordion.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */
import BaseComponent from './base-component.js';
import type { ComponentConfig } from './util/config.js';
/**
 * Class definition
 */
declare class Accordion extends BaseComponent {
    protected _element: HTMLDetailsElement;
    protected _summary: HTMLElement | null;
    protected _content: HTMLElement | null;
    protected _isTransitioning: boolean;
    protected _observer: MutationObserver | undefined;
    static get NAME(): string;
    constructor(element?: string | Element | null, config?: ComponentConfig | null);
    toggle(): void;
    open(): void;
    close(): void;
    dispose(): void;
    protected _createObserver(): MutationObserver;
    protected _createClone(): HTMLDetailsElement;
}
export default Accordion;
//# sourceMappingURL=accordion.d.ts.map