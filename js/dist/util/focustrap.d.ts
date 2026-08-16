/**
 * --------------------------------------------------------------------------
 * Chassis CSS util/focustrap.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */
import { type ChassisEvent } from '../dom/event-handler.js';
import Config from './config.js';
type FocusTrapConfig = {
    autofocus: boolean;
    trapElement: HTMLElement | null;
};
/**
 * Class definition
 */
declare class FocusTrap extends Config {
    protected _config: FocusTrapConfig;
    protected _isActive: boolean;
    protected _lastTabNavDirection: string | null;
    constructor(config?: Partial<FocusTrapConfig> | null);
    static get Default(): FocusTrapConfig;
    static get DefaultType(): Record<string, string>;
    static get NAME(): string;
    activate(): void;
    deactivate(): void;
    protected _handleFocusin(event: ChassisEvent): void;
    protected _handleKeydown(event: ChassisEvent): void;
}
export default FocusTrap;
export type { FocusTrapConfig };
//# sourceMappingURL=focustrap.d.ts.map