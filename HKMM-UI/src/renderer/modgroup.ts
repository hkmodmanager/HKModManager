import { Guid } from "guid-typescript";
import { URL } from "url";
import { getModLinkMod, ModLinksManifestData } from "./modlinks/modlinks";
import { getLocalMod, isLaterVersion, LocalModInstance, localMods, localModsArray, refreshLocalMods } from "./modManager";


export class ModGroupInfo {
    public name: string = "";
    public guid: string = "";
    public mods: [string, string][] = [];
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
                if(isLaterVersion(local.info.version, element[1]) || local.info.version == element[1])
                result.push(local);
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
    if(!mods) return;
    const modsArray = mods.split(';');
    
    const group = getOrCreateGroup(undefined, name);
    for (const mod of modsArray) {
        group.info.mods.push(mod.split(':') as [string, string]);
    }
    saveGroups();
}
