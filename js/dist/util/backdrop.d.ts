/**
 * --------------------------------------------------------------------------
 * Chassis CSS util/backdrop.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */
import Config from './config.js';
type BackdropConfig = {
    className: string;
    clickCallback: (() => void) | null;
    isAnimated: boolean;
    isVisible: boolean;
    rootElement: HTMLElement | string | null;
};
/**
 * Class definition
 */
declare class Backdrop extends Config {
    protected _config: BackdropConfig;
    protected _isAppended: boolean;
    protected _element: HTMLElement | null;
    constructor(config?: Partial<BackdropConfig> | null);
    static get Default(): BackdropConfig;
    static get DefaultType(): Record<string, string>;
    static get NAME(): string;
    show(callback?: () => void): void;
    hide(callback?: () => void): void;
    dispose(): void;
    protected _getElement(): HTMLElement;
    protected _configAfterMerge(config: BackdropConfig): BackdropConfig;
    protected _append(): void;
    protected _emulateAnimation(callback: () => void): void;
}
export default Backdrop;
export type { BackdropConfig };
//# sourceMappingURL=backdrop.d.ts.map