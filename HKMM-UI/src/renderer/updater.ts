import { app, ipcRenderer, remote } from "electron";
import { constants, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { isLaterVersion } from "./modManager";
import { downloadFile, downloadRaw } from "./utils/downloadFile";
import { exec, spawn, spawnSync } from 'child_process'
import { zip } from "compressing";
import { appDir, appVersion, isPackaged, srcRoot, userData } from "./remoteCache";

export interface ReleaseInfo {
    name: string;
    assets: {
        name: string;
        browser_download_url: string
    }[];
}

export async function checkUpdate() {
    const releases: ReleaseInfo[] = (await downloadFile<ReleaseInfo[]>('https://api.github.com/repos/HKLab/HKModManager/releases')).data;
    const latest = releases[0];
    if(!latest) return undefined;
    const cver = appVersion;
    const sver = latest.name.replaceAll('v', '');
    if(isLaterVersion(sver, cver)) {
        const durl = latest.assets.find(x => x.name == 'update.zip')?.browser_download_url;
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
    if(isPackaged) {
        raw = await downloadRaw(result[0], undefined, undefined, undefined, 'Download Setup', 'Download');
    } else {
        raw = readFileSync(join(srcRoot, 'dist_electron', 'update.zip'));
    }
    const updateFile = isPackaged ? join(appDir, 'update.zip') : join(srcRoot, 'dist_electron', 'win-unpacked', 'update.zip');
    writeFileSync(updateFile, raw);
    const updater = join(dirname(updateFile), 'updater.exe');
    copyFileSync(isPackaged ? join(appDir, 'updater', 'updater.exe') : join(srcRoot, '..', 'updater', 'bin', 'Debug', 'updater.exe'),
        updater);
    console.log(updateFile);
    console.log(updater);
    spawn(updater, [ 'false', remote.process.pid.toString() ], {
        shell: false,
        detached: true
    });
}
