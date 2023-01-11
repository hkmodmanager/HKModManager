import { createHash } from "crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { extname, join } from "path";
import { gl } from "../exportGlobal";
import { hasModLink_ei_files, modlinksCache, ModLinksManifestData } from "../modlinks/modlinks";
import { getOrAddLocalMod, getRealModPath } from "../modManager";
import { scanScarabMods } from "./Scarab/RScarab";

export interface IRLocalModInfo {
    fulllevel: LocalMod_FullLevel;
    missingFiles: string[];
}

export interface IRLocalMod extends IRLocalModInfo {
    name: string;
    path: string;
    mod: ModLinksManifestData;
}

export enum LocalMod_FullLevel {
    DllNotFull = 0,
    DllFullButResourceNotFull = 1,
    ResourceFull =  2,
    Full
}

export const optionFileExt = [ '.md', '.pdb' ];

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
    let fulllevel: LocalMod_FullLevel = LocalMod_FullLevel.Full;
    const missingFiles: string[] = [];
    const m_files = matchmod.ei_files?.files as Record<string, string>;
    for (const fn in m_files) {
        const sha = m_files[fn];
        const fp = join(root, fn);
        const isDll = extname(fn).toLowerCase() == '.dll';
        const isOption = optionFileExt.includes(extname(fn)?.toLowerCase());
        const fsha = existsSync(fp) ? createHash('sha256').update(readFileSync(fp)).digest('hex') : undefined;
        if(fsha != sha) {
            if(isDll) {
                if(fulllevel > LocalMod_FullLevel.DllNotFull) fulllevel = LocalMod_FullLevel.DllNotFull;
            } else if(isOption) {
                if(fulllevel > LocalMod_FullLevel.ResourceFull) fulllevel = LocalMod_FullLevel.ResourceFull;
            } else {
                if(fulllevel > LocalMod_FullLevel.DllFullButResourceNotFull) fulllevel = LocalMod_FullLevel.DllFullButResourceNotFull;
            }
            missingFiles.push(fn);
            continue;
        }
    }
    return {
        name: matchmod.name,
        path: root,
        mod: matchmod,
        fulllevel,
        missingFiles
    };
}

export function RL_ScanLocalMods(ignoreScarab: boolean = true) {
    const ml = modlinksCache;
    if (!ml || !hasModLink_ei_files()) {
        console.log(`No ModLinks`);
        return [];
    }
    const ignoreMods: string[] = [];
    if (ignoreScarab) {
        for (const mod of scanScarabMods()) {
            ignoreMods.push(mod.name);
        }
    }
    const result: IRLocalMod[] = [];
    const root = getRealModPath();
    console.log(`[RL]Begin search local mod in ${root}`);
    for (const modname of readdirSync(root, 'utf-8')) {
        if (modname == 'Disabled' || ignoreMods.includes(modname)) continue;
        const p = join(root, modname);
        const state = statSync(p);
        if (!state.isDirectory()) continue;
        const mod = RL_CheckMod(p);
        if(!mod) continue;
        result.push(mod);
    }
    return result;
}

export function RL_ImportLocalMods(mods: IRLocalMod[], exclusive = true) {
    for (const mod of mods) {
        const name = mod.name;
        const lm = getOrAddLocalMod(name);
        const modinfo: IRLocalModInfo = {
            fulllevel: mod.fulllevel,
            missingFiles: mod.missingFiles
        };
        lm.installLocalMod({
            name: mod.name,
            version: mod.mod.version,
            install: Date.now(),
            path: mod.path,
            modinfo: mod.mod,
            imported: {
                localmod: modinfo
            }
        }, mod.path, mod.mod.ei_files?.files as Record<string, string>, exclusive);
    }
}

gl.RL_ScanLocalMods = RL_ScanLocalMods;
