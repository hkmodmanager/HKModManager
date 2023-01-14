import { app, ipcRenderer } from "electron";
import * as remote from "@electron/remote";
import { constants, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { isLaterVersion } from "./modManager";
import { downloadFile, downloadRaw, downloadText, getFileSize } from "./utils/downloadFile";
import { ChildProcessWithoutNullStreams, exec, spawn, spawnSync } from 'child_process'
import { zip } from "compressing";
import { appDir, appVersion, isPackaged, srcRoot, userData } from "./remoteCache";
import { node_import, node_require } from "./plugins";
import * as semver from "semver"
import { hasOption } from "./settings";

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
    const releases: ReleaseInfo[] = JSON.parse(await downloadText('https://api.github.com/repos/HKLab/HKModManager/releases'));
    if (releases.length == 0) return undefined;
    for (const release of releases) {
        if (!release) return undefined;
        const cver = appVersion;
        const sver = semver.clean(release.name);
        if (!sver) return undefined;
        const pre = semver.prerelease(sver);
        if((pre?.length ?? 0) > 0 && !hasOption('ACCEPT_PRE_RELEASE')) continue;
        if (semver.gt(sver, cver)) {
            const durl = release.assets.find(x => x.name == 'update.zip')?.browser_download_url;
            if (!durl) return undefined;
            return {
                version: sver,
                url: durl,
                size: (rsize ? (await getFileSize(durl)) : undefined)
            };
        } else {
            break;
        }
    }
    return undefined;
}

export let updaterProc: ChildProcessWithoutNullStreams;

export async function installUpdate() {
    console.log('Update');
    if (updaterProc) {
        if (updaterProc.exitCode == null) {
            updaterProc.kill('SIGKILL');
        }
    }
    const result = await checkUpdate();
    if (!result) return;
    const raw = await downloadRaw(result.url, undefined, undefined, undefined, 'Download Setup', 'Download');
    const updateFile = isPackaged ? join(appDir, 'update.zip') : join(srcRoot, 'dist_electron', 'win-unpacked', 'update.zip');
    writeFileSync(updateFile, raw);
    const updater = join(dirname(updateFile), 'updater.exe');
    copyFileSync(isPackaged ? join(appDir, 'updater', 'updater.exe') : join(srcRoot, '..', 'updater', 'bin', 'Debug', 'updater.exe'),
        updater);
    console.log(updateFile);
    console.log(updater);
    const n_spawn = node_import<typeof spawn>('child_process', 'spawn');
    updaterProc = n_spawn(updater, ['false', remote.process.pid.toString()], {
        shell: false,
        detached: true
    });
}
