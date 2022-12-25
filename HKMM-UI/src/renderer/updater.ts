import { app, ipcRenderer, remote } from "electron";
import { constants, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { isLaterVersion } from "./modManager";
import { downloadFile, downloadRaw, getFileSize } from "./utils/downloadFile";
import { ChildProcessWithoutNullStreams, exec, spawn, spawnSync } from 'child_process'
import { zip } from "compressing";
import { appDir, appVersion, isPackaged, srcRoot, userData } from "./remoteCache";
import { node_import, node_require } from "./plugins";

export interface ReleaseInfo {
    name: string;
    assets: {
        name: string;
        browser_download_url: string
    }[];
}

export interface UpdateInfo {
    version: string;
    url: string;
    size?: number;
}

export async function checkUpdate(rsize = false): Promise<UpdateInfo | undefined> {
    const releases: ReleaseInfo[] = (await downloadFile<ReleaseInfo[]>('https://api.github.com/repos/HKLab/HKModManager/releases')).data;
    const latest = releases[0];
    if(!latest) return undefined;
    const cver = appVersion;
    const sver = latest.name.replaceAll('v', '');
    if(isLaterVersion(sver, cver)) {
        const durl = latest.assets.find(x => x.name == 'update.zip')?.browser_download_url;
        if(!durl) return undefined;
        return {
            version: sver,
            url: durl,
            size: (rsize ? (await getFileSize(durl)) : undefined)
        };
    }
    return undefined;
}

export let updaterProc: ChildProcessWithoutNullStreams;

export async function installUpdate() {
    console.log('Update');
    if(updaterProc) {
        if(updaterProc.exitCode == null) {
            updaterProc.kill('SIGKILL');
        }
    }
    const result = await checkUpdate();
    if(!result) return;
    const raw = await downloadRaw(result.url, undefined, undefined, undefined, 'Download Setup', 'Download');
    const updateFile = isPackaged ? join(appDir, 'update.zip') : join(srcRoot, 'dist_electron', 'win-unpacked', 'update.zip');
    writeFileSync(updateFile, raw);
    const updater = join(dirname(updateFile), 'updater.exe');
    copyFileSync(isPackaged ? join(appDir, 'updater', 'updater.exe') : join(srcRoot, '..', 'updater', 'bin', 'Debug', 'updater.exe'),
        updater);
    console.log(updateFile);
    console.log(updater);
    const n_spawn = node_import<typeof spawn>('child_process', 'spawn');
    updaterProc = n_spawn(updater, [ 'false', remote.process.pid.toString() ], {
        shell: false,
        detached: true
    });
}
