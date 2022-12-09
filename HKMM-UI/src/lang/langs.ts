
import { remote } from 'electron';
import { readdirSync, readFileSync } from 'fs';
import { dirname, extname, join, parse } from 'path';

export const I18nLanguages: Record<string, any> = {};

export let SupportedLanguages: Record<string, string> = undefined as any;

export let AllNamedLanaguages: Record<string, string> = {};

export interface ILanguageMetadata {
    alias?: string[];
    displayName: string;
    i18nName: string;
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
        if(!md || !md.i18nName || !md.displayName) {
            console.log(`[I18n]: Invalid language file`);
            continue;
        }
        I18nLanguages[md.i18nName] = data;
        SupportedLanguages[md.i18nName.toLowerCase()] = md.i18nName;
        if(md.alias) {
            for (const a of md.alias) {
                SupportedLanguages[a.toLowerCase()] = md.i18nName;
            }
        }
        AllNamedLanaguages[md.displayName] = md.i18nName;
    }
}
