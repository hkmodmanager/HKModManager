export declare const node_require: any;
export declare const webpack_require: any;
export declare const allPlugins: IHKMMPlugin[];
export declare function getCompileCacheDir(): string;
export declare class PluginStatus {
    enabled: boolean;
}
export declare class PluginContext {
    status: PluginStatus;
    private pluginName;
    constructor(status: PluginStatus, pluginName: string);
    save(): void;
    setActive(a?: boolean): void;
}
export interface IHKMMPlugin {
    name: string;
    displayName: string;
    enable(): void;
    disable(): void;
    context: PluginContext;
    author: string;
}
export declare function plugin_require(name: string, dir: string): any;
export declare function findPlugin(name: string): IHKMMPlugin | undefined;
export declare function getPluginStatus(name: string): PluginStatus;
export declare function loadPlugin(path: string | any): IHKMMPlugin;
