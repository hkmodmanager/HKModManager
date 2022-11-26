
export enum ModSavePathMode {
    AppDir,
    UserDir,
    Custom
}

export class MirrorItem {
    public target: string = "";
}

export class MirrorGroup {
    public items: MirrorItem[] = []
}

export class HKMMSettings {
    public mirror_github = new MirrorGroup();
    public mirror_githubapi = new MirrorGroup();
    public enabled_exp_mode = false;
    public gamepath: string = "";
    public modsavepath: string = "";
    public modsavepathMode: ModSavePathMode = ModSavePathMode.AppDir;
}


const localStorageName: string = "hkmm-settings";

let settingsCache: HKMMSettings | null;

export function GetSettings(): HKMMSettings {
    if (settingsCache) return settingsCache;
    const s = localStorage.getItem(localStorageName);
    if (!s) {
        SaveSettings();
    } else {
        settingsCache = JSON.parse(s) as HKMMSettings;
    }
    settingsCache = settingsCache as HKMMSettings;
    if (typeof settingsCache.enabled_exp_mode !== "boolean") settingsCache.enabled_exp_mode = false;
    return settingsCache as HKMMSettings;
}

export function SaveSettings(settings?: HKMMSettings) {
    if (settings) settingsCache = settings;
    if (!settingsCache) settingsCache = new HKMMSettings();
    const s = JSON.stringify(settingsCache);
    localStorage.setItem(localStorageName, s);
}
