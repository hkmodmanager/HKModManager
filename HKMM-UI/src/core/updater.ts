import * as remote from "@electron/remote";
import { copyFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { downloadRaw, downloadText, getFileSize } from "./utils/downloadFile";
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { appDir, appVersion, isPackaged, srcRoot } from "./remoteCache";
import * as semver from "semver"
import { hasOption } from "./settings";
import { getModDate } from "./modlinks/modlinks";
import { buildMetadata, IBuildMetadata } from "./exportGlobal";

const w_any = window as any;
const orig_any = w_any.node_require ?? eval('window.require');

export const node_require = w_any.node_require = orig_any;
export const webpack_require = w_any.webpack_require = __webpack_require__;

export function node_import<T>(modulename: string, ep?: string) {
    const module = node_require(modulename);
    if(ep) {
        return module[ep] as T;
    }
    return module as T;
}


export interface ReleaseInfo {
    name: string;
    assets: {
        name: string;
        browser_download_url: string
    }[];
    created_at: string;
    tag_name: string;
}

export interface TagInfo {
    name: string;
    commit: {
        sha: string;
    };
}

export interface UpdateInfo {
    version: string;
    url: string;
    size?: number;
    date: number;
    commit: string;
}

async function checkUpdateAsync(rsize = false): Promise<UpdateInfo | undefined> {
    const alpha: IBuildMetadata = JSON.parse(await downloadText(`https://raw.githubusercontent.com/HKLab/HKModManager/alpha-binary/hkmm.json`));
    if (alpha.buildTime < buildMetadata.buildTime || alpha.headCommit == buildMetadata.headCommit) return undefined;
    const durl = `https://raw.githubusercontent.com/HKLab/HKModManager/alpha-binary/update.zip`;
    return {
        version: `${alpha.version}-alpha-${alpha.headCommit.substring(0, 7)}`,
        url: durl,
        size: (rsize ? (await getFileSize(durl)) : undefined),
        date: alpha.buildTime,
        commit: alpha.headCommit
    };
}

export async function checkUpdate(rsize = false): Promise<UpdateInfo | undefined> {
    if(!isPackaged) return undefined;
    let alphaUpdate: UpdateInfo | undefined = undefined;
    let releaseUpdate: UpdateInfo | undefined = undefined;
    try {
        if(hasOption('ACCEPT_APLHA_RELEASE')) alphaUpdate = await checkUpdateAsync(rsize);
    } catch (e) {
        console.error(e);
    }
    try {
        const releases: ReleaseInfo[] = JSON.parse(await downloadText('https://api.github.com/repos/HKLab/HKModManager/releases'));
        for (const release of releases) {
            if (!release) continue;
            const cver = appVersion;
            const sver = semver.clean(release.name);
            if (!sver) continue;
            const pre = semver.prerelease(sver);
            if ((pre?.length ?? 0) > 0 && !hasOption('ACCEPT_PRE_RELEASE')) continue;
            if (semver.gt(sver, cver)) {
                const durl = release.assets.find(x => x.name == 'update-v3.zip')?.browser_download_url;
                if (!durl) continue;
                const tags: TagInfo[]= JSON.parse(await downloadText('https://api.github.com/repos/HKLab/HKModManager/tags'));
                const tag = tags.find(x => x.name == release.tag_name);
                releaseUpdate= {
                    version: sver,
                    url: durl,
                    size: (rsize ? (await getFileSize(durl)) : undefined),
                    date: getModDate(release.created_at).valueOf(),
                    commit: tag?.commit.sha ?? '0000000000000000000000000000000000000000'
                };
                break;
            } else {
                break;
            }
        }
    } catch (e) {
        console.error(e);
    }
    if(!alphaUpdate) return releaseUpdate;
    if(!releaseUpdate) return alphaUpdate;
    if(releaseUpdate.date > alphaUpdate.date || releaseUpdate.commit == alphaUpdate.commit) return releaseUpdate;
    return alphaUpdate;
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
