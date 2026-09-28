/**
 * --------------------------------------------------------------------------
 * Chassis CSS carousel.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */
import BaseComponent from './base-component.js';
import { type ChassisEvent } from './dom/event-handler.js';
import type { ComponentConfig } from './util/config.js';
type CarouselConfig = {
    autoplay: boolean;
    ends: string;
    interval: number;
    keyboard: boolean;
    pause: string | boolean;
};
/**
 * Class definition
 */
declare class Carousel extends BaseComponent {
    ['constructor']: typeof Carousel;
    protected _config: CarouselConfig;
    protected _viewport: HTMLElement;
    protected _indicatorsElement: HTMLElement | null;
    protected _playPauseElement: HTMLElement | null;
    protected _prevControls: HTMLElement[];
    protected _nextControls: HTMLElement[];
    protected _interval: ReturnType<typeof setTimeout> | null;
    protected _observer: IntersectionObserver | null;
    protected _scrollFrame: number | null;
    protected _looping: boolean;
    protected _visibility: Map<Element, number>;
    protected _playing: boolean;
    protected _activeIndex: number;
    constructor(element?: string | Element | null, config?: Partial<CarouselConfig> | null);
    static get Default(): CarouselConfig;
    static get DefaultType(): Record<string, string>;
    static get NAME(): string;
    next(): void;
    nextWhenVisible(): boolean;
    prev(): void;
    pause(): void;
    cycle(): void;
    to(index: number | string, items?: HTMLElement[]): void;
    dispose(): void;
    protected _configAfterMerge(config: ComponentConfig): ComponentConfig;
    protected _initialActiveIndex(): number;
    protected _addEventListeners(): void;
    protected _keydown(event: ChassisEvent): void;
    protected _observeItems(): void;
    protected _handleIntersection(entries: IntersectionObserverEntry[]): void;
    protected _navIndex(items?: HTMLElement[]): number;
    protected _scrollToIndex(index: number, items?: HTMLElement[]): void;
    protected _animateScroll(targetLeft: number, onComplete: () => void): void;
    protected _scrollDelta(element: Element, viewportRect?: DOMRect): number;
    protected _loopTransition(isNext: boolean, items: HTMLElement[]): void;
    protected _loopDirection(isNext: boolean): string;
    protected _jumpScroll(delta: number): void;
    protected _fadeTo(index: number, items: HTMLElement[]): void;
    protected _setActive(index: number, items?: HTMLElement[]): void;
    protected _refreshActiveState(items?: HTMLElement[]): void;
    protected _updateEndControls(items?: HTMLElement[]): void;
    protected _scrollEdges(items: HTMLElement[]): {
        atStart: boolean;
        atEnd: boolean;
    };
    protected _preserveFocus(atStart: boolean, atEnd: boolean): void;
    protected _setControlsDisabled(controls: HTMLElement[], disabled: boolean): void;
    protected _setActiveIndicatorElement(index: number): void;
    protected _normalizeIndex(index: number, length: number): number | null;
    protected _wrapsAround(): boolean;
    protected _canLoop(items: HTMLElement[]): boolean;
    protected _direction(from: number, to: number): string;
    protected _scheduleAutoplay(index?: number): void;
    protected _upcomingIndex(): number | null;
    protected _nextRawIndex(items: HTMLElement[]): number;
    protected _itemInterval(index?: number): number;
    protected _maybeEnableCycle(): void;
    protected _pauseFromInteraction(): void;
    protected _togglePlayPause(): void;
    protected _updatePlayPauseControl(): void;
    protected _isFade(): boolean;
    protected _prefersReducedMotion(): boolean;
    protected _getItems(): HTMLElement[];
    protected _clearInterval(): void;
    static dataApiSlideHandler(this: HTMLElement, event: ChassisEvent): void;
    static dataApiPlayPauseHandler(this: HTMLElement, event: ChassisEvent): void;
}
export default Carousel;
export type { CarouselConfig };
//# sourceMappingURL=carousel.d.ts.map