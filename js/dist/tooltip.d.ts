/**
 * --------------------------------------------------------------------------
 * Chassis CSS tooltip.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */
import FloatingBase from './floating-base.js';
import { type ChassisEvent } from './dom/event-handler.js';
import type { ComponentConfig } from './util/config.js';
import { type SanitizerAllowList } from './util/sanitizer.js';
import TemplateFactory, { type TemplateContentEntry } from './util/template-factory.js';
type TooltipConfig = {
    allowList: SanitizerAllowList;
    animation: boolean;
    boundary: string | Element;
    container: string | Element | boolean;
    customClass: string | ((...args: any[]) => string);
    delay: number | {
        show: number;
        hide: number;
    };
    fallbackPlacements: string[];
    html: boolean;
    offset: number[] | string | ((...args: any[]) => any);
    placement: string | ((this: Tooltip, tip: HTMLElement, trigger: HTMLElement) => string);
    floatingConfig: Record<string, any> | ((...args: any[]) => Record<string, any>) | null;
    sanitize: boolean;
    sanitizeFn: ((unsafeHtml: string) => string) | null;
    selector: string | boolean;
    template: string;
    title: string | Element | ((...args: any[]) => string | Element);
    trigger: string;
};
/**
 * Class definition
 */
declare class Tooltip extends FloatingBase {
    ['constructor']: typeof Tooltip;
    protected _config: TooltipConfig;
    protected _isEnabled: boolean;
    protected _timeout: ReturnType<typeof setTimeout> | number;
    protected _isHovered: boolean | null;
    protected _activeTrigger: Record<string, boolean>;
    protected _templateFactory: TemplateFactory | null;
    protected _newContent: Record<string, TemplateContentEntry> | null;
    protected _hideModalHandler: () => void;
    tip: HTMLElement | null;
    constructor(element?: string | Element | null, config?: Partial<TooltipConfig> | null);
    static get Default(): TooltipConfig;
    static get DefaultType(): Record<string, string>;
    static get NAME(): string;
    enable(): void;
    disable(): void;
    toggleEnabled(): void;
    toggle(): void;
    dispose(): void;
    show(): Promise<void>;
    hide(): void;
    update(): void;
    protected _isWithContent(): boolean;
    protected _getTipElement(): HTMLElement;
    protected _createTipElement(content: Record<string, TemplateContentEntry>): HTMLElement;
    setContent(content: Record<string, TemplateContentEntry>): void;
    protected _getTemplateFactory(content: Record<string, TemplateContentEntry>): TemplateFactory;
    protected _getContentForTemplate(): Record<string, TemplateContentEntry>;
    protected _getTitle(): string | Element | null;
    protected _initializeOnDelegatedTarget(event: ChassisEvent): Tooltip;
    protected _isAnimated(): boolean | null;
    protected _isShown(): boolean;
    protected _getPlacement(tip: HTMLElement): string;
    protected _getDefaultPlacement(): string;
    protected _createFloating(tip: HTMLElement): Promise<void>;
    protected _updateFloatingPosition(tip?: HTMLElement | null, placement?: string | null, arrowElement?: HTMLElement | null): Promise<void>;
    protected _resolvePossibleFunction<T>(arg: T | ((...args: any[]) => T)): T;
    protected _setListeners(): void;
    protected _fixTitle(): void;
    protected _enter(): void;
    protected _leave(): void;
    protected _setTimeout(handler: () => void, timeout: number): void;
    protected _isWithActiveTrigger(): boolean;
    protected _getConfig(config?: ComponentConfig | null): ComponentConfig;
    protected _configAfterMerge(config: ComponentConfig): ComponentConfig;
    protected _getDelegateConfig(): ComponentConfig;
    protected _disposeFloating(): void;
}
export default Tooltip;
export type { TooltipConfig };
//# sourceMappingURL=tooltip.d.ts.map