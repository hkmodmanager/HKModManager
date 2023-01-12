import { createHash } from "crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { extname, join } from "path";
import { gl } from "../exportGlobal";
import { hasModLink_ei_files, modlinksCache, ModLinksManifestData } from "../modlinks/modlinks";
import { getOrAddLocalMod, getRealModPath, IImportedLocalModVaild, isLaterVersion, LocalMod_FullLevel, refreshLocalMods, vaildModFiles } from "../modManager";
import { scanScarabMods } from "./Scarab/RScarab";



export interface IRLocalMod extends IImportedLocalModVaild {
    name: string;
    path: string;
    mod: ModLinksManifestData;
}

export function RL_CheckMod(root: string): IRLocalMod | undefined {
    const ml = modlinksCache;
    if (!ml || !hasModLink_ei_files()) {
        return;
    }
    console.log(`[RL]Search in ${root}`);
    const files = readdirSync(root, 'utf-8');
    const dllns: [string, string][] = [];
    for (const file of files) {
        if (extname(file)?.toLowerCase() == '.dll') {
            const dp = join(root, file);
            const sha = createHash('sha256').update(readFileSync(dp)).digest('hex');
            dllns.push([file, sha]);
            console.log(`[RL]Found dll: ${dp} :::sha256=${sha}`);
        }
    }
    if (dllns.length == 0) {
        console.log(`[RL]Not mod folder: ${root}`);
        return;
    }
    const matchmods: [ModLinksManifestData, number][] = [];
    for (const modname in ml.mods.mods) {
        const modvers = ml.mods.mods[modname];
        for (const ver in modvers) {
            const mod = modvers[ver];
            const files = mod.ei_files?.files;
            if (!files) continue;
            let count = 0;
            for (const f in files) {
                const sha = files[f];
                if (dllns.findIndex(x => x[1] == sha) != -1) count++;
            }
            if (count > 0) {
                matchmods.push([mod, count]);
            }
        }
    }
    if (matchmods.length == 0) {
        console.log(`[RL]No match mod: ${root}`);
        return;
    }
    console.log(`[RL]Match mod count: ${matchmods.length}`);
    let matchmod: ModLinksManifestData = undefined as any;
    if (matchmods.length == 1) {
        matchmod = matchmods[0][0];
    } else {
        let match: [ModLinksManifestData, number] | undefined = undefined;
        for (const mod of matchmods) {
            if (!match || match[1] < mod[1]) {
                match = mod;
            }
        }
        if (!match) return;
        matchmod = match[0];
    }
    const missingFiles: string[] = [];
    const m_files = matchmod.ei_files?.files as Record<string, string>;
    
    
    return {
        name: matchmod.name,
        path: root,
        mod: matchmod,
        fulllevel: vaildModFiles(root, m_files, missingFiles),
        missingFiles
    };
}
let localmodsCache: IRLocalMod[] | undefined = undefined;

export function RL_ScanLocalMods(ignoreScarab: boolean = true, ignoreHKMM: boolean = true, force: boolean = false) {

    const ignoreMods: [string, string][] = [];
    if (ignoreScarab) {
        for (const mod of scanScarabMods()) {
            ignoreMods.push([mod.name, "99999.999999.999999"]);
        }
    }
    if (ignoreHKMM) {
        const lms = refreshLocalMods();
        for (const name in lms) {
            const lm = lms[name];
            const lv = lm.getLatestVersion();
            if (lv) ignoreMods.push([name, lv]);
        }
    }
    const result: IRLocalMod[] = [];
    if (localmodsCache && !force) {
        for (const mod of localmodsCache) {
            if (ignoreMods.find(x => x[0] == mod.name && (isLaterVersion(x[1], mod.mod.version) || x[1] == mod.mod.version))) continue;
            result.push(mod);
        }
        return result;
    }
    const ml = modlinksCache;
    if (!ml || !hasModLink_ei_files()) {
        console.log(`No ModLinks`);
        return [];
    }

    const root = getRealModPath();
    console.log(`[RL]Begin search local mod in ${root}`);
    localmodsCache = [];
    for (const modname of readdirSync(root, 'utf-8')) {
        if (modname == 'Disabled') continue;
        const p = join(root, modname);
        const state = statSync(p);
        if (!state.isDirectory()) continue;
        const mod = RL_CheckMod(p);
        if (!mod) continue;
        localmodsCache.push(mod);
        if (ignoreMods.find(x => x[0] == mod.name && (isLaterVersion(x[1], mod.mod.version) || x[1] == mod.mod.version))) continue;
        result.push(mod);
    }
    return result;
}

export function RL_ImportLocalMods(mods: IRLocalMod[], exclusive = true) {
    for (const mod of mods) {
        const name = mod.name;
        const lm = getOrAddLocalMod(name);
        const modinfo: IRLocalMod = {
            ...mod
        };
        delete (modinfo as any)['mod'];
        lm.installLocalMod({
            name: mod.name,
            version: mod.mod.version,
            install: Date.now(),
            path: mod.path,
            modinfo: mod.mod,
            imported: {
                localmod: modinfo,
                nonExclusiveImport: !exclusive,
                modVaild: modinfo
            }
        }, mod.path, mod.mod.ei_files?.files as Record<string, string>, exclusive);
    }
    RL_ClearCache();
}

export function RL_ClearCache() {
    localmodsCache = undefined;
}

gl.RL_ScanLocalMods = RL_ScanLocalMods;
