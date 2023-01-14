
import { transformSync } from '@babel/core';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
//@ts-ignore
import env from '@babel/preset-env'
//@ts-ignore
import ts from '@babel/preset-typescript'
import { createHash } from 'crypto';
import { store } from './settings';
import { userData } from './remoteCache';

const exportLibs: Record<string, () => any> = {
    'vue': () => require('vue'),
    'bootstrap': () => require('bootstrap'),
    'vue-router': () => require('vue-router')
};

const internalPlugins: Record<string, any> = {
    'better-custom-knight-downloader': require('./plugins/better-custom-knight-downloader')
};

const w_any = window as any;
const orig_any = w_any.node_require ?? eval('window.require');

export const node_require = w_any.node_require = orig_any;
export const webpack_require = w_any.webpack_require = __webpack_require__;

export function node_import<T>(modulename: string, ep?: string) {
    const module = node_require(modulename);
    if(ep) {
        return module[ep] as T;
    }
    return module as T;
}

export const allPlugins: IHKMMPlugin[] = [];

export function getCompileCacheDir() {
    const result = join(userData, 'plugins-cache');
    if (!existsSync(result)) mkdirSync(result, { recursive: true });
    return result;
}

export class PluginStatus {
    enabled: boolean = true;
}

export class PluginContext {
    public constructor(public status: PluginStatus, private pluginName: string) {

    }
    public save() {
        const cstatus = store.store.pluginsStatus;
        cstatus[this.pluginName] = this.status;
        store.set('pluginsStatus', cstatus);
    }
    public setActive(a?: boolean) {
        if (this.status.enabled === a) return;
        if (a != undefined) this.status.enabled = a;
        this.save();
        console.log(`${this.status.enabled ? 'Enable' : 'Disable'} plugin: ${this.pluginName}`);
        const plugin = findPlugin(this.pluginName);
        if (!plugin) return;
        if (this.status.enabled) {
            plugin.enable();
        } else {
            plugin.disable();
        }
    }
}

export interface IHKMMPlugin {
    name: string;
    displayName: string;
    enable(): void;
    disable(): void;
    context: PluginContext;
    author: string;
}

function _require(name: string) {
    name = name.replaceAll('\\', '/')
    if (name == 'hkmm' || name == 'hkmm-types') {
        name = './src/renderer/plugins.ts'
    } else if (name.startsWith('hkmm/')) {
        const mname = name.substring(5);
        const p = './src/' + mname + ".ts";
        name = p;
    } else if (name.startsWith('hkmm-types/')) {
        const mname = name.substring(11);
        const p = './src/' + mname + ".ts";
        name = p;
    }
    console.log(name);
    try {
        return __webpack_require__(name);
    } catch (e) {
        console.log(e);
        return orig_any(name);
    }

}

export function plugin_require(name: string, dir: string) {
    if (name.startsWith('./hkmm/')) {
        name = name.substring(2);
    } else if (name.startsWith('./renderer/')) {
        name = join('hkmm/', name.substring(11));
    } else if (name.startsWith('.')) {
        name = node_require.resolve(join(dir, name));
        name = getPluginCache(name);
    } else {
        const lib = exportLibs[name.toLowerCase()];
        if (lib) {
            return lib();
        }
    }

    console.log(name);
    return _require(name);
}

w_any.require = _require;

function buildPluginCache(path: string, ocode: string | undefined, cache: string) {
    let code = transformSync(ocode ?? readFileSync(path, 'utf-8'), {
        filename: path,
        presets: [
            env,
            ts
        ]
    })?.code ?? '';
    code = code.substring(code.indexOf('\n'));
    code = `
    "use strict";
    __filename = '${path.replaceAll('\\', '\\\\')}';
    __dirname = '${dirname(path).replaceAll('\\', '\\\\')}';
    require = function(m){
        return window.plugins.plugin_require(m, __dirname);
    };\n
    ` + code;
    writeFileSync(cache, code ?? '', 'utf-8');
}

function getPluginCache(path: string) {
    const code = readFileSync(path, 'utf-8');
    const sha256 = createHash('sha256');
    sha256.update(code + '\n\n' + path, 'utf-8');
    const name = sha256.digest('hex');
    const cachePath = join(getCompileCacheDir(), name + ".js");
    if (!existsSync(cachePath)) {
        buildPluginCache(path, code, cachePath);
    }
    return cachePath;
}

export function findPlugin(name: string) {
    return allPlugins.find(x => x.name === name);
}

export function getPluginStatus(name: string) {
    let result = store.store.pluginsStatus[name];
    if (!result) {
        result = new PluginStatus();
        const status = store.store.pluginsStatus;
        status[name] = result;
        store.set('pluginsStatus', status);
    }
    return result;
}

export function loadPlugin(path: string | any) {
    let plugin: any;
    if (typeof path === 'string') {
        if (!path.startsWith('hkmm/renderer/plugins/')) path = getPluginCache(path);
        plugin = _require(path);
    } else {
        plugin = path;
    }
    const ec = plugin.default;
    const pname = plugin.pluginName;
    if (!ec || !pname) throw new Error('Invalid plugin');
    if (findPlugin(pname)) throw new Error(`Load plugin ${pname} repeatedly`);
    const status = getPluginStatus(pname);
    const context = new PluginContext(status, pname);
    const inst: IHKMMPlugin = new ec(context);
    inst.name = pname;
    inst.context = context;

    allPlugins.push(inst);

    if (status.enabled) context.setActive();
    return inst;
}

//@ts-ignore
w_any.plugins = __webpack_exports__;

(function () {
    if(!store.store.enabled_exp_mode) return;
    console.log('Experimental feature: Plugins');
    for (const key in internalPlugins) {
        loadPlugin(internalPlugins[key]);
    }
})();


