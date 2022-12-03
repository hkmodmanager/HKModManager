import { zip } from "compressing";
import { fstat, readdirSync, readFileSync, stat, statSync } from "fs";
import { Guid } from "guid-typescript";
import { dirname, join } from "path";
import { URL } from "url";
import { getAPIPath, getAPIVersion } from "./apiManager";
import { apiInfoCache, getModLinkMod, ModLinksManifestData } from "./modlinks/modlinks";
import { getLocalMod, isLaterVersion, LocalModInstance, localMods, localModsArray, modversionFileName, refreshLocalMods } from "./modManager";


export class ModGroupInfo {
    public name: string = "";
    public guid: string = "";
    public mods: [string, string][] = [];
}

export interface IExportModGroupZipOptions {
    includeAPI?: boolean;
    fullPath?: boolean,
    onlyModFiles?: boolean
}

export class ModGroupController {
    public info: ModGroupInfo;
    public save() {
        if (!this.info) return;
        localStorage.setItem(`modgroud-${this.info.guid}`, JSON.stringify(this.info));
    }
    public addMod(name: string, ver: string) {
        if (this.info.mods.findIndex(v => v && v[0] == name) != -1) return;
        this.info.mods.push([name, ver]);
        this.save();
    }
    public removeMod(name: string) {
        const index = this.info.mods.findIndex(v => v && v[0] == name);
        if (index == -1) return;
        delete this.info.mods[index];
        this.save();
    }
    public getLocalMods() {
        const result: LocalModInstance[] = [];
        const mods = this.getModNames();
        for (let i = 0; i < mods.length; i++) {
            const element = mods[i];
            const name = element[0];
            const local = getLocalMod(name)?.getLatest();
            if (local) {
                if (isLaterVersion(local.info.version, element[1]) || local.info.version == element[1]) {
                    result.push(local);
                }
            }
        }
        return result;
    }
    public getModNames() {
        refreshLocalMods();
        const result: [string, string][] = [];
        for (const v of this.info.mods) {
            if (!v) continue;
            result.push(v);
        }
        return result;
    }
    public constructor(info: ModGroupInfo) {
        this.info = info;
    }
    public getShareUrl() {
        const url = new URL("hkmm://import.group");
        url.searchParams.set("name", this.info.name);

        const mods: string[] = [];
        for (const mod of this.info.mods) {
            if (!mod) continue;
            mods.push(mod.join(':'));
        }
        url.searchParams.set("mods", mods.join(';'));
        return url;
    }
    canUseGroup() {
        for (const mod of this.getModNames()) {
            if (!isInstalled(mod) || !getLocalMod(mod[0]).canEnable()) return false;
        }
        return true;
    }
    public exportAsZip(output: zip.Stream, options?: IExportModGroupZipOptions) {
        if (!this.canUseGroup()) throw new Error('Try exporting a group that is not available');
        options = options ?? {};
        options.fullPath = options.fullPath || options.includeAPI;
        const moddir = options.fullPath ? 'hollow_knight_Data/Managed/Mods' : '';
        const modset = new Set<string>();
        function addMod(mod: LocalModInstance) {
            if (modset.has(mod.info.name)) return;
            modset.add(mod.info.name);
            let files: string[] = [];
            function fedir(p: string, ol: string[], op: string) {
                for (const file of readdirSync(p, { encoding: 'utf8' })) {
                    const stats = statSync(join(p, file));
                    if(stats.isFile() && file !== modversionFileName) {
                        ol.push(join(op, file));
                    } else if(stats.isDirectory()) {
                        fedir(join(p, file), ol, join(op, file));
                    }
                }
            }
            if (options?.onlyModFiles) {
                files = mod.info.files;
            } else {
                fedir(mod.info.path, files, '');
            }
            for (const f of files) {
                output.addEntry(join(mod.info.path, f), {
                    relativePath: join(moddir, mod.info.name, f)
                });
            }
            for (const dm of mod.info.modinfo.dependencies) {
                const g = getLocalMod(dm);
                const lm = g.getLatest();
                if(lm) {
                    addMod(lm);
                }
            }
        }
        for (const mod of this.getLocalMods()) {
            addMod(mod);
        }
        if(options?.includeAPI) {
            if(getAPIVersion() < 0) throw new Error("The API is not installed");
            const apidir = dirname(getAPIPath());
            let apifiles: string[] = [ //https://github.com/hk-modding/modlinks/blob/22c5293336524dc760afb57a2ded3bcfabd46864/ApiLinks.xml#L23-L40
                'Assembly-CSharp.dll',
                'Assembly-CSharp.xml',
                'MMHOOK_Assembly-CSharp.dll',
                'MMHOOK_PlayMaker.dll',
                'Mono.Cecil.dll',
                'MonoMod.RuntimeDetour.dll',
                'MonoMod.Utils.dll',
                'mscorlib.dll',
                'mscorlib.xml',
                'Newtonsoft.Json.dll',
                'README.md'
            ];
            if(apiInfoCache) {
                apifiles = apiInfoCache.files;
            }

            for (const f of apifiles) {
                output.addEntry(join(apidir, f), {
                    relativePath: join('hollow_knight_Data/Managed', f)
                });
            }
        }
        return output;
    }
}

