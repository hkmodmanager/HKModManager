
import { existsSync } from 'fs';
import { join } from 'path';
import { store } from './settings';
import * as dn from 'core'

export function getAPIPath(root?: string) {
    return join(root ?? store.get('gamepath'), "hollow_knight_Data", "Managed", "Assembly-CSharp.dll");
}

export function getGameVersion(path?: string) {
    return dn.getGameVersion(path ?? getAPIPath());
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

