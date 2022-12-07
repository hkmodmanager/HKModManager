import { remote } from "electron";
import { func } from "electron-edge-js";
import { existsSync, mkdirSync, rmSync, symlinkSync } from "fs";
import { outputJSONSync, readJSONSync } from "fs-extra";
import { dirname, join, parse } from "path"

export function getNetUtilsPath() {
    const exename = parse(remote.app.getPath("exe"));

    return !remote.app.isPackaged ? (
        join(dirname(dirname(dirname(exename.dir))), "..", "netutils", "bin", "Debug", "netutils.dll") //Debug
    ) : (
        join(exename.dir, "managed", "netutils.dll")
    );
}


export function netfunc(method: string, type: string = "HKMM.NetUtils") {
    return func({
        assemblyFile: getNetUtilsPath(),
        typeName: type,
        methodName: method
    })
}

