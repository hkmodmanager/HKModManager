import { zip } from "compressing";
import { remote } from "electron";
import { fstat, readdirSync, readJSONSync, outputJSONSync, statSync, existsSync, rm, rmSync, copySync } from "fs-extra";
import { Guid } from "guid-typescript";
import { tmpdir } from "os";
import { dirname, join, parse } from "path";
import { URL } from "url";
import { copyBackup, getAPIPath, getAPIVersion } from "./apiManager";
import { apiInfoCache, getModLinkMod, ModdingAPIData, ModLinksManifestData } from "./modlinks/modlinks";
import { getLocalMod, getOrAddLocalMod, isLaterVersion, LocalModInfo, LocalModInstance, localMods, localModsArray, modversionFileName, refreshLocalMods } from "./modManager";
import { store } from "./settings";

export const metadata_name = '[hkmm-metadata].json';

export function getGroupPath() {
    return join(remote.app.getPath('userData'), 'modgroups');
}

export function getGroupPath2(guid: string) {
    return join(getGroupPath(), guid + '.hkmg');
}

export class ExportedModGroupMetadata {
    public info: ModGroupInfo = undefined as any;
    public mods: LocalModInfo[] = [];
    public options?: IExportModGroupZipOptions;
    public api?: ModdingAPIData;
}

export class ModGroupInfo {
    public name: string = "";
    public guid: string = "";
    public mods: [string, string][] = [];
}

export interface IExportModGroupZipOptions {
    includeAPI?: boolean;
    fullPath?: boolean,
    onlyModFiles?: boolean,
    includeMetadata?: boolean
}

export class ModGroupController {
    public info: ModGroupInfo;
    public save() {
        if (!this.info) return;
        outputJSONSync(getGroupPath2(this.info.guid), this.info, 'utf-8');
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
    public static loadForm(path: string) {
        const info = readJSONSync(path, {
            encoding: 'utf-8',
            throws: true
        }) as ModGroupInfo;
        return new ModGroupController(info);
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
        const mods: LocalModInfo[] = [];
        function addMod(mod: LocalModInstance) {
            if (modset.has(mod.info.name)) return;
            modset.add(mod.info.name);
            mods.push(mod.info);
            let files: string[] = [];
            function fedir(p: string, ol: string[], op: string) {
                for (const file of readdirSync(p, { encoding: 'utf8' })) {
                    const stats = statSync(join(p, file));
                    if (stats.isFile() && file !== modversionFileName) {
                        ol.push(join(op, file));
                    } else if (stats.isDirectory()) {
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
                if (lm) {
                    addMod(lm);
                }
            }
        }
        for (const mod of this.getLocalMods()) {
            addMod(mod);
        }
        const zip_apifiles: string[] = [];
        if (options?.includeAPI) {
            if (getAPIVersion() < 0) throw new Error("The API is not installed");
            const apidir = dirname(getAPIPath());
            let apifiles = [ //https://github.com/hk-modding/modlinks/blob/22c5293336524dc760afb57a2ded3bcfabd46864/ApiLinks.xml#L23-L40
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
            if (apiInfoCache) {
                apifiles = apiInfoCache.files;
            }

            for (const f of apifiles) {
                const zp = join('hollow_knight_Data/Managed', f);
                zip_apifiles.push(zp);
                output.addEntry(join(apidir, f), {
                    relativePath: zp
                });
            }
        }
        if (options?.includeMetadata) {
            const metadata = new ExportedModGroupMetadata();
            metadata.info = this.info;
            metadata.options = options;
            for (const mod of mods) {
                const c = { ...mod };
                c.path = options.fullPath ? join(moddir, c.name) : c.name;
                metadata.mods.push(c);
            }
            if (options?.includeAPI) {
                const api = new ModdingAPIData();
                metadata.api = api;
                api.version = getAPIVersion();
                api.lastGet = new Date().valueOf();
                api.files = zip_apifiles;
            }
            output.addEntry(Buffer.from(JSON.stringify(metadata)), {
                relativePath: metadata_name
            });
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
    store.set('current_modgroup', useGroupCache);
}

export function getCurrentGroup() {
    if (useGroupCache == undefined) {
        useGroupCache = store.get('current_modgroup', 'default');
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

    const r = getGroupPath2(guid);
    if (!existsSync(r)) return undefined;
    return (groupCache[guid] = new ModGroupController(readJSONSync(r, 'utf-8')));
}

export function getAllGroupGuids() {
    return store.store.modgroups ?? [];
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
    store.set('modgroups', groupList);
}

export function getOrCreateGroup(guid?: string, name?: string) {
    guid = guid ?? Guid.create().toString();
    let result = getGroup(guid);
    if (!result) {
        const info = new ModGroupInfo();
        info.guid = guid;
        result = new ModGroupController(info);
        groupCache[guid] = result;
        saveGroups();
    }
    if (name) result.info.name = name;
    result.save();
    return result;
}

export function removeGroup(guid: string) {
    delete groupCache[guid];
    const gp = getGroupPath2(guid);
    if (existsSync(gp)) {
        rmSync(gp);
    }
    const guids = getAllGroupGuids();
    const index = guids.indexOf(guid)
    if (index != -1) delete guids[index];
}

export function getDefaultGroup() {
    return getOrCreateGroup("default", "Default");
}

export function importGroup(source: URL | ModGroupInfo) {
    if (source instanceof URL) {
        const name = source.searchParams.get("name") ?? "Import Group";

        const mods = source.searchParams.get("mods");
        if (!mods) return;
        const modsArray = mods.split(';');

        const group = getOrCreateGroup(undefined, name);
        for (const mod of modsArray) {
            group.info.mods.push(mod.split(':') as [string, string]);
        }
    } else {
        const info = { ...source };
        info.guid = Guid.create().toString();
        const inst = new ModGroupController(info);
        inst.info.guid = Guid.create().toString();
        groupCache[info.guid] = inst;
    }
    saveGroups();
}

export function importFromHKMG(path: string) {
    importGroup(readJSONSync(path, 'utf-8') as ModGroupInfo);
}

export async function importFromZip(source: string | Buffer) {
    const od = join(tmpdir(), Guid.create().toString());
    await zip.uncompress(source, od);
    try {
        const mdp = join(od, metadata_name);
        if (!existsSync(mdp)) {
            throw new Error('Metadata not found');
        }
        const metadata = readJSONSync(mdp) as ExportedModGroupMetadata;
        importGroup(metadata.info);
        for (const mod of metadata.mods) {
            getOrAddLocalMod(mod.name).installLocalMod(mod, join(od, mod.path));
        }
        if(metadata.api) {
            if(getAPIVersion() < metadata.api.version) {
                copyBackup();
                const managed = dirname(getAPIPath());
                for (const f of metadata.api.files) {
                    const p = join(od, f);
                    if(!existsSync(p)) continue;
                    copySync(p, join(managed, parse(f).base));
                }
            }
        }
    } finally {
        rmSync(od, {
            recursive: true
        });
    }
}

(function () {
    const list = localStorage.getItem('modgrouplist');
    if (!list) return;
    localStorage.removeItem('modgrouplist');
    const gl = JSON.parse(list) as string[];
    for (const g of gl) {
        const r = localStorage.getItem(`modgroud-${g}`);
        if (!r) continue;
        localStorage.removeItem(`modgroud-${g}`);
        const inst = new ModGroupController(JSON.parse(r) as ModGroupInfo);
        groupCache[g] = inst;
    }
    saveGroups();
})();
