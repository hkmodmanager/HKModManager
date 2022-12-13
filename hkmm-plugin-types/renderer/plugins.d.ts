export declare const node_require: any;
export declare const webpack_require: any;
export declare const allPlugins: IHKMMPlugin[];
export declare function getCompileCacheDir(): string;
export interface IHKMMPlugin {
    name: string;
    enable(): void;
    disable(): void;
    desc: string;
    author: string;
}
export declare function plugin_require(name: string, dir: string): any;
export declare function findPlugin(name: string): IHKMMPlugin | undefined;
export declare function loadPlugin(path: string): IHKMMPlugin;
