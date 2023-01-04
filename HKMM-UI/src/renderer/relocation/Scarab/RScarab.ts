import { getModLinkModSync } from "@/renderer/modlinks/modlinks";
import { getLocalMod, getOrAddLocalMod, getRealModPath, isLaterVersion } from "@/renderer/modManager";
import { isVaildModDir } from "@/renderer/utils/utils";
import { remote } from "electron";
import { existsSync, readdirSync, rmSync } from "fs";
import { readJSONSync, writeJSONSync } from "fs-extra";
import { dirname, join } from "path";
import { Component, ComputedOptions, MethodOptions } from "vue";

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

export function importMods(mods: ModInfo[]) {
    const mcp = getScarabModConfig();
    if (!existsSync(mcp)) return;
    const mc: ModConfig = readJSONSync(mcp);
    if (!mc.Mods) return;
    for (const mod of mods) {
        const lm = getOrAddLocalMod(mod.name);
        let mlm = getModLinkModSync(mod.name);
        if (!mlm) continue;
        mlm = { ...mlm };
        mlm.version = mod.mod.Version;
        lm.installLocalMod({
            modinfo: mlm,
            path: mod.path,
            name: mod.name,
            version: mod.mod.Version,
            install: Date.now(),
            files: readdirSync(mod.path, 'utf8')
        }, mod.path);
        delete mc.Mods[mod.name];
        try {
            rmSync(mod.path, {
                recursive: true
            });
        } catch (e) {
            console.error(e);
        }
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
        result.push({
            mod: mod,
            name: name,
            path: mp
        });
    }
    return result;
}
