/**
 * --------------------------------------------------------------------------
 * Chassis CSS menu.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */
import { type Middleware, type Placement, type ReferenceElement, type Strategy } from '@floating-ui/dom';
import FloatingBase from './floating-base.js';
import { type ChassisEvent } from './dom/event-handler.js';
import type { ComponentConfig } from './util/config.js';
type Point = {
    x: number;
    y: number;
};
type MenuConfig = {
    autoClose: boolean | 'inside' | 'outside';
    boundary: string | Element;
    container: string | Element | boolean;
    display: string;
    offset: number[] | string | ((data: Record<string, any>, element: HTMLElement) => number[]);
    floatingConfig: Record<string, any> | ((defaultConfig: Record<string, any>) => Record<string, any>) | null;
    menu: HTMLElement | null;
    placement: string;
    reference: string | Element | Record<string, any>;
    strategy: string;
    submenuTrigger: string;
    submenuDelay: number;
};
/**
 * Class definition
 */
declare class Menu extends FloatingBase {
    static _openInstances: Set<Menu>;
    protected _config: MenuConfig;
    protected _parent: HTMLElement;
    protected _isSubmenu: boolean;
    protected _openSubmenus: Map<HTMLElement, () => void>;
    protected _submenuCloseTimeouts: Map<HTMLElement, number>;
    protected _hoverIntentSamples: Array<{
        x: number;
        y: number;
        t: number;
    }>;
    protected _menu: HTMLElement;
    protected _menuOriginalParent: ParentNode | null;
    constructor(element?: string | Element | null, config?: Partial<MenuConfig> | null);
    static get Default(): MenuConfig;
    static get DefaultType(): Record<string, string>;
    static get NAME(): string;
    toggle(): void;
    show(): void;
    hide(): void;
    dispose(): void;
    update(): void;
    protected _findMenu(): Element | null;
    protected _completeHide(relatedTarget: Record<string, unknown>): void;
    protected _getConfig(config?: ComponentConfig | null): ComponentConfig;
    protected _createFloating(): void;
    protected _updateFloatingPosition(referenceElement?: ReferenceElement | null): Promise<void>;
    protected _isShown(): boolean;
    protected _getPlacement(): string;
    protected _getDefaultPlacement(): string;
    protected _getFallbackPlacements(): Placement[];
    protected _getFloatingConfig(placement: string, middleware: Middleware[]): Record<string, any>;
    protected _getContainer(): HTMLElement | null;
    protected _moveMenuToContainer(): void;
    protected _restoreMenuToOriginalParent(): void;
    protected _applyFloatingPosition(reference: ReferenceElement, floating: HTMLElement, placement: Placement, middleware: Middleware[], strategy?: Strategy): Promise<string | null>;
    protected _setupSubmenuListeners(): void;
    protected _onSubmenuTriggerEnter(event: ChassisEvent): void;
    protected _onSubmenuLeave(event: ChassisEvent): void;
    protected _onSubmenuTriggerClick(event: ChassisEvent): void;
    protected _openSubmenu(trigger: HTMLElement, submenu: HTMLElement, submenuWrapper: Element): void;
    protected _onSubmenuBackClick(event: ChassisEvent): void;
    protected _closeSubmenu(submenu: HTMLElement, submenuWrapper: Element): void;
    protected _closeAllSubmenus(): void;
    protected _closeSiblingSubmenus(currentSubmenuWrapper: Element): void;
    protected _createSubmenuFloating(trigger: HTMLElement, submenu: HTMLElement, submenuWrapper: Element): () => void;
    protected _scheduleSubmenuClose(submenu: HTMLElement, submenuWrapper: Element): void;
    protected _cancelSubmenuCloseTimeout(submenu: HTMLElement): void;
    protected _clearAllSubmenuTimeouts(): void;
    protected _trackMousePosition(event: ChassisEvent): void;
    protected _isMovingTowardSubmenu(event: ChassisEvent, submenu: HTMLElement): boolean;
    protected _pointInTriangle(point: Point, v1: Point, v2: Point, v3: Point): boolean;
    protected _selectMenuItem({ key, target }: ChassisEvent): void;
    protected _handleSubmenuKeydown(event: ChassisEvent): boolean;
    static clearMenus(event: ChassisEvent): void;
    static dataApiKeydownHandler(this: HTMLElement, event: ChassisEvent): void;
}
export default Menu;
export type { MenuConfig };
//# sourceMappingURL=menu.d.ts.map