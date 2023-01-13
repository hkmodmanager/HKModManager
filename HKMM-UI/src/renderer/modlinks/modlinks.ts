
import { remote } from 'electron';
import { existsSync, readFileSync } from 'fs';
import { readJSON, readJSONSync, writeJSONSync } from 'fs-extra';
import { dirname, join } from 'path';
import process from 'process';
import { Parser, ast } from 'tsxml'
import { cdn_api, cdn_modlinks } from '../exportGlobal';
import { isLaterVersion, refreshLocalMods } from '../modManager';
import { appDir, isPackaged, publicDir, srcRoot, userData } from '../remoteCache';
import { CDN, store } from '../settings';
import { downloadFile, downloadText } from '../utils/downloadFile';
import { PromiseTimeout } from '../utils/utils';

type ContainerNode = ast.ContainerNode<ast.Node>;
type TextNode = ast.TextNode;
type CDataNode = ast.CDataSectionNode;

export const currentPlatform: string = "Windows";

export interface ModFileRecord {
    files?: Record<string, string>;
    link: string;
    size?: number;
    noSource?: boolean;
    sha256?: string;
}

export type ModTag = "Boss" | "Cosmetic" | "Expansion" | "Gameplay" | "Library" | "Utility";

export interface ModCollection {
    mods: Record<string, ModVersionCollection>;
    latestCommit?: string;
    saveDate?: number;
    lastUpdate?: number;
}

export type ModVersionCollection = Record<string, ModLinksManifestData>;

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

    ei_files?: ModFileRecord;


    owner?: string;
}


