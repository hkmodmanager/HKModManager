import { getLocalMod, getRealModPath, isLaterVersion } from "@/renderer/modManager";
import { isVaildModDir } from "@/renderer/utils/utils";
import { remote } from "electron";
import { existsSync } from "fs";
import { readJSONSync } from "fs-extra";
import { dirname, join } from "path";
import { Component, ComputedOptions, MethodOptions } from "vue";
import { IModRelocation } from "../IModRelocation";

interface ModState {
    Version: string;
    Enabled: boolean;
}

interface ModInfo {
    mod: ModState;
    path: string;
}

interface ModConfig {
    Mods: Record<string, ModState>;
}

export function getScarabModConfig() {
    return join(remote.app.getPath('appData'), 'HKModInstaller', 'InstalledMods.json');
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
            path: mp
        });
    }
    return result;
}

export class RL_Scarab implements IModRelocation {
    getModal() {
        return require('@/view/relocation/modal-scarab.vue');
    }
    isRequired(): boolean {
        return scanScarabMods().length > 0;
    }
    
}
