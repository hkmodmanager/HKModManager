import { existsSync } from 'fs';
import { remote } from 'electron'
import { parse, dirname, resolve, join } from 'path';

const exename = parse(remote.app.getPath("exe"));

let rootPath = !remote.app.isPackaged ? (
    join(dirname(dirname(dirname(exename.dir))), "libs", "electron-edge-js-master", "lib") //Debug
) : (
    join(exename.dir, "edge")
);

const nn_require = "require";
const n_require = window[nn_require];

function checkForPreCompiled() {
    if (!remote.app.isPackaged) {
        const version = `${process.versions.electron.split(".")[0]}.0.0`;
        const preCompiledPath = resolve(join(rootPath, './native/', process.platform, process.arch, version, 'edge_nativeclr'));
        console.log(preCompiledPath);
        if (existsSync(`${preCompiledPath}.node`)) {
            return preCompiledPath;
        }
        throw new Error(`The edge module has not been pre-compiled for ${process.versions.electron ? `Electron version ${process.versions.electron}` : `Node.js version ${process.versions.node}`}  ` +
            '. You must build a custom version of edge.node. Please refer to https://github.com/agracio/edge-js ' +
            'for building instructions.');

    } else {
        return join(rootPath, 'edge_nativeclr');
    }

}

var edgeNative = checkForPreCompiled();

if (process.env.EDGE_DEBUG) {
    console.log('Load edge native library from: ' + edgeNative);
}

process.env.EDGE_NATIVE = edgeNative;

const edge = n_require(edgeNative);


export function func(options) {
    if (typeof options !== 'object') {
        throw new Error('Specify the source code as string or provide an options object.');
    }

    if (!options.assemblyFile || !options.typeName || !options.methodName) {
        throw new Error('Specify the source code as string or provide an options object.');
    }

    return edge.initializeClrFunc(options);
}
