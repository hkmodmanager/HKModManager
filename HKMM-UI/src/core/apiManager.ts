
import { copyFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { store } from './settings';
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

