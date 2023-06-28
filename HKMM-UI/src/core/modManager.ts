import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "fs";
import { dirname, extname, join, parse, basename, normalize } from "path";
import { fixModLinksManifestData, getLowestDep, getModLinkMod, getModLinkModSync, ModLinksManifestData, provider } from "./modlinks/modlinks";
import { store, ModSavePathMode, hasOption } from "./settings";
import { createTask  } from "./taskManager";
import { downloadRaw } from "./utils/downloadFile";
import { zip } from "compressing"
import { getCurrentGroup } from "./modgroup";

import "../core/apiManager";
import { copySync } from "fs-extra";
import { installGameInject, saveConfig } from "./gameinject";
import { appDir, userData } from "./remoteCache";
import { createHash } from "crypto";
import { RL_ClearCache } from "./relocation/RLocal";
import { ignoreVerifyMods } from "./modrepairer";
import { IModMetadata } from "./data/IModMetadata";
import { ver_lg } from "./utils/version";
import { TaskItem, TaskItemStatus } from "core";

export const modversionFileName = "modversion.json";
export const hkmmmMetaDataFileName = "HKMM-Metadata";
export const hkmmEnableFile = "HKMM-MODENABLE";

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
    None = -1,
    DllNotFull = 0,
    DllFullButResourceNotFull = 1,
    ResourceFull = 2,
    Full
}

export interface IImportedLocalModVerify {
    fulllevel: LocalMod_FullLevel;
    missingFiles: string[];
    verifyDate: number;
}

export interface LocalModInfo extends IModMetadata {
    name: string;
    version: string;
    install: number;
    path: string;
    modinfo: ModLinksManifestData;
    modVerify: IImportedLocalModVerify;
    imported?: {
        localmod?: IImportedLocalModVerify,
        fromScarab?: boolean,
        nonExclusiveImport: boolean,
        /**@deprecated  */
        modVaild?: IImportedLocalModVerify;
    };
}

