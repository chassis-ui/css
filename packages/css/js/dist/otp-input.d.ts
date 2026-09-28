/**
 * --------------------------------------------------------------------------
 * Chassis CSS otp-input.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */
import BaseComponent from './base-component.js';
import { type ChassisEvent } from './dom/event-handler.js';
type OtpInputConfig = {
    length: number;
    mask: boolean;
};
/**
 * Class definition
 */
declare class OtpInput extends BaseComponent {
    protected _config: OtpInputConfig;
    protected _inputs: HTMLInputElement[];
    constructor(element?: string | Element | null, config?: Partial<OtpInputConfig> | null);
    static get Default(): OtpInputConfig;
    static get DefaultType(): Record<string, string>;
    static get NAME(): string;
    getValue(): string;
    setValue(value: string | number): void;
    clear(): void;
    focus(): void;
    protected _setupInputs(): void;
    protected _addEventListeners(): void;
    protected _handleInput(event: ChassisEvent, index: number): void;
    protected _handleKeydown(event: ChassisEvent, index: number): void;
    protected _handlePaste(event: ChassisEvent): void;
    protected _handleFocus(event: ChassisEvent): void;
    protected _checkComplete(): void;
}
export default OtpInput;
export type { OtpInputConfig };
//# sourceMappingURL=otp-input.d.ts.map