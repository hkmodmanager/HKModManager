import { existsSync, readdirSync } from "fs";

export function ConvertSize(bytes: number) {
    if (!bytes) return "0 KB";
    if (bytes > 1024 * 1024 * 1024) return `${Math.round(bytes / 1024 / 1024 / 1024)} G`;
    if (bytes > 1024 * 1024) return `${Math.round(bytes / 1024 / 1024)} MB`;
    if (bytes > 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
}

export function isVaildModDir(path: string) {
    if (!existsSync(path)) return false;
    if (readdirSync(path, 'utf8').findIndex(v => v.endsWith('.dll')) == -1) return false;
    return true;
}

export function getShortName(name: string) {
    let abbr = '';
    for (const part of name.split(/(?=[A-Z])/)) {
        if (part.charAt(0).match(/([A-Z])/)) {
            abbr = abbr + part.charAt(0);
        }
    }
    return abbr;
}
