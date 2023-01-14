
import { transports } from 'electron-log'
import { appDir, appVersion } from './remoteCache';
import { gl } from './exportGlobal'
import { LocalModInfo, refreshLocalMods } from './modManager';
import { dirname, extname, join } from 'path';
import * as remote from "@electron/remote";
import { tmpdir } from 'os';
import { Guid } from 'guid-typescript';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { copySync, readJSONSync, writeJSONSync } from 'fs-extra';
import { store } from './settings';
import { zip } from 'compressing';
import { Clipboard_PutFile } from './nethelper';
import { loadConfig, config } from './gameinject';
import { getScarabModConfig } from './relocation/Scarab/RScarab';
import { getAPIVersion, getGameVersion } from './apiManager';

export function br_loadLogs() {
    const logContent = transports.file.readAllLogs();
    const sessions: Record<string, string[]> = {};
    for (const log of logContent) {
        let lines = [...log.lines];
        const sessionsPos: [number, number][] = [];
        for (; ;) {
            let sessionId: number | undefined = undefined;
            let i = 0;
            let firstLine: string | undefined = undefined;
            for (const line of lines) {
                i++;
                const match = line.match(/Hollow Knight Mod Manager App stared\(v([0-9.]+)\) = ([0-9]+)/);
                if (!match) continue;
                if (match[1] != appVersion) continue;
                sessionId = Number.parseInt(match[2]);
                lines = lines.slice(i);
                firstLine = line;
                break;
            }
            if (!sessionId) break;
            sessionsPos.push([sessionId, i]);
        }
        lines = log.lines;
        for (let index = 0; index < sessionsPos.length; index++) {
            const element = sessionsPos[index];
            lines = lines.slice(element[1] - (index == 0 ? 1 : 0));
            const next = sessionsPos[index + 1];
            const text = next ? lines.slice(0, next[1] - 1) : lines;
            if (sessions[element[0]]) continue;
            sessions[element[0]] = [...text];
        }
    }
    return sessions;
}

export function br_loadlocalmods() {
    const mods = refreshLocalMods(true);
    const result: Record<string, LocalModInfo[]> = {};
    for (const key in mods) {
        const mod = mods[key];
        result[key] ??= [];
        for (const ver of mod.versionsArray) {
            result[key].push(ver.info);
        }
    }
    return result;
}

export function br_get_savepath() {
    return join(dirname(remote.app.getPath('appData')), 'LocalLow', 'Team Cherry', 'Hollow Knight');
}

export async function br_build_zip() {
    console.log("Begin create debug package");
    console.log(`Game Version: ${getGameVersion()}`);
    console.log(`Modding API Version: ${getAPIVersion()}`);
    const tmp = join(tmpdir(), Guid.create().toString());
    mkdirSync(tmp, { recursive: true });
    writeJSONSync(join(tmp, "hkmm-renderer-log.json"), br_loadLogs(), {
        spaces: 4
    });
    writeJSONSync(join(tmp, "hkmm-localmods.json"), br_loadlocalmods(), {
        spaces: 4
    });
    writeJSONSync(join(tmp, "hkmm-config.json"), store.store, {
        spaces: 4
    });
    loadConfig();
    writeJSONSync(join(tmp, "hkmm-gameinject-config.json"), config, {
        spaces: 4
    });
    if(existsSync(getScarabModConfig())) {
        writeJSONSync(join(tmp, "scarab-mods.json"), readJSONSync(getScarabModConfig()), {
            spaces: 4
        });
    }
    const sp = br_get_savepath();
    const modlogP = join(sp, "modlog.txt");
    if(existsSync(modlogP)) copySync(modlogP, join(tmp, "modlog.txt"));
    const playerP = join(sp, "player.log");
    if(existsSync(playerP)) copySync(playerP, join(tmp, "player.log"));

    for (const json of readdirSync(sp)) {
        if(extname(json) == '.json') {
            copySync(join(sp, json), join(tmp, json));
        }
    }

    console.log(`Build Bug Report Zip: ${tmp}`);
    const zipP = join(appDir, "bugreport.zip");
    await zip.compressDir(tmp, zipP);
    rmSync(tmp, {
        recursive: true
    });
    console.log(zipP);
    Clipboard_PutFile(zipP);
}

gl.loadLogs = br_loadLogs;
gl.loadLocalMods = br_loadlocalmods;
gl.buildRDZip = br_build_zip;

