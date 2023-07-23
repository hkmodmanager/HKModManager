
import Store from 'electron-store';

export enum ModSavePathMode {
    AppDir,
    UserDir,
    Custom,
    Gamepath
}

export type SettingOptions = 'SHOW_DELETED_MODS' | 'CMODAL_REL_SCARAB' | 'SHOW_MOD_SHORT_NAME' | 
    'HIDE_MOD_ALIAS' | 'HIDE_ALERT_EXPORT_TO_SCARAB' | 'FAST_DOWNLOAD' | 'SHOW_LICENCE' | 'ACCEPT_PRE_RELEASE' 
    | 'ACCEPT_APLHA_RELEASE' | 'VERIFY_MODS_ON_AUTO' | 'CUSTOM_MODLINKS';
export type CDN = 'GITHUB_RAW' | 'JSDELIVR' | 'SCARABCN' | 'GH_PROXY';

export class HKMMSettings {
    public mirror_github: string[] = []
    public enabled_exp_mode = false;
    public gamepath: string = "";
    public modsavepath: string = "";
    public modsavepathMode: ModSavePathMode = ModSavePathMode.UserDir;
    public inStore: boolean = false;
    public language?: string = '#';
    public options: SettingOptions[] = [];
    public cdn: CDN = 'GITHUB_RAW';
    public modpackSources: string[] = [];
}


const localStorageName: string = "hkmm-settings";
export const store = new Store<HKMMSettings>();

(window as any).store = store;

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
    if(!store.store.options) {
        store.set('options', []);
    }
    if(!store.store.cdn || store.store.cdn == 'JSDELIVR') {
        store.set('cdn', 'GITHUB_RAW');
    }
    if(store.store.cdn == 'SCARABCN') {
        store.set('cdn', 'GH_PROXY');
        //store.set('options', [...store.store.options, 'USE_GH_PROXY']);
    }
    if(!store.store.mirror_github) {
        store.set('mirror_github', []);
    }
    if((store.store.mirror_github as any).items != undefined) {
        store.set('mirror_github', []);
    }
    if(store.store.mirror_github.length == 0) {
        store.set('mirror_github', ["ghproxy.net"]);
    }
    if(store.store.modpackSources == undefined) {
        store.set('modpackSources', []);
    }
})();

let optionsCache: SettingOptions[] | undefined = undefined;

export function hasOption(name: SettingOptions) {
    if(optionsCache == undefined) {
        optionsCache = store.get('options');
        setTimeout(() => optionsCache = undefined, 500);
    }
    return optionsCache.includes(name);
}
