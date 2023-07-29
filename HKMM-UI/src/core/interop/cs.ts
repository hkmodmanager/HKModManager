import { enableWatchDog, initJSAPI, LocalPackageProxy, onSettingChanged, PackageProviderProxy, resetWatchDog } from "core";
import { join, resolve } from "path";
import { appDir, exePath, isPackaged, srcRoot, userData } from "../remoteCache";
import { store } from "../settings";
import * as remote from '@electron/remote';


initJSAPI({
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
    electronExe: exePath,
    appDataDir: userData
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

