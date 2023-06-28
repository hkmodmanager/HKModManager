//@ts-nocheck

const { join, dirname, parse } = require("path");
const { app } = require('@electron/remote');

const exename = parse(app.getPath("exe"));
const node_require = eval('window.require');

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

window.core = d;

d.registerLogHandler("Log", msg => console.log(msg));
d.registerLogHandler("Error", msg => console.error(msg));
d.registerLogHandler("Warning", msg => console.warn(msg));

