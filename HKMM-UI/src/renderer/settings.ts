
import Store from 'electron-store';
import { PluginStatus } from './plugins';

export enum ModSavePathMode {
    AppDir,
    UserDir,
    Custom,
    Gamepath
}

export class MirrorItem {
    public target: string = "";
}

export class MirrorGroup {
    public items: MirrorItem[] = []
}

export type SettingOptions = 'SHOW_DELETED_MODS' | 'CMODAL_REL_SCARAB' | 'SHOW_MOD_SHORT_NAME' | 'HIDE_MOD_ALIAS' | 'HIDE_ALERT_EXPORT_TO_SCARAB';
export type CDN = 'GITHUB_RAW' | 'JSDELIVR' | 'SCARABCN';

export class HKMMSettings {
    public mirror_github = new MirrorGroup();
    public mirror_githubapi = new MirrorGroup();
    public enabled_exp_mode = false;
    public gamepath: string = "";
    public modsavepath: string = "";
    public modsavepathMode: ModSavePathMode = ModSavePathMode.UserDir;
    public inStore: boolean = false;
    public modgroups: string[] = [];
    public current_modgroup: string = 'default';
    public language?: string = '#';
    public options: SettingOptions[] = [];
    public plugins: string[] = [];
    public pluginsStatus: Record<string, PluginStatus> = {};
    public cdn: CDN = 'JSDELIVR';
}


const localStorageName: string = "hkmm-settings";
export const store = new Store<HKMMSettings>();




function GetSettingsLocal() {
    const s = localStorage.getItem(localStorageName);
    if (!s) {
        return undefined;
    }
    const settingsCache = JSON.parse(s) as HKMMSettings;
    if (typeof settingsCache.enabled_exp_mode !== "boolean") settingsCache.enabled_exp_mode = false;
    return settingsCache as HKMMSettings;
}


(function() {
    if(store.get("inStore", false)) return;
    const old = GetSettingsLocal() ?? new HKMMSettings();
    store.set("inStore", true);
    if(!old) return;
    old.inStore = true;
    store.set(old);
    localStorage.removeItem(localStorageName);
    console.log(`Relocate Settings: ${store.path}`);
})();

(function(){
    if(!store.store.modgroups) {
        store.set('modgroups', []);
    }
    if(!store.store.current_modgroup) {
        store.set('current_modgroup', 'default');
    }
    if(!store.store.options) {
        store.set('options', []);
    }
    if(!store.store.plugins) {
        store.set('plugins', []);
    }
    if(!store.store.pluginsStatus) {
        store.set('pluginsStatus', {});
    }
    if(!store.store.cdn) {
        store.set('cdn', 'JSDELIVR');
    }
})();

export function hasOption(name: SettingOptions) {
    const options = store.get('options');
    return options.includes(name);
}
