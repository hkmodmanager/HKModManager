
import { Guid } from 'guid-typescript';
import { join } from 'path';
import { Parser, ast } from 'tsxml'
import { IModMetadata } from '../data/IModMetadata';
import { cdn_api, currentPlatform } from '../exportGlobal';
import {  refreshLocalMods } from '../modManager';
import { userData } from '../remoteCache';
import { hasOption, store } from '../settings';
import { downloadText } from '../utils/downloadFile';
import { ContainerNode, findXmlNode, getCDATANodeText, getXmlNodeText, TextNode } from '../utils/xml';
import { GithubModLinksProvider } from './GithubModLinksProvider';
import { ModLinksArchiveProvider } from './ModLinksArchiveProvider';
import { ModLinksProvider } from './ModLinksProvider';
import { OfflineModLinksArchiveProvider } from './OfflineModLinksArchiveProvider';


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

export interface ModLinksManifestData extends IModMetadata {
    desc: string;
    displayName?: string;
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


export class ModdingAPIData {
    public link: string = "";
    public version: number = 0;
    public lastGet: number = 0;
    public files: string[] = [];
}

export function getLocalModLinksPath() {
    return join(userData, 'offline_modlinks.json');
}

export let provider: ModLinksProvider = new ModLinksArchiveProvider();

export function fixModLinks(modlinks: ModCollection) {
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

export function refreshModLinksProvider() {
    if (!navigator.onLine) {
        if(!(provider instanceof OfflineModLinksArchiveProvider)) {
            provider = new OfflineModLinksArchiveProvider();
        }
    }
    else
    {
        if(hasOption('CUSTOM_MODLINKS')) {
            if(!(provider instanceof GithubModLinksProvider)) {
                provider = new GithubModLinksProvider(store.store.customModLinks);
            }
        }
        else
        {
            if(!(provider instanceof ModLinksArchiveProvider)
                || provider.isOffline()) {
                provider = new ModLinksArchiveProvider();
            }
        }
    }
}

export async function getModLinksFromRepo() {
    refreshModLinksProvider();
    try {
        await provider.tryFetchData();
    } catch (e) {
        console.error(e);
    }
    return provider;
}

export async function getModLinks() {
    return getModLinksFromRepo();
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
    if (!provider) return undefined;
    return provider.getMod(name);
}

export function getModDate(date?: string) {
    if (!date) return new Date(0);
    const parts = date.split('T');
    const day = parts[0].split('-');
    const time = parts[1].replaceAll('Z', '').split(':');
    const d = new Date(Number.parseInt(day[0]), Number.parseInt(day[1]) - 1, Number.parseInt(day[2]),
        Number.parseInt(time[0]), Number.parseInt(time[1]), Number.parseInt(time[2])
    );
    return d;
}

export function getLowestDep(mod: ModLinksManifestData) {
    return provider.getLowestDependencies(mod);
}

export function tryRefreshOldLocalMods() {
    if (!provider) return;
    const mods = refreshLocalMods();
    for (const modname in mods) {
        const lmod = mods[modname];
        const mlmod = provider.getMod(modname);
        if (!mlmod) continue;
        for (const ver in lmod.versions) {
            const lver = lmod.versions[ver];
            const mlver = provider.getMod(modname, ver);
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
    if (!provider) return false;
    return (getModLinkModSync("HKTool")?.ei_files || getModLinkModSync("Satchel")?.ei_files || getModLinkModSync("Vasi")?.ei_files) != undefined;
}

export function getSubMods_ModLinks(name: string) {
    if (!provider) return [];
    const result: ModLinksManifestData[] = [];
    for (const key in provider.getAllModNames()) {
        const mod = getModLinkModSync(key);
        if (!mod || mod.isDeleted) continue;
        if (mod.dependencies.includes(name)) result.push(mod);
    }
    return result;
}

export function getIntegrationsMods_ModLinks(name: string) {
    if (!provider) return [];

    const self = getModLinkModSync(name);
    if (!self) return [];
    const result: ModLinksManifestData[] = [];
    const names: string[] = [];
    for (const key in provider.getAllModNames()) {
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

export function fixModLinksManifestData(info: ModLinksManifestData) {
    const fillArrayName: (keyof ModLinksManifestData)[] = ['dependencies', 'authors', 'integrations', 'tags'];
    let shouldSave = false;
    for (let i = 0; i < fillArrayName.length; i++) {
        const el = fillArrayName[i];
        if(!info[el]) {
            shouldSave = true;
            (info[el] as any) = [];
        }
    }
    if(!info.name) {
        info.name = Guid.create().toString();
        shouldSave = true;
    }
    if(!info.version) {
        info.version = "0.0.0.0";
        shouldSave = true;
    }
    return shouldSave;
}

export function generateInstallURL(info: ModLinksManifestData) {
    const url = new URL("hkmm://install.mod");
    url.searchParams.set("metadata64", Buffer.from(JSON.stringify(info)).toString('base64url'));
    return url;
}

window.addEventListener('online', () => {
    getModLinksFromRepo();
});
