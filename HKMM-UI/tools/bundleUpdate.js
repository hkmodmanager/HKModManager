
const { zip } = require('compressing');
const { dirname, join } = require('path');
const { readdirSync, statSync, createWriteStream } = require('fs');

const buildPath = join(dirname(__dirname), 'dist_electron', 'win-unpacked');
console.log(`Build Path: ${buildPath}`);

const ignoreDirs = [
    'swiftshader', 'locales'
];

const stream = new zip.Stream();

function fdir(parent, op) {
    for (const name of readdirSync(parent, 'utf-8')) {
        const p = join(parent, name);
        const stat = statSync(p);
        if(stat.isDirectory()) {
            if(parent == buildPath) {
                if(ignoreDirs.includes(name)) continue;
            }
            fdir(p, join(op, name));
        } else if(stat.isFile()) {
            if(parent == buildPath) continue;
            stream.addEntry(p, {
                relativePath: join(op, name)
            });
        }
    }
}

fdir(buildPath, '');

const ws = createWriteStream(join(dirname(buildPath), 'update.zip'), 'binary');

stream.pipe(ws);
