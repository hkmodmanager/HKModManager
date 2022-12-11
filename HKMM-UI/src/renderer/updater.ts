import { app, ipcRenderer, remote } from "electron";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { isLaterVersion } from "./modManager";
import { downloadFile, downloadRaw } from "./utils/downloadFile";
import { exec, spawn } from 'child_process'

export interface ReleaseInfo {
    name: string;
    assets: {
        name: string;
        browser_download_url: string
    }[];
}

export function getUpdatePath() {
    const dir = join(remote.app.getPath('userData'), "update");
    if(!existsSync(dir)) mkdirSync(dir);
    return dir;
}

export function getUpdateSetup() {
    return join(getUpdatePath(), 'setup.exe');
}

export async function checkUpdate() {
    const releases: ReleaseInfo[] = (await downloadFile<ReleaseInfo[]>('https://api.github.com/repos/HKLab/HKModManager/releases')).data;
    const latest = releases[0];
    if(!latest) return undefined;
    const cver = remote.app.getVersion();
    const sver = latest.name.replaceAll('v', '');
    if(isLaterVersion(sver, cver)) {
        const durl = latest.assets.find(x => x.name.endsWith('-Setup.exe'))?.browser_download_url;
        if(!durl) return undefined;
        return [durl, sver];
    }
    return undefined;
}

export async function installUpdate() {
    console.log('Update');
    const result = await checkUpdate();
    if(!result) return;
    let raw: Buffer;
    if(remote.app.isPackaged) {
        raw = await downloadRaw(result[0], undefined, undefined, undefined, 'Download Setup', 'Download');
    } else {
        raw = readFileSync("F:\\HKLab\\HKMM\\HKMM-UI\\dist_electron\\HKModManager-1.4.1-Setup.exe");
    }
    writeFileSync(getUpdateSetup(), raw, 'binary');
    console.log(getUpdateSetup());
    ipcRenderer.send('update-setup-done', getUpdateSetup());
    remote.dialog.showMessageBoxSync({
        message: 'The update will start after you close the application.'
    });
}