export class LocalModInstance {
    public info: LocalModInfo;
    public name: string;
    private getEnableFilePath() {
        return join(getRealModPath(this.name), hkmmEnableFile);
    }
    public isEnabled() {
        const path = this.getEnableFilePath();
        if(!existsSync(path)) return false;
        const text = readFileSync(path, "utf8");
        if(text == '') return false;
        if(normalize(text) == this.info.path) return true;

        const modPath = text;
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
                    nonExclusiveImport: false
                };
                this.info.imported.fromScarab = true;
                shouldSave = true;
                delete (this.info as any)['importFromScarab'];
            }
            if ((!this.info.modVerify || !this.info.modVerify.verifyDate
                || (hasOption('VERIFY_MODS_ON_AUTO') && Date.now() - this.info.modVerify.verifyDate > 1000 * 60)) && this.info.modinfo.ei_files?.files) {
                const missingFiles: string[] = [];
                this.info.modVerify = {
                    fulllevel: verifyModFiles(this.info.path, this.info.modinfo.ei_files.files, missingFiles),
                    missingFiles,
                    verifyDate: Date.now()
                };
                shouldSave = true;
            }

            shouldSave = shouldSave || fixModLinksManifestData(this.info.modinfo);


            const zipp = join(this.info.path, "mod.zip");
            if (existsSync(zipp)) rmSync(zipp, { force: true });
            if (shouldSave) {
                this.save();
            }
        } catch (e) {
            console.error(e);
        }
    }


    public enable(addToCurrentGroup: boolean = true, installedSet?: Set<string>) {
        const mep = this.getEnableFilePath();
        writeFileSync(mep, normalize(this.info.path), 'utf-8');
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
            if (group.isEnabled()) continue;
            group.getLatest()?.enable(false, installedSet);
        }
    }

    public disable(force: boolean = false) {
        const mep = this.getEnableFilePath();
        if(existsSync(mep)) {
            if(!force && this.isEnabled()) return false;
            rmSync(mep);
        }
    }

    public canEnable() {
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
        if (this.canEnable()) return;
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
        info.path = normalize(path);
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
                if (ver_lg(key, l)) {
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
    public async installWithoutNewTask(mod: ModLinksManifestData, task: TaskItem) {
        if (this.versions[mod.version]) { //TODO
            delete this.versions[mod.version];
        }
        fixModLinksManifestData(mod);
        if (!mod.link) {
            task.log("Unable to download mod, try fallback to the latest version");
            const lv = await getModLinkMod(mod.name);
            if (lv?.link == undefined) {
                task.log("Unable to download mod");
                throw new Error(`Unable to download mod ${mod.name}`);
            }
            mod = lv;
        }
        mod = { ...mod };
        task.log(`Start downloading the mod ${mod.name}(v${mod.version})`);
        mod.link = mod.link as string;
        const result: Buffer = await downloadRaw(mod.link, undefined, task, true);
        const verdir = join(getCacheModsPath(), mod.name, mod.version);
        task.log(`Local Mods Path: ${verdir}`);
        if (!existsSync(verdir)) mkdirSync(verdir, { recursive: true });
        const info: LocalModInfo = {
            install: Date.now(),
            name: mod.name,
            version: mod.version,
            path: verdir,
            modinfo: mod,
            modVerify: {
                fulllevel: LocalMod_FullLevel.Full,
                missingFiles: [],
                verifyDate: Date.now()
            }
        };
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
        task.log(`Download ${mod.name} complete`);
        const inst = this.versions[mod.version] = new LocalModInstance(info);
        this.versionsArray.push(inst);
        inst.save();
        inst.enable(false);
        RL_ClearCache();
        return inst;
    }
    public async installNew(mod: ModLinksManifestData, justCheckDep = false, ignoreDep = false) {
        const l = LocalModsVersionGroup.downloadingMods.get(mod.name) as Promise<LocalModInstance>;
        if (l) return await l;
        const task = createTask(mod.name);

        const promise = (async () => {
            try {
                const req: Promise<LocalModInstance>[] = [];
                const deps = ignoreDep ? [] : getLowestDep(mod);
                if (deps) {
                    for (let i = 0; i < deps.length; i++) {
                        const element = deps[i];
                        const dh = LocalModsVersionGroup.downloadingMods.get(element.name);
                        if (dh) {
                            req.push(dh);
                            continue;
                        }
                        if (isInstallMod(element, false)) {
                            task.log(`Skip Dependency ${element.name}`);
                            continue;
                        }
                        const dep = await getModLinkMod(element.name);
                        if (!dep) {
                            task.log(`Missing Dependency ${element.name}`);
                            continue;
                        }
                        const group = getOrAddLocalMod(dep.name);
                        req.push(group.installNew(dep, false));
                    }
                }
                const wp = justCheckDep ? undefined : await this.installWithoutNewTask(mod, task);
                await Promise.all(req);
                LocalModsVersionGroup.downloadingMods.delete(mod.name);
                this.getLatest()?.enable(false);
                task.status = TaskItemStatus.Success;
                return wp as LocalModInstance;
            } catch (e: any) {
                task.log(e?.toString());
                LocalModsVersionGroup.downloadingMods.delete(mod.name);
                task.status = TaskItemStatus.Fail;
                throw e;
            }
        })();
        LocalModsVersionGroup.downloadingMods.set(mod.name, promise);
        return await promise;
    }
    public isEnabled() {
        for (let index = 0; index < this.versionsArray.length; index++) {
            const element = this.versionsArray[index];
            if (element.isEnabled()) return true;
        }
        return false;
    }
    public disableAll(disableSubMods = true) {
        if (this.versionsArray.length == 0) return;
        this.versionsArray[0].disable(true);
        if (disableSubMods) {
            for (const v of getSubMods(this.name, false)) {
                v.disable();
            }
        }
    }
    public canEnable() {
        if (!this.isInstalled()) return false;
        return this.getLatest()?.canEnable() ?? false;
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
            element.disable(false);

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
        deleteFile: boolean = false, moveToCorrectDir = true) {
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
        const rroot = getRealModPath(info.name);
        if (moveToCorrectDir && root != rroot) {
            for (const file of readdirSync(rroot)) {
                renameSync(join(rroot, file), join(root, file));
            }
        }
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
        const d = statSync(dp);
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
    if (ver_lg(lv, mod.version)) return true;
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

export function getLatestVersion(versions: string[]) {
    let l: string | undefined;
    for (const key of versions) {
        if (!l) {
            l = key;
        } else {
            if (ver_lg(key, l)) {
                l = key;
            }
        }
    }
    return l;
}

export function getOldestVersion(versions: string[]) {
    let l: string | undefined;
    for (const key of versions) {
        if (!l) {
            l = key;
        } else {
            if (!ver_lg(key, l) || !versions.includes(l)) {
                l = key;
            }
        }
    }
    return l;
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
    if (!provider.hasData()) return [];
    const result: string[] = [];
    for (const key in refreshLocalMods()) {
        const mod = getLocalMod(key);
        const lv = mod.getLatestVersion();
        if (!lv) continue;
        if (ver_lg(getModLinkModSync(key)?.version ?? '', lv)) {
            result.push(key);
        }
    }

    return result;
}

export function verifyModFiles(root: string, files: Record<string, string>, missingFilesRec?: string[]) {
    if (ignoreVerifyMods.has(root)) return LocalMod_FullLevel.None;
    const optionFileExt = ['.md', '.pdb'];
    const optionFileName = ['readme', 'readme.txt', 'license', 'license.txt'];
    let fulllevel = LocalMod_FullLevel.Full;
    for (const fn in files) {
        const sha = files[fn];
        const fp = join(root, fn);
        const isDll = extname(fn).toLowerCase() == '.dll';
        const isOption = optionFileExt.includes(extname(fn)?.toLowerCase()) || optionFileName.includes(basename(fn)?.toLowerCase());
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
