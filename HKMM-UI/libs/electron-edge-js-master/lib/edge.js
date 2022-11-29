import { existsSync } from 'fs';
import { remote } from 'electron'
import { parse, dirname, resolve, join } from 'path';
let edge;

const exename = parse(remote.app.getPath("exe"));
console.log(exename);
let rootPath = exename.name === 'electron' ? (
    join(dirname(dirname(dirname(exename.dir))), "resources", "edge") //Debug
) : (
    join(exename.dir, "resources", "res", "edge")
);

const nn_require = "require";
const n_require = window[nn_require];

function checkForPreCompiled() {
    // check if we are running in Electron or in Node.js
    if (process.versions.electron) {
        // we are running in Electron
        const version = `${process.versions.electron.split(".")[0]}.0.0`;
        const preCompiledPath = resolve(join(rootPath, './native/', process.platform, process.arch, version, 'edge_nativeclr'));
        console.log(preCompiledPath);
        if (existsSync(`${preCompiledPath}.node`)) {
            return preCompiledPath;
        }
        
    } else {
        throw new Error('electron-edge-js only supports running in Electron for running in Node.js use to edge-js module.');
    }

    throw new Error(`The edge module has not been pre-compiled for ${process.versions.electron ? `Electron version ${process.versions.electron}` : `Node.js version ${process.versions.node}` }  ` +
        '. You must build a custom version of edge.node. Please refer to https://github.com/agracio/edge-js ' +
        'for building instructions.');
}
var edgeNative = checkForPreCompiled();

if (process.env.EDGE_DEBUG) {
    console.log('Load edge native library from: ' + edgeNative);
}

process.env.EDGE_NATIVE = edgeNative;
if (process.versions['electron'] || process.versions['atom-shell'] || process.env.ELECTRON_RUN_AS_NODE) {
    edge = n_require(edgeNative);
}

export function func (options) {
    if (typeof options !== 'object') {
        throw new Error('Specify the source code as string or provide an options object.');
    }

    if (!options.assemblyFile || !options.typeName || !options.methodName) {
        throw new Error('Specify the source code as string or provide an options object.');
    }

    return edge.initializeClrFunc(options);
}
