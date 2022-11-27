import { dirname, join } from "path"

export function getResPath() {
    if(process.env.WEBPACK_SERVE) {
        return join(dirname(process.env.npm_package_json as string), "resources");
    }
    return 'F:\\HKLab\\HKMM\\HKMM-UI\\resources';
}

export function getNetUtilsPath() {
    return join(getResPath(), "netutils.dll");
}
