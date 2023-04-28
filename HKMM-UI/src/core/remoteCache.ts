import * as remote from "@electron/remote";
import { dirname, join } from "path";

export const exePath = remote.app.getPath('exe');
export const appDir = dirname(exePath);
export const isPackaged = remote.app.isPackaged;
export const srcRoot = dirname(dirname(dirname(dirname(exePath))));
export const userData = remote.app.getPath('userData');
export const appVersion = remote.app.getVersion();

export const publicDir = isPackaged ? join(appDir, 'resources', 'app.asar') : join(srcRoot, 'public') ;
