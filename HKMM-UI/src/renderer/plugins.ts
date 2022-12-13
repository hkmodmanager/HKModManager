
import { transformSync } from '@babel/core';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';
//@ts-ignore
import env from '@babel/preset-env'
//@ts-ignore
import ts from '@babel/preset-typescript'
import { remote } from 'electron';
import { createHash } from 'crypto';

const w_any = window as any;
const orig_any = w_any.node_require ?? eval('window.require');

export const node_require = w_any.node_require = orig_any;
export const webpack_require = w_any.webpack_require = __webpack_require__;

export const allPlugins: IHKMMPlugin[] = [];

export function getCompileCacheDir() {
    const result = join(remote.app.getPath('userData'), 'plugins-cache');
    if (!existsSync(result)) mkdirSync(result);
    return result;
}

export interface IHKMMPlugin {
    name: string;
    enable(): void;
    disable(): void;
    desc: string;
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

    try {
        return __webpack_require__(name);
    } catch (e) {
        return orig_any(name);
    }

}

export function plugin_require(name: string, dir: string) {
    if (name.startsWith('./hkmm/')) {
        name = name.substring(2);
    } else if (name.startsWith('./renderer/')) {
        name = join('hkmm/', name.substring(11));
    }
    if (name.startsWith('.')) {
        name = node_require.resolve(join(dir, name));
        name = getPluginCache(name);
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
    console.log(code);
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

export function loadPlugin(path: string) {
    if (!path.startsWith('hkmm/plugins/')) path = getPluginCache(path);
    const plugin = _require(path);
    const ec = plugin.default;
    if(!ec) throw new Error('Invalid plugin');
    const inst: IHKMMPlugin = new ec();
    if(findPlugin(inst.name)) throw new Error(`Load plugin ${inst.name} repeatedly`);
    allPlugins.push(inst);
    inst.enable();
    return inst;
}

//@ts-ignore
w_any.plugins = __webpack_exports__;