export function isInstalled(mod: [string, string]) {
    const mg = getLocalMod(mod[0]);
    if (!mg) return false;
    return mg.canEnable() && (mg.getLatestVersion() == mod[1] || isLaterVersion(mg.getLatestVersion() ?? "0.0", mod[1]));
}

export const groupCache: Record<string, ModGroupController> = {};

let useGroupCache: string = undefined as any;
let allGroups: string[] = undefined as any;

export function changeCurrentGroup(guid: string) {
    useGroupCache = guid;
    let group = getGroup(guid);
    if (!group) {
        useGroupCache = "default";
        group = getDefaultGroup();
    }
    for (const mod of localModsArray) {
        mod.disableAll();
    }
    for (const mod of group.getLocalMods()) {
        mod.install();
    }
    localStorage.setItem("modgroupcurrent", useGroupCache);

}

export function getCurrentGroup() {
    if (useGroupCache == undefined) {
        useGroupCache = localStorage.getItem("modgroupcurrent") ?? "default";
    }
    if (useGroupCache == "default") return getDefaultGroup();
    let result = getGroup(useGroupCache);
    if (!result) {
        result = getDefaultGroup();
        changeCurrentGroup("default");
    }
    return result;
}


export function getGroup(guid: string) {
    const result = groupCache[guid];
    if (result) return result;

    const r = localStorage.getItem(`modgroud-${guid}`);
    if (!r) return undefined;
    return (groupCache[guid] = new ModGroupController(JSON.parse(r) as ModGroupInfo));
}

export function getAllGroupGuids() {
    if (allGroups) return allGroups;
    const l = localStorage.getItem("modgrouplist");
    if (!l) return [];

    return allGroups = (JSON.parse(l) as string[]);
}

export function getAllGroups() {
    const result: ModGroupController[] = [];
    for (const iterator of getAllGroupGuids()) {
        if (!iterator) continue;
        const g = getGroup(iterator);
        if (!g) continue;
        result.push(g);
    }
    return result;
}

export function saveGroups() {
    const groupList: string[] = [];
    for (const key in groupCache) {
        const info = groupCache[key];
        if (!info) continue;
        info.save();
        if (groupList.indexOf(key) != -1) continue;
        groupList.push(key);
    }
    for (const iterator of getAllGroupGuids()) {
        if (groupList.indexOf(iterator) != -1) continue;
        groupList.push(iterator);
    }

    localStorage.setItem("modgrouplist", JSON.stringify(groupList));
}

export function getOrCreateGroup(guid?: string, name?: string) {
    guid = guid ?? Guid.create().toString();
    let result = getGroup(guid);
    if (!result) {
        const info = new ModGroupInfo();
        info.guid = guid;
        result = new ModGroupController(info);
        groupCache[guid] = result;
        allGroups.push(guid);
    }
    if (name) result.info.name = name;
    saveGroups();
    return result;
}

export function removeGroup(guid: string) {
    delete groupCache[guid];
    localStorage.removeItem(`modgroud-${guid}`);
    const guids = getAllGroupGuids();
    const index = guids.indexOf(guid)
    if (index != -1) delete guids[index];
}

export function getDefaultGroup() {
    return getOrCreateGroup("default", "Default");
}

export function importGroup(url: URL) {
    const name = url.searchParams.get("name") ?? "Import Group";

    const mods = url.searchParams.get("mods");
    if (!mods) return;
    const modsArray = mods.split(';');

    const group = getOrCreateGroup(undefined, name);
    for (const mod of modsArray) {
        group.info.mods.push(mod.split(':') as [string, string]);
    }
    saveGroups();
}
