//@ts-nocheck

const { join, dirname, parse } = require("path");
const { app } = process.type == 'browser' ? require('electron') : require('@electron/remote');

const exename = parse(app.getPath("exe"));
const node_require = process.type == 'browser' ? eval('require') : eval('window.require');

function node_import(modulename) {
    return node_require(modulename);
}

const rootPath = !app.isPackaged ? (
    join(dirname(dirname(dirname(exename.dir))), "libs", "core", "native") //Debug
) : (
    join(exename.dir, "native")
);


const d = node_import(join(rootPath, "core.node"));

module.exports = d;
module.exports.default = d;

if (process.type == 'renderer') {

    window.core = d;
    window.nothrow = function (fb) {
        try {
            fb();
        } catch (e) {
            console.error(e);
        }
    };
    d.registerLogHandler("Log", msg => console.log(msg));
    d.registerLogHandler("Error", msg => console.error(msg));
    d.registerLogHandler("Warning", msg => console.warn(msg));
}



