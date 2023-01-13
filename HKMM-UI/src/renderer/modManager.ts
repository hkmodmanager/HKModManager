import { existsSync, mkdirSync, opendirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "fs";
import { dirname, extname, join, parse } from "path";
import { getLowestDep, getModLinkMod, getModLinkModSync, modlinksCache, ModLinksManifestData } from "./modlinks/modlinks";
import { store, ModSavePathMode } from "./settings";
import { createTask, TaskInfo } from "./taskManager";
import { downloadRaw } from "./utils/downloadFile";
import { zip } from "compressing"
import { getCurrentGroup } from "./modgroup";

import "./apiManager";
import { copySync } from "fs-extra";
import { config, installGameInject, loadConfig, saveConfig } from "./gameinject";
import { getDownloader } from "./mods/customDownloader";
import { appDir, userData } from "./remoteCache";
import { createHash } from "crypto";
import { RL_ClearCache } from "./relocation/RLocal";

export const modversionFileName = "modversion.json";
export const hkmmmMetaDataFileName = "HKMM-Metadata";

export function getRealModPath(name: string = '', disabled = false) {
    const p = join(store.store.gamepath, 'hollow_knight_Data', 'Managed', 'Mods', disabled ? 'Disabled' : '', name);
    if (!existsSync(p)) mkdirSync(p, { recursive: true });
    return p;
}

export function getCacheModsPath() {
    let mods = "";
    const settings = store.store;
    if (settings.modsavepathMode == undefined) {
        store.set('modsavepathMode', ModSavePathMode.UserDir);
        settings.modsavepathMode = ModSavePathMode.UserDir;
    }
    if (settings.modsavepathMode == ModSavePathMode.AppDir) mods = join(appDir, "managedMods");
    else if (settings.modsavepathMode == ModSavePathMode.UserDir) mods = join(userData, "managedMods");
    else if (settings.modsavepathMode == ModSavePathMode.Gamepath) mods = join(store.get('gamepath'), "hkmm-mods");
    else mods = settings.modsavepath;
    if (!existsSync(mods)) mkdirSync(mods, { recursive: true });
    return mods;
}

export enum LocalMod_FullLevel {
    DllNotFull = 0,
    DllFullButResourceNotFull = 1,
    ResourceFull = 2,
    Full
}

export interface IImportedLocalModVaild {
    fulllevel: LocalMod_FullLevel;
    missingFiles: string[];
}

export interface LocalModInfo {
    name: string;
    version: string;
    install: number;
    path: string;
    modinfo: ModLinksManifestData;
    imported?: {
        localmod?: IImportedLocalModVaild,
        fromScarab?: boolean,
        nonExclusiveImport: boolean,
        modVaild: IImportedLocalModVaild
    };
}

export class LocalModInstance {
    public info: LocalModInfo;
    public name: string;
    public isActived() {
        loadConfig();
        const id = config.loadedMods.findIndex(v => v && v.split('|')[0] === this.info.name);
        if (id == -1) return false;
        const parts = config.loadedMods[id].split('|');
        if (parts[1] !== this.info.version) return false;
        const modPath = parts[2];
        if (!existsSync(modPath)) return false;
        const inst = LocalModInstance.loadForm(modPath);
        if (inst) {
            if (inst.info.version === this.info.version) return true;
            else return false;
        }
        return false;
    }

    private fixOld() {
        try {
            let shouldSave = false;
            if ((this.info as any)['importFromScarab']) {
                this.info.imported ??= {
                    nonExclusiveImport: false,
                    modVaild: {
                        missingFiles: [],
                        fulllevel: LocalMod_FullLevel.Full
                    }
                };
                this.info.imported.fromScarab = true;
                shouldSave = true;
                delete (this.info as any)['importFromScarab'];
            }


            const zipp = join(this.info.path, "mod.zip");
            if (existsSync(zipp)) rmSync(zipp, { force: true });
            if (shouldSave) {
                this.save();
            }
        } catch (e) {
            console.error(e);
        }
    }


    public install(addToCurrentGroup: boolean = true, installedSet?: Set<string>) {
        loadConfig();
        const id = config.loadedMods.findIndex(v => v && v.split('|')[0] === this.info.name);
        const str = `${this.info.name}|${this.info.version}|${this.info.path}`;
        if (id == -1) {
            config.loadedMods.push(str);
        } else {
            config.loadedMods[id] = str;
        }
        this.writeMetadataPath();
        saveConfig();
        if (addToCurrentGroup) {
            getCurrentGroup().addMod(this.info.name, this.info.version);
        }

        if (!installedSet) {
            installedSet = new Set<string>();
            installGameInject();
        }
        installedSet.add(this.info.name);
        for (let i = 0; i < this.info.modinfo.dependencies.length; i++) {
            const element = this.info.modinfo.dependencies[i];
            if (installedSet.has(element)) continue;
            const group = getLocalMod(element);
            if (!group) continue;
            if (group.isActived()) continue;
            group.getLatest()?.install(false, installedSet);
        }
    }

    public uninstall(force: boolean = false) {
        loadConfig();
        const id = config.loadedMods.findIndex(v => v && v.split('|')[0] === this.info.name);
        if (id != -1) {
            if (!force && !this.isActived()) return;
            delete config.loadedMods[id];
            saveConfig();
        }
    }

    public canInstall() {
        const depmods = getLowestDep(this.info.modinfo);
        if (depmods) {
            for (const mod of depmods) {
                if (!isInstallMod(mod, false)) return false;
            }
        } else {
            for (const mod of this.info.modinfo.dependencies) {
                const mg = getLocalMod(mod);
                if (!mg) return false;
                if (!mg.isInstalled()) return false;
            }
        }
        return true;
    }

    public async checkDependencies() {
        if (this.canInstall()) return;
        const g = getLocalMod(this.info.name);
        if (!g) return;
        await g.installNew(this.info.modinfo, true);
    }

    public save() {
        const info = JSON.stringify(this.info);
        writeFileSync(join(this.info.path, modversionFileName), info, "utf-8");
    }

    public static loadForm(path: string) {
        const infopath = join(path, modversionFileName);
        if (!existsSync(infopath)) return undefined;
        const info = JSON.parse(readFileSync(infopath, "utf-8")) as LocalModInfo;
        info.path = path;
        const inst = new LocalModInstance(info);
        inst.fixOld();
        return inst;
    }

    public writeMetadataPath() {
        try {
            writeFileSync(join(getRealModPath(this.info.name), hkmmmMetaDataFileName), join(this.info.path, modversionFileName));
        } catch (e) {
            console.error(e);
        }
    }

    public constructor(info: LocalModInfo) {
        this.info = info;
        this.name = info.name;
    }
}

export class LocalModsVersionGroup {
    public static downloadingMods: Map<string, Promise<any>> = new Map<string, Promise<any>>();

    public versions: Record<string, LocalModInstance> = {};
    public versionsArray: LocalModInstance[] = [];
    public name: string = "";
    public getLatestVersion() {
        let l: string | undefined;
        for (const key in this.versions) {
            if (!l) {
                l = key;
            } else {
                if (isLaterVersion(key, l)) {
                    l = key;
                }
            }
        }
        return l;
    }
    public getLatest() {
        const latest = this.getLatestVersion();
        if (!latest) return undefined;
        return this.versions[latest];
    }
    public static loadForm(path: string) {
        const dirs = readdirSync(path, "utf-8");
        const result = new LocalModsVersionGroup();
        for (const dir of dirs) {
            const dp = join(path, dir);
            const inst = LocalModInstance.loadForm(dp);
            if (!inst) continue;
            result.versions[inst.info.version] = inst;
            result.versionsArray.push(inst);
            result.name = inst.info.name;
        }
        return result;
    }
    public async installWithoutNewTask(mod: ModLinksManifestData, task: TaskInfo) {
        if (this.versions[mod.version]) { //TODO
            delete this.versions[mod.version];
        }
        if (!mod.link) {
            task.pushState("Unable to download mod, try fallback to the latest version");
            const lv = await getModLinkMod(mod.name);
            if (lv?.link == undefined) {
                task.pushState("Unable to download mod");
                throw new Error(`Unable to download mod ${mod.name}`);
            }
            mod = lv;
        }
        mod = { ...mod };
        task.pushState(`Start downloading the mod ${mod.name}(v${mod.version})`);
        mod.link = mod.link as string;
        const result: Buffer = await (await getDownloader(mod))?.do(mod, task) ?? await downloadRaw(mod.link, undefined, task);
        const verdir = join(getCacheModsPath(), mod.name, mod.version);
        task.pushState(`Local Mods Path: ${verdir}`);
        if (!existsSync(verdir)) mkdirSync(verdir, { recursive: true });
        const info: LocalModInfo = {
            install: Date.now(),
            name: mod.name,
            version: mod.version,
            path: verdir,
            modinfo: mod
        }
        const download = new URL(mod.link);
        const dp = parse(download.pathname);
        if (dp.ext == ".dll") {
            writeFileSync(join(verdir, dp.base), result);
        } else {
            const zdp = join(verdir, "mod" + dp.ext);
            writeFileSync(zdp, result);
            if (dp.ext == ".zip") {
                await zip.uncompress(zdp, verdir);
            }
            rmSync(zdp, {
                force: true,
                recursive: true
            });
        }
        task.pushState(`Download ${mod.name} complete`);
        const inst = this.versions[mod.version] = new LocalModInstance(info);
        this.versionsArray.push(inst);
        inst.save();
        inst.install(false);
        RL_ClearCache();
        return inst;
    }
    public async installNew(mod: ModLinksManifestData, justCheckDep = false) {
        const task = createTask(mod.name);
        task.category = "Download";
        const promise = (async () => {
            try {
                const wp = justCheckDep ? undefined : await this.installWithoutNewTask(mod, task);
                const req: Promise<LocalModInstance>[] = [];
                const deps = getLowestDep(mod);
                if (deps) {
                    for (let i = 0; i < deps.length; i++) {
                        const element = deps[i];
                        const dh = LocalModsVersionGroup.downloadingMods.get(element.name);
                        if (dh) {
                            req.push(dh);
                            continue;
                        }
                        if (isInstallMod(element, false)) {
                            task.pushState(`Skip Dependency ${element.name}`);
                            continue;
                        }
                        const dep = await getModLinkMod(element.name);
                        if (!dep) {
                            task.pushState(`Missing Dependency ${element.name}`);
                            continue;
                        }
                        const group = getOrAddLocalMod(dep.name);
                        req.push(group.installNew(dep, false));
                    }
                }
                await Promise.all(req);
                LocalModsVersionGroup.downloadingMods.delete(mod.name);
                this.getLatest()?.install(false);
                task.finish(false);
                return wp as LocalModInstance;
            } catch (e: any) {
                task.pushState(e?.toString());
                LocalModsVersionGroup.downloadingMods.delete(mod.name);
                task.finish(true);
                throw e;
            }
        })();
        LocalModsVersionGroup.downloadingMods.set(mod.name, promise);
        return await promise;
    }
    public isActived() {
        for (let index = 0; index < this.versionsArray.length; index++) {
            const element = this.versionsArray[index];
            if (element.isActived()) return true;
        }
        return false;
    }
    public disableAll() {
        if (this.versionsArray.length == 0) return;
        this.versionsArray[0].uninstall(true);
        for (const v of getSubMods(this.name, false)) {
            v.uninstall();
        }
    }
    public canEnable() {
        if (!this.isInstalled()) return false;
        return this.getLatest()?.canInstall() ?? false;
    }
    public uninstall(versions?: string[]) {
        const requireUninstall: LocalModInstance[] = [];
        this.disableAll();
        for (let i = 0; i < this.versionsArray.length; i++) {
            const element = this.versionsArray[i];
            if (!versions) requireUninstall.push(element);
            else if (versions.indexOf(element.info.version) !== -1) requireUninstall.push(element);
        }
        console.log(requireUninstall);
        for (let i = 0; i < requireUninstall.length; i++) {
            const element = requireUninstall[i];
            element.uninstall(false);

            rmSync(element.info.path, {
                force: true,
                recursive: true
            });

            delete this.versions[element.info.version];
            const index = this.versionsArray.indexOf(element);

            const origArray = this.versionsArray;
            this.versionsArray = [];
            for (let i2 = 0; i2 < origArray.length; i2++) {
                if (i2 == index) continue;
                this.versionsArray.push(origArray[i2]);
            }
        }
        RL_ClearCache();
    }
    public isInstalled() {
        return this.versionsArray.length > 0;
    }


    public installLocalMod(mod: LocalModInfo, root: string,
        files?: Record<string, string | undefined>,
        deleteFile: boolean = false) {
        files ??= mod.modinfo.ei_files?.files;
        if (this.versions[mod.version] || !files) return undefined;
        const info = { ...mod };
        const mp = join(getCacheModsPath(), mod.name, mod.version);
        if (!existsSync(mp)) mkdirSync(mp, { recursive: true });
        info.path = mp;
        console.log("Instance Local Mod");
        /*copySync(root, mp, {
            overwrite: true,
            recursive: true
        })*/
        for (const fn in files) {
            const sha256 = files[fn];
            const srcpath = join(root, fn);
            const dest = join(mp, fn);
            if (!existsSync(srcpath)) continue;
            if (sha256) {
                const srcSHA = createHash('sha256').update(readFileSync(srcpath)).digest('hex');
                if (sha256 != srcSHA) continue;
            }
            const ddir = dirname(dest);
            if (!existsSync(ddir)) mkdirSync(ddir, { recursive: true });
            copySync(srcpath, dest, {
                overwrite: true
            });
            if (deleteFile) {
                rmSync(srcpath);
            }
        }
        const inst = new LocalModInstance(info);
        inst.save();
        this.versionsArray.push(inst);
        this.versions[mod.name] = inst;
        return inst;
    }

}

export let localMods: Record<string, LocalModsVersionGroup> = undefined as any;
let lastRefresh: number = 0;
export let localModsArray: LocalModsVersionGroup[] = undefined as any;

export function refreshLocalMods(force: boolean = false) {
    if (!force && localMods && (new Date().valueOf() - lastRefresh) < 2000) return localMods;

    localMods = {};

    const localpath = getCacheModsPath();
    const dirs = readdirSync(localpath, "utf-8");
    localModsArray = [];
    for (const dir of dirs) {
        const dp = join(localpath, dir)
        const d = opendirSync(dp).readSync();
        if (!d) continue;
        if (!d.isDirectory()) continue;
        const inst = LocalModsVersionGroup.loadForm(dp);
        localMods[inst.name] = inst;
        localModsArray.push(inst);
    }
    lastRefresh = new Date().valueOf();
    return localMods;
}

export function getLocalMod(name: string) {
    if (!localMods) refreshLocalMods();
    return (localMods as Record<string, LocalModsVersionGroup>)[name];
}

export function isInstallMod(mod: ModLinksManifestData, fullMatch = false) {
    const lmod = getLocalMod(mod.name);
    if (!lmod) return false;
    if (fullMatch) return lmod.versions[mod.version] != undefined;
    const lv = lmod.getLatestVersion();
    if (!lv) return false;
    if (isLaterVersion(lv, mod.version)) return true;
    return lv == mod.version;
}

export function getOrAddLocalMod(name: string) {
    let r = getLocalMod(name);
    if (!r) {
        r = new LocalModsVersionGroup();
        r.name = name;
        localMods[name] = r;
    }
    return r;
}

export function isLaterVersion(a: string, b: string) {
    const apart = a.split('.');
    const bpart = b.split('.');
    for (let i = 0; i < apart.length; i++) {
        if (i >= bpart.length) return true;
        const va = Number.parseInt(apart[i]);
        const vb = Number.parseInt(bpart[i]);
        if (va > vb) return true;
        else if (va < vb) return false;
    }
    return false;
}

export function getSubMods(name: string, onlyLatest: boolean = true) {
    const result: LocalModInstance[] = [];
    const inst: LocalModInstance[] = [];
    for (const key in localMods) {
        const mod = localMods[key];
        if (onlyLatest) {
            const l = mod.getLatest();
            if (l) inst.push(l);
        } else {
            for (let i = 0; i < mod.versionsArray.length; i++) {
                inst.push(mod.versionsArray[i]);
            }
        }
    }
    for (const iterator of inst) {
        if (iterator.info.modinfo.dependencies.includes(name)) result.push(iterator);
    }
    return result;
}

export function getIntegrationsMods(name: string, onlyLatest: boolean = true) {
    const result: LocalModInstance[] = [];
    const inst: LocalModInstance[] = [];

    for (const key in localMods) {
        const mod = localMods[key];
        if (onlyLatest) {
            const l = mod.getLatest();
            if (l) inst.push(l);
        } else {
            for (let i = 0; i < mod.versionsArray.length; i++) {
                inst.push(mod.versionsArray[i]);
            }
        }
    }
    const self = getLocalMod(name)?.getLatest();
    for (const iterator of inst) {
        if (iterator.info.modinfo.integrations.includes(name) ||
            (self?.info.modinfo?.integrations.includes(iterator.name))) result.push(iterator);
    }
    return result;
}

export function isDownloadingMod(name: string) {
    return LocalModsVersionGroup.downloadingMods.has(name);
}

export function getRequireUpdateModsSync() {
    if (!modlinksCache) return [];
    const result: string[] = [];
    for (const key in refreshLocalMods()) {
        const mod = getLocalMod(key);
        const lv = mod.getLatestVersion();
        if (!lv) continue;
        if (isLaterVersion(getModLinkModSync(key)?.version ?? '', lv)) {
            result.push(key);
        }
    }

    return result;
}

export function vaildModFiles(root: string, files: Record<string, string>, missingFilesRec?: string[]) {
    const optionFileExt = ['.md', '.pdb'];
    let fulllevel = LocalMod_FullLevel.Full;
    for (const fn in files) {
        const sha = files[fn];
        const fp = join(root, fn);
        const isDll = extname(fn).toLowerCase() == '.dll';
        const isOption = optionFileExt.includes(extname(fn)?.toLowerCase());
        const fsha = existsSync(fp) ? createHash('sha256').update(readFileSync(fp)).digest('hex') : undefined;
        if (fsha != sha) {
            if (isDll) {
                if (fulllevel > LocalMod_FullLevel.DllNotFull) fulllevel = LocalMod_FullLevel.DllNotFull;
            } else if (isOption) {
                if (fulllevel > LocalMod_FullLevel.ResourceFull) fulllevel = LocalMod_FullLevel.ResourceFull;
            } else {
                if (fulllevel > LocalMod_FullLevel.DllFullButResourceNotFull) fulllevel = LocalMod_FullLevel.DllFullButResourceNotFull;
            }
            missingFilesRec?.push(fn);
            continue;
        }
    }
    return fulllevel;
}

const gl = window as any;

refreshLocalMods();

gl.LocalModsVersionGroup = LocalModsVersionGroup;
gl.getMod = getLocalMod;
