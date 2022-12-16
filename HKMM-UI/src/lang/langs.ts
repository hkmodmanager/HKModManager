
import { remote } from 'electron';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, extname, join, parse } from 'path';

export const I18nLanguages: Record<string, any> = {};

export let SupportedLanguages: Record<string, string> = undefined as any;

export let AllNamedLanaguages: Record<string, string> = {};

export interface ILanguageMetadata {
    alias?: string[];
    displayName: string;
    i18nName: string;
    mixer: Record<string, string>;
}

export function getLanguagesDir() {
    const exename = parse(remote.app.getPath("exe"));

    return !remote.app.isPackaged ? (
        join(dirname(dirname(dirname(exename.dir))), "langs") //Debug
    ) : (
        join(exename.dir, "langs")
    );
}

export function searchLanguages() {
    SupportedLanguages = {};
    AllNamedLanaguages = {};
    const root = getLanguagesDir();
    for (const file of readdirSync(root)) {
        if (parse(file).ext !== '.json') continue;
        const p = join(root, file);
        console.log(`[I18n]: ${p}`);

        const data = JSON.parse(readFileSync(p, 'utf8'));
        const md = data['$'] as ILanguageMetadata;
        if (!md || !md.i18nName || !md.displayName) {
            console.log(`[I18n]: Invalid language file`);
            continue;
        }
        if (md.mixer) {
            for (const key in md.mixer) {
                const fp = join(root, md.mixer[key]);
                console.log(`[I18n] Mixer: ${key} -> ${fp}`);
                if(!existsSync(fp)) continue;
                const fd = JSON.parse(readFileSync(fp, 'utf-8'));
                const keyp = key.split('.');
                
                let obj = data;
                for (let i = 0; i < keyp.length; i++) {
                    const element = keyp[i];
                    if(i == keyp.length - 1) {
                        obj[element] = fd;
                    } else {
                        obj = obj[element];
                    }
                }
                console.dir(obj);
            }
        }
        I18nLanguages[md.i18nName] = data;
        SupportedLanguages[md.i18nName.toLowerCase()] = md.i18nName;
        if (md.alias) {
            for (const a of md.alias) {
                SupportedLanguages[a.toLowerCase()] = md.i18nName;
            }
        }
        AllNamedLanaguages[md.displayName] = md.i18nName;
    }
}
