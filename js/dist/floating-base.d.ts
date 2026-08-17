/**
 * --------------------------------------------------------------------------
 * Chassis CSS floating-base.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */
import { type Middleware, type MiddlewareState, type Placement } from '@floating-ui/dom';
import BaseComponent from './base-component.js';
import type { ComponentConfig } from './util/config.js';
type Breakpoints = Record<string, number>;
type ResponsivePlacements = Record<string, string>;
interface BreakpointListener {
    mql: MediaQueryList;
    handler: (event: MediaQueryListEvent) => void;
}
declare class FloatingBase extends BaseComponent {
    protected _config: ComponentConfig;
    protected _floatingCleanup: (() => void) | null;
    protected _mediaQueryListeners: BreakpointListener[];
    protected _responsivePlacements: ResponsivePlacements | null;
    static get BREAKPOINTS(): Breakpoints;
    static parseResponsivePlacement(placementString?: string | null, defaultPlacement?: string): ResponsivePlacements | null;
    static getResponsivePlacement(responsivePlacements: ResponsivePlacements | null, defaultPlacement?: string): string;
    static createBreakpointListeners(callback: (event: MediaQueryListEvent) => void): BreakpointListener[];
    static disposeBreakpointListeners(listeners: BreakpointListener[]): void;
    constructor(element?: string | Element | null, config?: ComponentConfig | null);
    protected _parseResponsivePlacements(): void;
    protected _getDefaultPlacement(): string;
    protected _getResponsivePlacement(): string;
    protected _setupMediaQueryListeners(): void;
    protected _disposeMediaQueryListeners(): void;
    protected _isShown(): boolean;
    protected _updateFloatingPosition(): any;
    protected _getOffset(): number[] | ((state: MiddlewareState) => any);
    protected _getFallbackPlacements(): Placement[];
    protected _getFloatingMiddleware(arrowElement?: Element | null): Middleware[];
    protected _getFloatingConfig(placement: Placement | string, middleware: Middleware[]): Record<string, any>;
    protected _disposeFloating(): void;
}
export default FloatingBase;
//# sourceMappingURL=floating-base.d.ts.map