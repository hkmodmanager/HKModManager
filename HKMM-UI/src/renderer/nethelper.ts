import { func } from "electron-edge-js";
import { join } from "path"
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

const net_clipboard_putfile = netfunc("ClipboardCopyFile");
const net_DownloadFileSeg = netfunc("DownloadFileSeg");

export function Clipboard_PutFile(path: string) {
    net_clipboard_putfile({
        file: path
    }, true);
}

export function DownloadFileSeg(url: string, from: number, to: number) {
    return new Promise<Buffer>((resolve, reject) => {
        net_DownloadFileSeg({
            url, from, to
        }, (error, result) => {
            if(error) reject(error);
            else {
                const r = result as Uint8Array;
                console.log(r.length);
                resolve(Buffer.from(r));
            }
        });
    });
}