export class ModLinksData {
    public constructor(public mods: ModCollection, public offline = false) { }
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
        if (version) return ver[version];
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

export function getLocalModLinksPath() {
    return join(userData, 'offline_modlinks.json');
}

function fixModLinks(modlinks: ModCollection) {
    const mods = modlinks.mods;
    for (const name in mods) {
        const mod = mods[name];
        for (const ver in mod) {
            const mv = mod[ver];
            if (mv.repository) {
                const repo = getModRepo(mv.repository);
                if (repo) {
                    mv.owner = repo[0];
                }
            }
        }
    }
}

function loadLocalModLinks() {
    const offlinePath = join(publicDir, 'offline', 'modlinks.json');
    console.log(`[ModLinks]internal offline data: ${offlinePath}`);
    const result = readJSONSync(offlinePath) as ModCollection;
    const internalDate = result.lastUpdate ?? result.saveDate;
    if (existsSync(getLocalModLinksPath())) {
        const local = readJSONSync(getLocalModLinksPath()) as ModCollection;
        const localDate = local.lastUpdate ?? result.saveDate;
        if (localDate) {
            if (!internalDate || localDate) {
                fixModLinks(local);
                return local;
            }
        }
    }
    fixModLinks(result);
    saveLocalModLinks(result);
    return result;
}

function saveLocalModLinks(data: ModCollection) {
    data = { ...data };
    data.saveDate = Date.now();
    writeJSONSync(getLocalModLinksPath(), data, {
        spaces: 4
    });
}

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
            date: "1970-12-22T04:50:23Z"
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

export async function getModLinksFromRepo(force = false) {
    if (promise_get_modlinks) {
        return await promise_get_modlinks;
    }

    if (modlinksCache && !force) {
        if (!navigator.onLine && modlinksCache.offline) return modlinksCache;
        if (!modlinksCache.offline) {
            const ts = new Date().valueOf() - modlinksCache.lastGet;
            if (ts < 3600000) {
                promise_get_modlinks = undefined;
                return modlinksCache;
            }
        }
    }
    if (!navigator.onLine) {
        return modlinksCache = new ModLinksData(loadLocalModLinks(), true);
    }
    try {
        //const url = "https://raw.githubusercontent.com/HKLab/modlinks-archive/master/modlinks.json";
        //const url =  "https://cdn.jsdelivr.net/gh/HKLab/modlinks-archive@latest/modlinks.json";
        const url = cdn_modlinks[store.get('cdn', 'JSDELIVR')];
        let content: ModCollection = undefined as any;
        if (store.get('cdn') == 'SCARABCN') {
            content = await parseModLinks((await downloadText(url, undefined, undefined, false, "ModLinks", "Download")));
            try {
                let mcontent = await Promise.race([
                    downloadText(cdn_modlinks['GITHUB_RAW']),
                    PromiseTimeout<false>(4000, false)
                ]);
                if (mcontent == false) {
                    console.log(`Try load cdn`);
                    mcontent = await Promise.race([
                        downloadText(cdn_modlinks['JSDELIVR'], undefined, undefined, undefined),
                        PromiseTimeout<false>(40000, false)
                    ]);
                } else {
                    saveLocalModLinks(JSON.parse(mcontent));
                }
                if (mcontent != false) {
                    const mc = JSON.parse(mcontent) as ModCollection;
                    const mods = content.mods;
                    for (const key in mods) {
                        const mod = mods[key];
                        const cmod = mc.mods[key];
                        const lv = Object.keys(mod)[0];
                        for (const ver in cmod) {
                            if (isLaterVersion(ver, lv)) continue;
                            const cver = cmod[ver];
                            const v = mod[ver];

                            if (v) {
                                cver.link = v.link;
                            } else {
                                cver.link = undefined;
                            }
                            mod[ver] = cver;
                        }
                    }
                } else {
                    console.log("[ModLink] GITHUB_RAW Timeout");
                }
            } catch (e) {
                console.error(e);
            }
        }
        else {
            content = JSON.parse(await downloadText(url, undefined, undefined, false, "ModLinks", "Download"));
            saveLocalModLinks(content);
        }
        fixModLinks(content);
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
        try {
            tryRefreshOldLocalMods();
        } catch (e) {
            console.error(e);
        }
        return modlinksCache;
    } catch (e) {
        console.error(e);
        return modlinksCache = new ModLinksData(loadLocalModLinks(), true);
    }
}

export async function getModLinks(force = false) {
    const p = promise_get_modlinks ?? getModLinksFromRepo(force);
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

export function tryRefreshOldLocalMods() {
    if (!modlinksCache) return;
    const mods = refreshLocalMods();
    for (const modname in mods) {
        const lmod = mods[modname];
        const mlmod = modlinksCache.mods.mods[modname];
        if (!mlmod) continue;
        for (const ver in lmod.versions) {
            const lver = lmod.versions[ver];
            const mlver = mlmod[ver];
            if (!mlver) continue;
            const linfo = lver.info.modinfo;
            if (!linfo.ei_files) {
                linfo.ei_files = mlver.ei_files;
                lver.save();
            }
            if (!linfo.owner) {
                linfo.owner = mlver.owner;
                lver.save();
            }
        }
    }
}

export function hasModLink_ei_files() {
    if (!modlinksCache) return false;
    return (getModLinkModSync("HKTool")?.ei_files || getModLinkModSync("Satchel")?.ei_files || getModLinkModSync("Vasi")?.ei_files) != undefined;
}

export function getSubMods_ModLinks(name: string) {
    if (!modlinksCache) return [];
    const result: ModLinksManifestData[] = [];
    for (const key in modlinksCache.mods.mods) {
        const mod = getModLinkModSync(key);
        if (!mod || mod.isDeleted) continue;
        if (mod.dependencies.includes(name)) result.push(mod);
    }
    return result;
}

export function getIntegrationsMods_ModLinks(name: string) {
    if (!modlinksCache) return [];

    const self = getModLinkModSync(name);
    if (!self) return [];
    const result: ModLinksManifestData[] = [];
    const names: string[] = [];
    for (const key in modlinksCache.mods.mods) {
        const mod = getModLinkModSync(key);
        if (!mod || names.includes(key) || mod.isDeleted) continue;
        names.push(key);
        if (mod.integrations.includes(name) || self.integrations.includes(key)) result.push(mod);
    }

    return result;
}

export function getModRepo(repo: string): [string, string] | undefined {
    const url = new URL(repo);
    if (url.hostname != "github.com") return undefined;
    const parts = url.pathname.split('/');
    return [parts[1], parts[2]];
}

window.addEventListener('online', () => {
    if (!modlinksCache || modlinksCache.offline) {
        getModLinksFromRepo(true);
    }
});
