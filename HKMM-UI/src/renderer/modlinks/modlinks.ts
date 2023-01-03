
import { remote } from 'electron';
import { readFileSync } from 'fs';
import { readJSONSync } from 'fs-extra';
import process from 'process';
import { Parser, ast } from 'tsxml'
import { cdn_api, cdn_modlinks } from '../exportGlobal';
import { isLaterVersion } from '../modManager';
import { isPackaged } from '../remoteCache';
import { CDN, store } from '../settings';
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
    link?: string;
    dependencies: string[];
    repository: string | undefined;
    integrations: string[];
    tags: ModTag[];
    authors: string[];
    date?: string;
    isDeleted?: boolean;
    alwaysLatest?: boolean;
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

export async function parseModLinks(content: string): Promise<ModCollection> {
    const result: ModCollection = {
        mods: {}
    };
    const xml = await Parser.parseString(content);
    const root = xml.getAst().childNodes[1] as ContainerNode;
    if (!root) throw 0;
    for (let i = 0; i < root.childNodes.length; i++) {
        const node = root.childNodes[i];
        if (node instanceof ast.CommentNode) continue;
        const manifest = node as ContainerNode;
        const mod: ModLinksManifestData = {
            name: "",
            desc: "",
            version: "",
            dependencies: [],
            repository: "",
            integrations: [],
            tags: [],
            authors: [],
            date: "1970-12-22T04:50:23Z",
            alwaysLatest: true
        };

        mod.name = getXmlNodeText(manifest, "Name") ?? "";
        mod.desc = getXmlNodeText(manifest, "Description") ?? "";
        mod.version = getXmlNodeText(manifest, "Version") ?? "";
        let tlink = getCDATANodeText(manifest, "Link");
        if (!tlink) {
            const nlinks = findXmlNode<ContainerNode>(manifest, "Links");
            tlink = nlinks ? getCDATANodeText(nlinks, currentPlatform) : undefined;
            if (!tlink) continue;
        }
        mod.link = tlink;

        const depNode = findXmlNode<ContainerNode>(manifest, "Dependencies");
        if (depNode && !(depNode instanceof ast.SelfClosingNode)) {
            for (let i2 = 0; i2 < depNode.childNodes.length; i2++) {
                const dep = (depNode.childNodes[i2] as ContainerNode).childNodes[0] as TextNode;
                mod.dependencies.push(dep.content);
            }
        }

        mod.repository = getCDATANodeText(manifest, "Repository");
        if (!mod.repository) {
            const url = new URL(tlink);
            if (url.hostname == 'github.com') {
                url.pathname = url.pathname.substring(0, url.pathname.indexOf('/releases/download/'));
                mod.repository = url.toString();
            }

        }

        const integrationsNode = findXmlNode<ContainerNode>(manifest, "Integrations");
        if (integrationsNode) {
            for (let i2 = 0; i2 < integrationsNode.childNodes.length; i2++) {
                const integration = (integrationsNode.childNodes[i2] as ContainerNode).childNodes[0] as TextNode;
                mod.integrations.push(integration.content);
            }
        }

        const tagsNode = findXmlNode<ContainerNode>(manifest, "Tags");
        if (tagsNode) {
            for (let i2 = 0; i2 < tagsNode.childNodes.length; i2++) {
                const tag = (tagsNode.childNodes[i2] as ContainerNode).childNodes[0] as TextNode;
                mod.tags.push(tag.content as ModTag);
            }
        }

        const authorsNode = findXmlNode<ContainerNode>(manifest, "Authors");
        if (authorsNode) {
            for (let i2 = 0; i2 < authorsNode.childNodes.length; i2++) {
                const author = (authorsNode.childNodes[i2] as ContainerNode).childNodes[0] as TextNode;
                mod.authors.push(author.content as ModTag);
            }
        }

        result.mods[mod.name] = {
            [mod.version]: mod
        };
    }
    return result;
}

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
    //const url = "https://raw.githubusercontent.com/HKLab/modlinks-archive/master/modlinks.json";
    //const url =  "https://cdn.jsdelivr.net/gh/HKLab/modlinks-archive@latest/modlinks.json";
    const url = cdn_modlinks[store.get('cdn', 'JSDELIVR')];
    let content: ModCollection = undefined as any;
    if (store.get('cdn') == 'SCARABCN') {
        content = await parseModLinks((await downloadFile<string>(url, undefined, undefined, false, "ModLinks", "Download")).data);
        try {
            const mc = (await downloadFile<ModCollection>(cdn_modlinks['JSDELIVR'])).data;
            const mods = content.mods;
            for (const key in mods) {
                const mod = mods[key];
                const cmod = mc.mods[key];
                const lv = Object.keys(mod)[0];
                for (const ver in cmod) {
                    if(isLaterVersion(ver, lv)) continue;
                    const cver = cmod[ver];
                    const v = mod[ver];
                    
                    if(v) {
                        cver.link = v.link;
                    } else {
                        cver.link = undefined;
                    }
                    mod[ver] = cver;
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
    else {
        if (navigator.onLine || isPackaged) content = (await downloadFile<ModCollection>(url, undefined, undefined, false, "ModLinks", "Download")).data;
        else {
            content = readJSONSync("F:\\HKLab\\ModLinksRecord\\modlinks.json", 'utf-8') as ModCollection;
        }
    }
    console.log(content);
    modlinksCache = new ModLinksData(content);
    modlinksCache.lastGet = new Date().valueOf();
    for (const key in content.mods) {
        const mv = content.mods[key];
        for (const ver in mv) {
            const v = mv[ver];
            if (!v.repository && v.link) {
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
    //const url = "https://cdn.jsdelivr.net/gh/hk-modding/modlinks@latest/ApiLinks.xml";
    const url = cdn_api[store.get('cdn', 'JSDELIVR')];
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
        if (!dm) continue;
        let lowestDate: number = undefined as any;
        let lowestMod: ModLinksManifestData = undefined as any;
        for (const key in dm) {
            const ver = dm[key];
            const vd = getModDate(ver.date ?? '');
            const ss = moddate - vd.valueOf();
            if (!lowestDate || !lowestMod) {
                lowestDate = ss;
                lowestMod = ver;
                if (ss < 0 && Math.abs(ss) < 1000 * 60 * 60) break;
                continue;
            }
            if (ss < 0) continue;
            if (lowestDate > ss || lowestDate < 0) {
                lowestDate = ss;
                lowestMod = ver;
            }
        }
        dep.push(lowestMod);
    }
    return dep;
}

