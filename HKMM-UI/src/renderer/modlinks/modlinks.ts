
import process from 'process';
import { Parser, ast } from 'tsxml'
import { isLaterVersion } from '../modManager';
import { downloadFile, downloadText } from '../utils/downloadFile';

type ContainerNode = ast.ContainerNode<ast.Node>;
type TextNode = ast.TextNode;
type CDataNode = ast.CDataSectionNode;

export type ModTag = "Boss" | "Cosmetic" | "Expansion" | "Gameplay" | "Library" | "Utility";

export let currentPlatform: string = "";
const cp = process.platform;
if (cp == "win32") currentPlatform = "Windows";
else if (cp == "darwin") currentPlatform = "Mac";
else if (cp == "linux") currentPlatform = "Linux";

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

export type ModVersionCollection = Record<string, ModLinksManifestData>;


export interface ModCollection {
    mods: Record<string, ModVersionCollection>;
    latestCommit?: string;
}


export class ModLinksData {
    public constructor(public mods: ModCollection) { }
    public lastGet: number = 0;
    public getModVersions(name: string): ModVersionCollection | undefined {
        return this.mods.mods[name];
    }
    public getAllModNames() {
        return Object.keys(this.mods.mods);
    }
    public getMod(name: string, version?: string) {
        const ver = this.getModVersions(name);
        if (!ver) return undefined;
        let latest = "0.0.0.0";
        for (const v in ver) {
            if (isLaterVersion(v, latest)) {
                latest = v;
            }
        }
        return ver[latest];
    }
}

export class ModdingAPIData {
    public link: string = "";
    public version: number = 0;
    public lastGet: number = 0;
    public files: string[] = [];
}

function findXmlNode<T = Node>(parent: ContainerNode, tagName: string): T | undefined {
    return (parent.childNodes.find(x => x.tagName === tagName) as (T | undefined));
}

function getXmlNodeText(parent: ContainerNode, tagName: string): string | undefined {
    return (findXmlNode<ContainerNode>(parent, tagName)?.childNodes[0] as (TextNode | undefined))?.content;
}

function getCDATANodeText(parent: ContainerNode, tagName: string): string | undefined {
    return (findXmlNode<ContainerNode>(parent, tagName)?.childNodes[0] as (CDataNode | undefined))?.content;
}

let promise_get_modlinks: Promise<ModLinksData> | undefined;
export let modlinksCache: ModLinksData | undefined;

export async function getModLinksFromRepo() {
    if (promise_get_modlinks) {
        return await promise_get_modlinks;
    }
    if (modlinksCache) {
        const ts = new Date().valueOf() - modlinksCache.lastGet;
        if (ts < 3600000) {
            promise_get_modlinks = undefined;
            return modlinksCache;
        }
    }
    const url = "https://raw.githubusercontent.com/HKLab/modlinks-archive/master/modlinks.json";
    const content = await downloadFile<ModCollection>(url, undefined, undefined, false, "ModLinks", "Download");
    modlinksCache = new ModLinksData(content.data);
    modlinksCache.lastGet = new Date().valueOf();
    for (const key in content.data.mods) {
        const mv = content.data.mods[key];
        for (const ver in mv) {
            const v = mv[ver];
            if (!v.repository) {
                const url = new URL(v.link);
                if (url.hostname == 'github.com') {
                    url.pathname = url.pathname.substring(0, url.pathname.indexOf('/releases/download/'));
                    v.repository = url.toString();
                }
            }
        }
    }
    promise_get_modlinks = undefined;
    return modlinksCache;
}

export async function getModLinks() {
    const p = promise_get_modlinks ?? getModLinksFromRepo();
    promise_get_modlinks = p;
    if (!modlinksCache) return await p;
    return p;
}

let promise_get_api: Promise<ModdingAPIData> | undefined;
export let apiInfoCache: ModdingAPIData | undefined;

export async function getAPIInfoFromRepo() {
    if (promise_get_api) {
        return await promise_get_api;
    }
    if (apiInfoCache) {
        const ts = new Date().valueOf() - apiInfoCache.lastGet;
        if (ts < 10000) {
            promise_get_api = undefined;
            return apiInfoCache;
        }
    }
    const url = "https://raw.githubusercontent.com/hk-modding/modlinks/main/ApiLinks.xml";
    const content = await downloadText(url, undefined, undefined, false, "ModLinks - APIInfo", "Download");
    const xml = await Parser.parseString(content);
    const manifest = (<ContainerNode>xml.getAst().childNodes[1]).childNodes[0] as ContainerNode;
    const result = new ModdingAPIData();
    const version = getXmlNodeText(manifest, "Version");
    if (!version) throw "Invalid ApiLinks.xml";
    result.version = Number.parseInt(version);

    const links = findXmlNode<ContainerNode>(manifest, "Links");
    if (!links) throw new Error("Invalid ApiLinks.xml");

    const link = getCDATANodeText(links, currentPlatform);
    if (!link) throw new Error("Invalid ApiLinks.xml");

    const files = findXmlNode<ContainerNode>(manifest, "Files");
    if (!files) throw new Error("Invalid ApiLinks.xml");
    for (const node of files.childNodes) {
        const text = (node as ast.ContainerNode<TextNode>).childNodes[0].content;
        result.files.push(text);
    }


    result.link = link;
    result.lastGet = new Date().valueOf();
    localStorage.setItem("cache-api-info", JSON.stringify(result));
    return apiInfoCache = result;
}

export async function getAPIInfo() {
    const p = promise_get_api ?? getAPIInfoFromRepo();
    promise_get_api = p;
    if (!apiInfoCache) return await p;
    return p;
}

getAPIInfoFromRepo();
getModLinksFromRepo();

export async function getModLinkMod(name: string) {
    const modlinks = await getModLinks();
    return modlinks.getMod(name);
}

export function getModLinkModSync(name: string) {
    if (!modlinksCache) return undefined;
    return modlinksCache.getMod(name);
}

export function getModDate(date: string) {
    const parts = date.split('T');
    const day = parts[0].split('-');
    const time = parts[1].replaceAll('Z', '').split(':');
    const d = new Date(Number.parseInt(day[0]), Number.parseInt(day[1]) - 1, Number.parseInt(day[2]),
        Number.parseInt(time[0]), Number.parseInt(time[1]), Number.parseInt(time[2])
    );
    return d;
}

export function getLowestDep(mod: ModLinksManifestData) {
    if (!modlinksCache || !mod.date) return undefined;
    const moddate = getModDate(mod.date).valueOf();
    const dep: ModLinksManifestData[] = [];
    for (const d of mod.dependencies) {
        const dm = modlinksCache.getModVersions(d);
        if(!dm) continue;
        let lowestDate: number = undefined as any;
        let lowestMod: ModLinksManifestData =  undefined as any;
        for (const key in dm) {
            const ver = dm[key];
            const vd = getModDate(ver.date ?? '');
            const ss = moddate - vd.valueOf();
            if(!lowestDate || !lowestMod) {
                lowestDate = ss;
                lowestMod = ver;
                continue;
            }
            if(ss < 0) continue;
            if(lowestDate > ss || lowestDate < 0) {
                lowestDate = ss;
                lowestMod = ver;
            }
        }
        dep.push(lowestMod);
    }
    return dep;
}

