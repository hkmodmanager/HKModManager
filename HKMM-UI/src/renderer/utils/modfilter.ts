import { getModDate, getModRepo, ModLinksManifestData, ModTag } from "../modlinks/modlinks";
import { getShortName } from "./utils";

function processingModName(name: string) {
    return name.trim().toLowerCase().replaceAll(' ', '');
}

export type ModFilterInfo = [string, ((mod: ModLinksManifestData) => [boolean, number])][];

export function prepareFilter(input?: string,
    customFilter?: Record<string, (parts: string[], mod: ModLinksManifestData) => [boolean, number]>,
    aliasGetter?: (mod: ModLinksManifestData) => string) {
    if (!input) return [];
    const filters: ModFilterInfo = [];
    for (const part of input.split(/(?=[:])/)) {
        const p = part.trim();
        if (p == '') continue;
        const fparts = p.split('=');
        const filterName = fparts[0].toLowerCase().substring(1);
        if (customFilter) {
            const filter = customFilter[filterName];
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
        } else if (filterName == 'tag') {
            //Tag
            filters.push(['tag', (mod) => {
                return [mod.tags.includes(fparts[1] as ModTag), 0];
            }]);
        } else if (filterName == 'author') {
            //Author
            const authorName = fparts[1]?.toLowerCase();
            filters.push(['author', (mod) => {
                if (!authorName) return [true, 0];
                if (mod.authors) {
                    if (mod.authors.map(x => x.toLowerCase()).includes(authorName)) return [true, 0];
                }
                if (!mod.repository) return [false, 0];
                const repo = getModRepo(mod.repository);
                if (!repo) return [false, 0];
                return [repo[0]?.toLowerCase() == authorName, 0];
            }]);
        } else if(filterName == 'sort') {
            const sortMode = fparts[1]?.toLowerCase();
            if(sortMode) {
                if(sortMode == 'lastupdate') {
                    filters.push(['sort-lastUpdate', (mod) => {
                        return [true, mod.date ? (getModDate(mod.date).valueOf()) : 0];
                    }]);
                } else if(sortMode == 'lastupdate-reverse') {
                    filters.push(['sort-lastUpdate', (mod) => {
                        return [true, mod.date ? (-getModDate(mod.date).valueOf()) : 0];
                    }]);
                } else if(sortMode == 'size') {
                    filters.push(['sort-size', (mod) => {
                        return [true, mod.ei_files?.size ?? 0];
                    }]);
                } else if(sortMode == 'size-reverse') {
                    filters.push(['sort-size', (mod) => {
                        return [true, -(mod.ei_files?.size ?? 0)];
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

export function filterMods<T = ModLinksManifestData>(inmods: (T | undefined)[],
    filters: ModFilterInfo,
    convert: ((mod: T) => ModLinksManifestData | undefined) = (mod: T) => (mod as any as ModLinksManifestData)) {
    const result: [T, ModLinksManifestData, number][] = [];
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
            (am.isDeleted ? 1000 : 0) +
            (bm.isDeleted ? -1000 : 0) +
            b[2] - a[2]
        );
    }).map(x => x[0]);
}

