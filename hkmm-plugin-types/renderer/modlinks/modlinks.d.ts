export declare type ModTag = "Boss" | "Cosmetic" | "Expansion" | "Gameplay" | "Library" | "Utility";
export declare let currentPlatform: string;
export interface ModLinksManifestData {
    name: string;
    desc: string;
    version: string;
    link: string;
    dependencies: string[];
    repository: string | undefined;
    integrations: string[];
    tags: ModTag[];
    authors: string[];
    date?: string;
    isDeleted?: boolean;
}
export declare type ModVersionCollection = Record<string, ModLinksManifestData>;
export interface ModCollection {
    mods: Record<string, ModVersionCollection>;
    latestCommit?: string;
}
export declare class ModLinksData {
    mods: ModCollection;
    constructor(mods: ModCollection);
    lastGet: number;
    getModVersions(name: string): ModVersionCollection | undefined;
    getAllModNames(): string[];
    getMod(name: string, version?: string): ModLinksManifestData | undefined;
}
export declare class ModdingAPIData {
    link: string;
    version: number;
    lastGet: number;
    files: string[];
}
export declare let modlinksCache: ModLinksData | undefined;
export declare function getModLinksFromRepo(): Promise<ModLinksData>;
export declare function getModLinks(): Promise<ModLinksData>;
export declare let apiInfoCache: ModdingAPIData | undefined;
export declare function getAPIInfoFromRepo(): Promise<ModdingAPIData>;
export declare function getAPIInfo(): Promise<ModdingAPIData>;
export declare function getModLinkMod(name: string): Promise<ModLinksManifestData | undefined>;
export declare function getModLinkModSync(name: string): ModLinksManifestData | undefined;
