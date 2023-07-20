import { initJSAPI, LegacyModCollection, LocalPackageProxy, PackageProviderProxy } from "core";
import { existsSync, mkdirSync } from "fs-extra";
import { join } from "path";
import { appDir, isPackaged, srcRoot, userData } from "../remoteCache";
import { ModSavePathMode, store } from "../settings";
import { parseAPILink } from "./parser/api";
import { parseModLinks } from "./parser/modlinks";



initJSAPI({
    getConfigPath() {
        return store.path;
    },
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
    getGameInjectRoot() {
        return !isPackaged ? (
            join(srcRoot, "..", "gameinject", "Output") //Debug
        ) : (
            join(appDir, "managed")
        );
    },
    getInternalLibRoot() {
        return !isPackaged ? (
            join(srcRoot, "managed") //Debug
        ) : (
            join(appDir, "managed")
        );
    },
    getCacheDir() {
        return join(userData, "hkmm-cache");
    }
});

setInterval(() => {
    LocalPackageProxy.getAllMods();
}, 1000);

LocalPackageProxy.getAllMods();
PackageProviderProxy.getRoot().getAllPackages(false);

