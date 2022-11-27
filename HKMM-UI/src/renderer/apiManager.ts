
import * as edge from 'electron-edge-js';
import { join } from 'path';
import { getNetUtilsPath } from './nethelper';
import { GetSettings } from './settings';

export function getAPIPath() {
    return join(GetSettings().gamepath, "hollow_knight_Data", "Managed", "Assembly-CSharp.dll");
}

const getapiver = edge.func({
    assemblyFile: getNetUtilsPath(),
    typeName: "HKMM.NetUtils",
    methodName: "GetAPIVersion"
});

export function getAPIVersion() {
    return getapiver({
        apiPath: getAPIPath()
    }, true) as number;
}

export function installedAPI() {
    return getAPIVersion() > 0;
}
