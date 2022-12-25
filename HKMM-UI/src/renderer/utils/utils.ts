import { existsSync, readdirSync } from "fs";

export function ConvertSize(bytes: number) {
    if (!bytes) return "0 KB";
    if (bytes > 1024 * 1024 * 1024) return `${Math.round(bytes / 1024 / 1024 / 1024)} G`;
    if (bytes > 1024 * 1024) return `${Math.round(bytes / 1024 / 1024)} MB`;
    if (bytes > 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
}

export function isVaildModDir(path: string) {
    if(!existsSync(path)) return false;
    if(readdirSync(path, 'utf8').findIndex(v => v.endsWith('.dll')) == -1) return false;
    return true;
}
