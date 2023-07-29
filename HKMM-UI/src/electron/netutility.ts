
import { NetUtility } from 'core';
import { dialog } from 'electron';
import { exit } from 'process';

export function checkNetUtility() {
    const id = process.argv.indexOf('--netutility');
    if (id == -1) return;
    try {
        const name = process.argv[id + 1];
        let args = process.argv[id + 2];
        const method = NetUtility[name] as Function;
        if (args) {
            args = args.replace(/'/g, '"');
            method(...JSON.parse(args));
        } else {
            method();
        }
    } catch (e) {
        dialog.showErrorBox("NetUtility Error!", e?.stack ?? e?.toString());
    }
    exit(0);
}
