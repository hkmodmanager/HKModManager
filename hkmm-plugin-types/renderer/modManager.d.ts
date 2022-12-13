import { ModLinksManifestData } from "./modlinks/modlinks";
import { TaskInfo } from "./taskManager";
import "./apiManager";
export declare const modversionFileName = "modversion.json";
export declare function getModsRoot(): string;
export declare function getModsPath(name: string): string;
export declare function getCacheModsPath(): string;
export declare class LocalModInfo {
    name: string;
    version: string;
    install: number;
    path: string;
    files: string[];
    modinfo: ModLinksManifestData;
}
export declare class LocalModInstance {
    info: LocalModInfo;
    isActived(): boolean;
    private fixOld;
    fillFileNames(): void;
    install(addToCurrentGroup?: boolean, installedSet?: Set<string>): void;
    uninstall(force?: boolean): void;
    canInstall(): boolean;
    checkDependencies(): Promise<void>;
    save(): void;
    static loadForm(path: string): LocalModInstance | undefined;
    constructor(info: LocalModInfo);
}
export declare class LocalModsVersionGroup {
    static downloadingMods: Map<string, Promise<any>>;
    versions: Record<string, LocalModInstance>;
    versionsArray: LocalModInstance[];
    name: string;
    getLatestVersion(): string | undefined;
    getLatest(): LocalModInstance | undefined;
    static loadForm(path: string): LocalModsVersionGroup;
    installWithoutNewTask(mod: ModLinksManifestData, task: TaskInfo): Promise<LocalModInstance>;
    installNew(mod: ModLinksManifestData, justCheckDep?: boolean): Promise<LocalModInstance>;
    isActived(): boolean;
    disableAll(): void;
    canEnable(): boolean;
    uninstall(versions?: string[]): void;
    isInstalled(): boolean;
    installLocalMod(mod: LocalModInfo, root: string): boolean;
}
export declare let localMods: Record<string, LocalModsVersionGroup>;
export declare let localModsArray: LocalModsVersionGroup[];
export declare function refreshLocalMods(force?: boolean): Record<string, LocalModsVersionGroup>;
export declare function getLocalMod(name: string): LocalModsVersionGroup;
export declare function getOrAddLocalMod(name: string): LocalModsVersionGroup;
export declare function isLaterVersion(a: string, b: string): boolean;
export declare function getSubMods(name: string, onlyLatest?: boolean): LocalModInstance[];
export declare function isDownloadingMod(name: string): boolean;
export declare function getRequireUpdateModsSync(): string[];
