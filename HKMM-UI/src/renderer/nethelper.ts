import { remote } from "electron";
import { func } from "electron-edge-js";
import { existsSync, mkdirSync, rmSync, symlinkSync } from "fs";
import { outputJSONSync, readJSONSync } from "fs-extra";
import { dirname, join, parse } from "path"
import { appDir, isPackaged, srcRoot } from "./remoteCache";

export function getNetUtilsPath() {
    return !isPackaged ? (
        join(srcRoot, "..", "netutils", "bin", "Debug", "netutils.dll") //Debug
    ) : (
        join(appDir, "managed", "netutils.dll")
    );
}


export function netfunc(method: string, type: string = "HKMM.NetUtils") {
    return func({
        assemblyFile: getNetUtilsPath(),
        typeName: type,
        methodName: method
    })
}

