
import * as asar from '@electron/asar';
import { zip as z } from 'compressing';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';

const zip = Buffer.from(await (await fetch("https://github.com/hkmodmanager/hkmodmanager.github.io/archive/refs/heads/gh-pages.zip"))
    .arrayBuffer());

//
const output = join('temp', 'website');
if(existsSync(output)) {
    rmSync(output, {
        recursive: true
    });
}
mkdirSync(output);
await z.uncompress(zip, output);

const root = join(output, readdirSync(output, 'utf-8')[0]) + '/';
asar.createPackage(root, join('temp', 'app.ext.asar'));
