import { remote } from "electron";
import { existsSync, mkdirSync, opendirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "fs";
import { join, parse } from "path";
import { getModLinkMod, getModLinks, ModLinksData, ModLinksManifestData } from "./modlinks/modlinks";
import { GetSettings, ModSavePathMode } from "./settings";
import { createTask, TaskInfo } from "./taskManager";
import { downloadFile } from "./utils/downloadFile";
import { zip } from "compressing"
import { getCurrentGroup } from "./modgroup";

import "./apiManager";

export function getModsPath(name: string) {
    return join(GetSettings().gamepath, "hollow_knight_Data", "Managed", "Mods", "Managed-" + name);
}

export function getCacheModsPath() {
    let mods = "";
    const settings = GetSettings();
    if (settings.modsavepathMode == ModSavePathMode.AppDir) mods = join(process.execPath, "managedMods");
    else if (settings.modsavepathMode == ModSavePathMode.UserDir) mods = join(remote.app.getPath("appData"), "managedMods");
    else mods = settings.modsavepath;
    if (!existsSync(mods)) mkdirSync(mods, { recursive: true });
    return mods;
}

export class LocalModInfo {
    public name: string = "";
    public version: string = "";
    public install: number = 0;
    public path: string = "";
    public modinfo: ModLinksManifestData = undefined as any;
}

export class LocalModInstance {
    public info: LocalModInfo;

    public isActived() {
        const modPath = getModsPath(this.info.name);
        if (!existsSync(modPath)) return false;
        const inst = LocalModInstance.loadForm(modPath);
        if (inst) {
            if (inst.info.version === this.info.version) return true;
            else return false;
        }
        return false;
    }

    public install(addToCurrentGroup: boolean = true, installedSet?: Set<string>) {
        const modPath = getModsPath(this.info.name);
        if (existsSync(modPath)) rmSync(modPath, { recursive: true });
        symlinkSync(this.info.path, modPath, "dir");
        if (addToCurrentGroup) {
            getCurrentGroup().addMod(this.info.name, this.info.version);
        }
        if (!installedSet) installedSet = new Set<string>();
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
        const modPath = getModsPath(this.info.name);
        if (existsSync(modPath)) {
            if (!force && !this.isActived()) return;
            rmSync(modPath, { recursive: true });
        }
    }

    public canInstall() {
        for (const mod of this.info.modinfo.dependencies) {
            const mg = getLocalMod(mod);
            if (!mg) return false;
            if (!mg.isInstalled()) return false;
        }
        return true;
    }

    public async checkDependencies() {
        if (this.canInstall()) return;
        const g = getLocalMod(this.info.name);
        if(!g) return;
        await g.installNew(this.info.modinfo, true);
    }

    public save() {
        const info = JSON.stringify(this.info);
        writeFileSync(join(this.info.path, "modversion.json"), info, "utf-8");
    }

    public static loadForm(path: string) {
        const infopath = join(path, "modversion.json");
        if (!existsSync(infopath)) return undefined;
        const info = JSON.parse(readFileSync(infopath, "utf-8")) as LocalModInfo;
        info.path = path;
        return new LocalModInstance(info);
    }

    public constructor(info: LocalModInfo) {
        this.info = info;
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
        const download = new URL(mod.link);
        const dp = parse(download.pathname);
        task.pushState(`Start downloading the mod ${mod.name}(v${mod.version})`);
        const result = await downloadFile<ArrayBuffer>(mod.link, { responseType: "arraybuffer" }, task);
        const buffer = Buffer.from(result.data);
        const verdir = join(getCacheModsPath(), mod.name, mod.version);
        task.pushState(`Local Mods Path: ${verdir}`);
        if (!existsSync(verdir)) mkdirSync(verdir, { recursive: true });
        const info = new LocalModInfo();
        info.install = new Date().valueOf();
        info.name = mod.name;
        info.version = mod.version;
        info.path = verdir;
        info.modinfo = mod;
        if (dp.ext == ".dll") {
            writeFileSync(join(verdir, dp.base), buffer);
        } else {
            const zdp = join(verdir, "mod" + dp.ext);
            writeFileSync(zdp, buffer);
            if (dp.ext == ".zip") {
                await zip.uncompress(zdp, verdir);
            }
        }
        task.pushState(`Download ${mod.name} complete`);
        const inst = this.versions[mod.version] = new LocalModInstance(info);
        this.versionsArray.push(inst);
        inst.save();
        inst.install(false);
        return inst;
    }
    public async installNew(mod: ModLinksManifestData, justCheckDep = false) {
        const task = createTask(mod.name);
        task.category = "Download";
        const promise = (async () => {
            try {
                const wp = justCheckDep ? undefined : await this.installWithoutNewTask(mod, task);
                const req: Promise<LocalModInstance>[] = [];

                for (let i = 0; i < mod.dependencies.length; i++) {
                    const element = mod.dependencies[i];
                    const dh = LocalModsVersionGroup.downloadingMods.get(element);
                    if(dh) {
                        req.push(dh);
                        continue;
                    }
                    if (getLocalMod(element)) {
                        task.pushState(`Skip Dependency ${element}`);
                        continue;
                    }
                    const dep = await getModLinkMod(element);
                    if (!dep) {
                        task.pushState(`Missing Dependency ${element}`);
                        continue;
                    }
                    const group = getOrAddLocalMod(element);
                    req.push(group.installNew(dep, false));
                }
                await Promise.all(req);
                LocalModsVersionGroup.downloadingMods.delete(mod.name);
                this.getLatest()?.install(true);
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
        for(const v of getSubMods(this.name, false)) {
            v.uninstall();
        }
    }
    public canEnable() {
        if(!this.isInstalled()) return false;
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
    }
    public isInstalled() {
        return this.versionsArray.length > 0;
    }
}

export let localMods: Record<string, LocalModsVersionGroup> = undefined as any;
export let localModsArray: LocalModsVersionGroup[] = undefined as any;

export function refreshLocalMods() {
    const gl = window as any;
    gl.mods = localMods = {};

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
    return localMods;
}

export function getLocalMod(name: string) {
    if (!localMods) refreshLocalMods();
    return (localMods as Record<string, LocalModsVersionGroup>)[name];
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

export function isDownloadingMod(name: string) {
    return LocalModsVersionGroup.downloadingMods.has(name);
}

const gl = window as any;

refreshLocalMods();

gl.LocalModsVersionGroup = LocalModsVersionGroup;
gl.getMod = getLocalMod;
