import { readJSONSync } from "fs-extra";
import { join } from "path";
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
    "GITHUB_RAW": "https://raw.githubusercontent.com/HKLab/modlinks-archive/master/modlinks.json",
    "JSDELIVR": "https://cdn.jsdelivr.net/gh/HKLab/modlinks-archive@latest/modlinks.json",
    "SCARABCN": "https://hk-modlinks.clazex.net/ModLinks.xml"
};

export const cdn_api: Record<CDN, string> = {
    "GITHUB_RAW": "https://raw.githubusercontent.com/hk-modding/modlinks/main/ApiLinks.xml",
    "JSDELIVR": "https://cdn.jsdelivr.net/gh/hk-modding/modlinks@latest/ApiLinks.xml",
    "SCARABCN": "https://hk-modlinks.clazex.net/ApiLinks.xml"
};

export const buildMetadata: IBuildMetadata = readJSONSync(join(publicDir, "build-metadata.json"));
