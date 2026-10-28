/**
 * --------------------------------------------------------------------------
 * Chassis CSS accordion.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */
import BaseComponent from './base-component.js';
import type { ComponentConfig } from './util/config.js';
type Transition = {
    opening: boolean;
    clone: HTMLDetailsElement | null;
    cancel: () => void;
};
/**
 * Class definition
 */
declare class Accordion extends BaseComponent {
    protected _element: HTMLDetailsElement;
    protected _summary: HTMLElement | null;
    protected _content: HTMLElement | null;
    protected _isTransitioning: boolean;
    protected _transition: Transition | null;
    protected _observer: MutationObserver | undefined;
    static get NAME(): string;
    constructor(element?: string | Element | null, config?: ComponentConfig | null);
    toggle(): void;
    open(): void;
    close(): void;
    dispose(): void;
    protected _createObserver(): MutationObserver;
    protected _startTransition(opening: boolean, clone: HTMLDetailsElement | null, settle: () => void): void;
    protected _dropTransition(): void;
    protected _afterTransition(element: HTMLElement, callback: () => void): () => void;
    protected _createClone(height?: number | null): HTMLDetailsElement;
}
export default Accordion;
//# sourceMappingURL=accordion.d.ts.map