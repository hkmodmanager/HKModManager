
import * as edge from 'electron-edge-js';
import { join } from 'path';
import { getNetUtilsPath, netfunc } from './nethelper';
import { GetSettings } from './settings';

export function getAPIPath() {
    return join(GetSettings().gamepath, "hollow_knight_Data", "Managed", "Assembly-CSharp.dll");
}

const getapiver = netfunc("GetAPIVersion");
const getgamever = netfunc("GetGameVersion");

export function getAPIVersion(path?: string) {
    return getapiver({
        apiPath: path ?? getAPIPath()
    }, true) as number;
}

export function installedAPI() {
    return getAPIVersion() > 0;
}

export function getGameVersion(path?: string) {
    return getgamever({
        apiPath: path ?? getAPIPath()
    }, true) as string;
}
