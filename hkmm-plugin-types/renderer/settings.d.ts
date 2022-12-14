import Store from 'electron-store';
import { PluginStatus } from './plugins';
export declare enum ModSavePathMode {
    AppDir = 0,
    UserDir = 1,
    Custom = 2,
    Gamepath = 3
}
export declare class MirrorItem {
    target: string;
}
export declare class MirrorGroup {
    items: MirrorItem[];
}
export declare type SettingOptions = 'SHOW_DELETED_MODS';
export declare class HKMMSettings {
    mirror_github: MirrorGroup;
    mirror_githubapi: MirrorGroup;
    enabled_exp_mode: boolean;
    gamepath: string;
    modsavepath: string;
    modsavepathMode: ModSavePathMode;
    inStore: boolean;
    modgroups: string[];
    current_modgroup: string;
    language?: string;
    options: SettingOptions[];
    plugins: string[];
    pluginsStatus: Record<string, PluginStatus>;
}
export declare const store: Store<HKMMSettings>;
export declare function hasOption(name: SettingOptions): boolean;
