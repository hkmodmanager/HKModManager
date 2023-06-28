
import { zip } from 'compressing';
import { copyFileSync, existsSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join, parse } from 'path';
import { apiInfoCache, getAPIInfo, ModdingAPIData } from './modlinks/modlinks';
import { installGameInject } from './gameinject';
import { store } from './settings';
import { startTask } from './taskManager';
import { downloadRaw } from './utils/downloadFile';
import * as dn from 'core'

export function getAPIPath(root?: string) {
    return join(root ?? store.get('gamepath'), "hollow_knight_Data", "Managed", "Assembly-CSharp.dll");
}


export function getAPIVersion(path?: string) {
    return dn.getAPIVersion(path ?? getAPIPath());
}

export function installedAPI() {
    return getAPIVersion() > 0;
}

export function getGameVersion(path?: string) {
    return dn.getGameVersion(path ?? getAPIPath());
}

export function matchAPI(api: string) {
    const gv = getGameVersion();
    const apiv = getGameVersion(api);
    if (gv !== apiv) return false;
    return true;
}

export async function getLatestIsMatch() {
    const api = await getAPIInfo();
    return getLatestIsMatchSync(api) as boolean;
}

export function getLatestIsMatchSync(apiInfo?: ModdingAPIData) {
    if (store.get('cdn') == 'SCARABCN') return true;
    apiInfo = apiInfo ?? apiInfoCache;
    if (!apiInfo) return undefined;

    const url = new URL(apiInfo.link);
    const pp = url.pathname.split('/');
    const fv = pp[5].split('-')[0];
    if (fv !== getGameVersion()) return false;
    return true;
}

export function checkGameFile(root: string): boolean | string {
    try {
        if (!existsSync(root)) {
            return "invaild_path";
        }
        const apipath = getAPIPath(root);
        if (!existsSync(apipath)) {
            return "broken";
        }

        const gv = getGameVersion(apipath);
        if (gv == '') return "no_hk";
        const ver = gv.split('.');
        if (ver.length < 2) return "broken";
        if (Number.parseInt(ver[1]) < 5) return "hk_out_of_date";
    } catch (e) {
        console.error(e);
        return "broken";
    }
    return true;
}

export function findHKPath()
{
    return dn.tryFindGamePath();
}

export function copyBackup() {
    if (getAPIVersion() > 0) return false;
    const api = getAPIPath();
    if (!existsSync(api)) return false;
    copyFileSync(api, getBackupPath());
    return true;
}

export function resotreBackup() {
    const bp = getBackupPath();
    if (!existsSync(bp)) return;
    copyFileSync(getBackupPath(), join(dirname(bp), "Assembly-CSharp.dll"));
}

export function getBackupPath() {
    const mp = dirname(getAPIPath());
    const bp = join(mp, "Backup-API.backup");
    return bp;
}

export function isVaildBackup() {
    const bp = getBackupPath();
    if (!existsSync(bp)) return false;
    try {
        return getAPIVersion(bp) <= 0;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export let isDownloadingAPI = false;

export async function downloadAPI() {
    if(isDownloadingAPI) return;
    startTask("Download API", async (task) => {
        isDownloadingAPI = true;
        try {
            copyBackup();
            task.log("Get latest api info");
            const link = (await getAPIInfo()).link;
            const raw = await downloadRaw(link, undefined, task);
            task.log("Uncompress api");
            const tf = join(tmpdir(), "api.zip");
            writeFileSync(tf, raw);
            await zip.uncompress(tf, parse(getAPIPath()).dir);
            installGameInject();
        } finally {
            isDownloadingAPI = false;
        }
    });
}
