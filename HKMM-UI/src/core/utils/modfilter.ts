import { LocalPackageProxy, PackageDisplay } from "core";
import { ModTag } from "../interop/parser/modlinks";
import { getModRepo, getShortName } from "./utils";

function processingModName(name: string) {
    return name.trim().toLowerCase().replaceAll(' ', '');
}

export type ModFilterInfo = [string, ((mod: PackageDisplay) => [boolean, number])][];
export type ModFilter = (parts: string[], mod: PackageDisplay) => [boolean, number];
const defaultFilters: Record<string, ModFilter> = {
    tag(fparts, mod) {
        return [mod.tags.includes(fparts[1] as ModTag), 0];
    },
    author(fparts, mod){
        const authorName = fparts[1]?.toLowerCase();
        if (!authorName) return [true, 0];
        if (mod.authors) {
            if (mod.authors.map(x => x.toLowerCase()).includes(authorName)) return [true, 0];
        }
        if (!mod.repository) return [false, 0];
        const repo = getModRepo(mod.repository);
        if (!repo) return [false, 0];
        return [repo[0]?.toLowerCase() == authorName, 0];
    },
    enabled(fparts, mod){
        const lg = LocalPackageProxy.getMod(mod.name);
        if (!lg) return [false, 0];
        return [lg.enabled, 0];
    },
    disabled(fparts, mod){
        const lg = LocalPackageProxy.getMod(mod.name);
        if (!lg) return [false, 0];
        return [!lg.enabled, 0];
    },
    installed(fparts, mod) {
        return [LocalPackageProxy.getMod(mod.name) != undefined, 0];
    },
    uninstalled(fparts, mod) {
        return [LocalPackageProxy.getMod(mod.name) == undefined, 0];
    },
    "update-in-days": (fparts, mod) => {
        const day = Number.parseInt(fparts[1]);
        if(!Number.isInteger(day)) return [false, 0];
        const date = mod.date;
        const span = (Date.now() - date.valueOf()) / 1000 / 60 / 60 / 24;
        return [span <= day, 0];
    }
};

export function prepareFilter(input?: string,
    customFilter?: Record<string, ModFilter>,
    aliasGetter?: (mod: PackageDisplay) => string) {
    if (!input) return [];
    const filters: ModFilterInfo = [];
    const mix = {...defaultFilters, ...customFilter};
    for (const part of input.split(/(?=[:])/)) {
        const p = part.trim();
        if (p == '') continue;
        const fparts = p.split('=');
        const filterName = fparts[0].toLowerCase().substring(1);
        if (mix) {
            const filter = mix[filterName];
            if (filter) {
                filters.push([filterName, (mod) => filter(fparts, mod)]);
                continue;
            }
        }
        if (p[0] != ':' || filterName == 'name') {
            //Parts of name
            const matchname = p[0] == ':' ? fparts[1] : p;
            filters.push(['name', (mod) => {
                let modname = processingModName(mod.name);
                if (aliasGetter) {
                    modname += aliasGetter(mod);
                }
                const index = modname.indexOf(matchname.toLowerCase());
                let pass = index != -1;
                let order = index == -1 ? 0 : index;
                if (getShortName(mod.name).startsWith(matchname)) {
                    pass = true;
                    order += 100;
                }
                return [pass, order]
            }]);
        } else if (filterName == 'sort') {
            const sortMode = fparts[1]?.toLowerCase();
            if (sortMode) {
                if (sortMode == 'lastupdate') {
                    filters.push(['sort-lastUpdate', (mod) => {
                        return [true, mod.date ? (mod.date) : 0];
                    }]);
                } else if (sortMode == 'lastupdate-reverse') {
                    filters.push(['sort-lastUpdate', (mod) => {
                        return [true, mod.date ? (-mod.date) : 0];
                    }]);
                }
            }
        } else {
            console.log(`[ModFilter]Unknown filter: ${filterName}`);
        }

    }
    console.log(`[MF]Filters: ` + filters.map(x => x[0]).join(','));
    return filters;
}

export function filterMods<T = PackageDisplay>(inmods: (T | undefined)[],
    filters: ModFilterInfo,
    convert: ((mod: T) => PackageDisplay | undefined) = (mod: T) => (mod as any as PackageDisplay)) {
    const result: [T, PackageDisplay, number][] = [];
    for (const mod of inmods) {
        if (!mod) continue;
        const modinfo = convert(mod);
        if (!modinfo) continue;
        let order = 0;
        let pass = true;
        for (const filter of filters) {
            const r = filter[1](modinfo);
            if (!r[0]) {
                pass = false;
                break;
            }
            order += r[1];
        }
        if (!pass) continue;
        result.push([mod, modinfo, order]);
    }
    return result.sort((a, b) => {
        const am = a[1];
        const bm = b[1];
        return (
            am.name.localeCompare(bm.name) +
            b[2] - a[2]
        );
    }).map(x => x[0]);
}

