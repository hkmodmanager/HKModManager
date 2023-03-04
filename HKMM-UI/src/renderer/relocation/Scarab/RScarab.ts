import { modlinksCache } from "@/renderer/modlinks/modlinks";
import { getLocalMod, getOrAddLocalMod, getRealModPath, isLaterVersion, LocalModInstance, LocalMod_FullLevel, verifyModFiles } from "@/renderer/modManager";
import { isVaildModDir } from "@/renderer/utils/utils";
import * as remote from "@electron/remote";
import { existsSync } from "fs";
import { copySync, readJSONSync, writeJSONSync } from "fs-extra";
import { dirname, join } from "path";

export interface ModState {
    Version: string;
    Enabled: boolean;
}

export interface ModInfo {
    mod: ModState;
    name: string;
    path: string;
}

export interface ModConfig {
    Mods: Record<string, ModState>;
}

export function getScarabModConfig() {
    return join(remote.app.getPath('appData'), 'HKModInstaller', 'InstalledMods.json');
}

export function exportMods(mods: LocalModInstance[]) {
    const mcp = getScarabModConfig();
    if (!existsSync(mcp)) return;
    const mc: ModConfig = readJSONSync(mcp);
    if (!mc.Mods) return;
    console.log(mods);
    for (const mod of mods) {
        //const files = mod.info.modinfo.ei_files?.files;
        //if(!files) continue;
        const realroot = getRealModPath(mod.info.name, !mod.isActived());
        const root = mod.info.path;
        console.log(realroot);
        copySync(root, realroot, {
            overwrite: true,
            recursive: true
        });
        const ms: ModState = {
            Version: mod.info.version,
            Enabled: mod.isActived()
        };
        mc.Mods[mod.info.name] = ms;
    }
    writeJSONSync(mcp, mc, {
        spaces: 4
    });
}

export function importMods(mods: ModInfo[], exclusive = true) {
    const mcp = getScarabModConfig();
    if (!existsSync(mcp)) return;
    const mc: ModConfig = readJSONSync(mcp);
    if (!mc.Mods) return;
    for (const mod of mods) {
        const lm = getOrAddLocalMod(mod.name);
        let mlm = modlinksCache?.getMod(mod.name, mod.mod.Version);
        if (!mlm) continue;
        mlm = { ...mlm };
        mlm.version = mod.mod.Version;
        const missingFiles: string[] = [];
        const result = lm.installLocalMod({
            modinfo: mlm,
            path: mod.path,
            name: mod.name,
            version: mod.mod.Version,
            install: Date.now(),
            modVerify: {
                fulllevel: mlm.ei_files?.files ? verifyModFiles(mod.path, mlm.ei_files?.files, missingFiles) : LocalMod_FullLevel.Full,
                missingFiles,
                verifyDate: Date.now()
            },
            imported: {
                fromScarab: true,
                nonExclusiveImport: !exclusive,

            }
        }, mod.path, undefined, exclusive, true);
        if (!result) continue;
        copySync(join(result.info.path, 'modversion.json'), join(mod.path, 'modversion.json'));
        result.writeMetadataPath();
        if (exclusive) delete mc.Mods[mod.name];
        /*try {
            rmSync(mod.path, {
                recursive: true
            });
        } catch (e) {
            console.error(e);
        }*/
    }
    writeJSONSync(mcp, mc, {
        spaces: 4
    });
}

export function scanScarabMods() {
    const mcp = getScarabModConfig();
    if (!existsSync(mcp)) return [];
    const mc: ModConfig = readJSONSync(mcp);
    if (!mc.Mods) return [];

    const disabledP = join(getRealModPath("Disabled"));
    const modsP = dirname(disabledP);
    const result: ModInfo[] = [];

    for (const name in mc.Mods) {
        const mod = mc.Mods[name];
        let mp = join(modsP, name);
        if (!isVaildModDir(mp)) {
            mp = join(disabledP, name);
            if (!isVaildModDir(mp)) {
                continue;
            }
        }
        const lm = getLocalMod(name);
        if (lm) {
            const lv = lm.getLatestVersion();
            if (lv) {
                if (isLaterVersion(lv, mod.Version) || lv == mod.Version) continue;
            }
        }
        const mm = modlinksCache?.getMod(name, mod.Version);
        if (!mm) continue;
        if (!mm.ei_files) continue;
        result.push({
            mod: mod,
            name: name,
            path: mp
        });
    }
    return result;
}
