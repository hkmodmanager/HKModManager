import { remote } from "electron";
import { dirname } from "path";

export const exePath = remote.app.getPath('exe');
export const appDir = dirname(exePath);
export const isPackaged = remote.app.isPackaged;
export const srcRoot = dirname(dirname(dirname(dirname(exePath))));
export const userData = remote.app.getPath('userData');
export const appVersion = remote.app.getVersion();
