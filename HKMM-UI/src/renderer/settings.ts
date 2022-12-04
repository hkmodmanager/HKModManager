
import { HKMMSettings } from '@/common/SettingsStruct';
import Store from 'electron-store';



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
    const old = GetSettingsLocal();
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
})();
