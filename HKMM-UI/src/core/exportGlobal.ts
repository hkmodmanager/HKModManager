
import { readJSONSync } from "fs-extra";
import { join } from "path";
import { modfilesOffline } from "./offlineFileCache";
import { publicDir } from "./remoteCache";
import { CDN } from "./settings";

export const gl = window as any;

export interface IBuildMetadata {
    buildTime: number;
    headCommit: string;
    isTag: boolean;
    version: string;
}

export const cdn_modlinks: Record<CDN, string> = {
    "GITHUB_RAW": "https://raw.githubusercontent.com/hkmodmanager/modlinks-archive/master/modlinks.json",
    "JSDELIVR": "https://cdn.jsdelivr.net/gh/hkmodmanager/modlinks-archive@latest/modlinks.json",
    "SCARABCN": "https://hk-modlinks.clazex.net/ModLinks.xml",
    "GH_PROXY": "https://raw.githubusercontent.com/hkmodmanager/modlinks-archive/master/modlinks.json"
};

export const cdn_api: Record<CDN, string> = {
    "GITHUB_RAW": "https://raw.githubusercontent.com/hk-modding/modlinks/main/ApiLinks.xml",
    "JSDELIVR": "https://cdn.jsdelivr.net/gh/hk-modding/modlinks@latest/ApiLinks.xml",
    "SCARABCN": "https://hk-modlinks.clazex.net/ApiLinks.xml",
    "GH_PROXY": "https://raw.githubusercontent.com/hk-modding/modlinks/main/ApiLinks.xml"
};

export const localModFilesCache: string[] = modfilesOffline.getData()?.toString('utf-8').split('\n').map(x => x.trim()) ?? [];

export const buildMetadata: IBuildMetadata = readJSONSync(join(publicDir, "build-metadata.json"));

//@ts-ignore
gl.exportGlobal = __webpack_exports__;


export const currentPlatform: string = "Windows";
