/// <reference types="node" />
import { zip } from "compressing";
import { URL } from "url";
import { ModdingAPIData } from "./modlinks/modlinks";
import { LocalModInfo, LocalModInstance } from "./modManager";
export declare const metadata_name = "[hkmm-metadata].json";
export declare function getGroupPath(): string;
export declare function getGroupPath2(guid: string): string;
export declare class ExportedModGroupMetadata {
    info: ModGroupInfo;
    mods: LocalModInfo[];
    options?: IExportModGroupZipOptions;
    api?: ModdingAPIData;
}
export declare class ModGroupInfo {
    name: string;
    guid: string;
    mods: [string, string][];
}
export interface IExportModGroupZipOptions {
    includeAPI?: boolean;
    fullPath?: boolean;
    onlyModFiles?: boolean;
    includeMetadata?: boolean;
}
export declare class ModGroupController {
    info: ModGroupInfo;
    save(): void;
    addMod(name: string, ver: string): void;
    removeMod(name: string): void;
    getLocalMods(): LocalModInstance[];
    getModNames(): [string, string][];
    constructor(info: ModGroupInfo);
    static loadForm(path: string): ModGroupController;
    getShareUrl(): URL;
    canUseGroup(): boolean;
    exportAsZip(output: zip.Stream, options?: IExportModGroupZipOptions): zip.Stream;
}
export declare function isInstalled(mod: [string, string]): boolean;
export declare const groupCache: Record<string, ModGroupController>;
export declare function changeCurrentGroup(guid: string): void;
export declare function getCurrentGroup(): ModGroupController;
export declare function getGroup(guid: string): ModGroupController | undefined;
export declare function getAllGroupGuids(): string[];
export declare function getAllGroups(): ModGroupController[];
export declare function saveGroups(): void;
export declare function getOrCreateGroup(guid?: string, name?: string): ModGroupController;
export declare function removeGroup(guid: string): void;
export declare function getDefaultGroup(): ModGroupController;
export declare function importGroup(source: URL | ModGroupInfo): void;
export declare function importFromHKMG(path: string): void;
export declare function importFromZip(source: string | Buffer): Promise<void>;
