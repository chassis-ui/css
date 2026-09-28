/**
 * --------------------------------------------------------------------------
 * Chassis CSS scrollspy.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */
import BaseComponent from './base-component.js';
import type { ComponentConfig } from './util/config.js';
type ScrollSpyConfig = {
    rootMargin: string;
    smoothScroll: boolean;
    target: string | Element | null;
    threshold: number[] | string;
};
/**
 * Class definition
 */
declare class ScrollSpy extends BaseComponent {
    protected _config: ScrollSpyConfig;
    protected _targetLinks: Map<string, HTMLAnchorElement>;
    protected _observableSections: Map<string, HTMLElement>;
    protected _rootElement: HTMLElement | null;
    protected _activeTarget: HTMLElement | null;
    protected _observer: IntersectionObserver | null;
    protected _previousScrollData: {
        visibleEntryTop: number;
        parentScrollTop: number;
    };
    constructor(element?: string | Element | null, config?: Partial<ScrollSpyConfig> | null);
    static get Default(): ScrollSpyConfig;
    static get DefaultType(): Record<string, string>;
    static get NAME(): string;
    refresh(): void;
    dispose(): void;
    protected _configAfterMerge(config: ComponentConfig): ComponentConfig;
    protected _maybeEnableSmoothScroll(): void;
    protected _getNewObserver(): IntersectionObserver;
    protected _observerCallback(entries: IntersectionObserverEntry[]): void;
    protected _initializeTargetsAndObservables(): void;
    protected _process(target: HTMLElement): void;
    protected _activateParents(target: HTMLElement): void;
    protected _clearActiveClass(parent: HTMLElement): void;
}
export default ScrollSpy;
export type { ScrollSpyConfig };
//# sourceMappingURL=scrollspy.d.ts.map