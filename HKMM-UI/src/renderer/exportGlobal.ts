import { CDN } from "./settings";

export const gl = window as any;

export const cdn_modlinks = ({
    "GITHUB_RAW": "https://raw.githubusercontent.com/HKLab/modlinks-archive/master/modlinks.json",
    "JSDELIVR": "https://cdn.jsdelivr.net/gh/HKLab/modlinks-archive@latest/modlinks.json",
    "SCARABCN": "https://hk-modlinks.clazex.net/ModLinks.xml"
} as Record<CDN, string>);

export const cdn_api = ({
    "GITHUB_RAW": "https://raw.githubusercontent.com/hk-modding/modlinks/main/ApiLinks.xml",
    "JSDELIVR": "https://cdn.jsdelivr.net/gh/hk-modding/modlinks@latest/ApiLinks.xml",
    "SCARABCN": "https://hk-modlinks.clazex.net/ApiLinks.xml"
} as Record<CDN, string>);
