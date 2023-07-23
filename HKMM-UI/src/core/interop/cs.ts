import { enableWatchDog, initJSAPI, LegacyModCollection, LocalPackageProxy, onSettingChanged, PackageProviderProxy, resetWatchDog } from "core";
import { existsSync, mkdirSync } from "fs-extra";
import { join, resolve } from "path";
import { appDir, exePath, isPackaged, srcRoot, userData } from "../remoteCache";
import { ModSavePathMode, store } from "../settings";
import { parseAPILink } from "./parser/api";
import { parseModLinks } from "./parser/modlinks";
import * as remote from '@electron/remote';


initJSAPI({
    async parseAPILink(arg1) {
        const api = await parseAPILink(arg1);

        return {
            name: "ModdingAPI",
            version: api.version + ".0.0.0",
            link: api.link,
            authors: [],
            integrations: [],
            dependencies: [],
            desc: "",
            tags: []
        };
    },
    async parseModLinks(arg1) {
        const col = new LegacyModCollection();
        const mods = await parseModLinks(arg1);
        for (const name in mods) {
            const mod = mods[name];
            col.addMod(mod);
        }
        return col;
    },
    getModStorePath() {
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
    },
    gameInjectRoot: (function() {
        return !isPackaged ? (
            join(srcRoot, "..", "gameinject", "Output") //Debug
        ) : (
            join(appDir, "managed")
        );
    })(),
    internalLibRoot: (function() {
        return !isPackaged ? (
            join(srcRoot, "managed") //Debug
        ) : (
            join(appDir, "managed")
        );
    })(),
    cacheDir: join(userData, "hkmm-cache"),
    startArgv: (function() {
        if(!isPackaged) {
            return "\"" + resolve(remote.process.argv[1]) + "\"";
        }
        return "";
    })(),
    watchDogCheck() {

    },
    electronExe: exePath
});


onSettingChanged(store.path);

setInterval(() => {
    LocalPackageProxy.getAllMods();
}, 1000);

setInterval(() => {
    resetWatchDog();
}, 500);

resetWatchDog();
LocalPackageProxy.getAllMods();
PackageProviderProxy.getRoot().getAllPackages(false);

export function syncInvoke(action: () => void) {
    try
    {
        enableWatchDog(false);
        action();
    }
    finally
    {
        enableWatchDog(true);
    }
}

