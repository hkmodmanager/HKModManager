import { remote } from "electron";
import { func } from "electron-edge-js";
import { dirname, join, parse } from "path"

export function getResPath() {
    if (process.env.WEBPACK_SERVE) {
        return join(dirname(process.env.npm_package_json as string), "resources");
    }
    const exename = parse(remote.app.getPath("exe"));

    return !remote.app.isPackaged ? (
        join(dirname(dirname(dirname(exename.dir))), "resources") //Debug
    ) : (
        join(exename.dir, "resources", "res")
    );
}

export function getNetUtilsPath() {
    return join(getResPath(), "netutils.dll");
}

export function netfunc(method: string, type: string = "HKMM.NetUtils") {
    return func({
        assemblyFile: getNetUtilsPath(),
        typeName: type,
        methodName: method
    })
}
