/**
 * --------------------------------------------------------------------------
 * Chassis CSS util/config.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */
/**
 * Types
 */
type ComponentConfig = Record<string, any>;
/**
 * Class definition
 */
declare class Config<TConfig extends ComponentConfig = ComponentConfig> {
    ['constructor']: typeof Config<any>;
    static get Default(): ComponentConfig;
    static get DefaultType(): ComponentConfig;
    static get NAME(): string;
    protected _getConfig(config?: Partial<TConfig> | null): TConfig;
    protected _configAfterMerge(config: TConfig): TConfig;
    protected _mergeConfigObj(config?: Partial<TConfig> | null, element?: Element): TConfig;
    protected _excludedConfigKeys(): string[];
    protected _typeCheckConfig(config: ComponentConfig, configTypes?: ComponentConfig): void;
}
export default Config;
export type { ComponentConfig };
//# sourceMappingURL=config.d.ts.map