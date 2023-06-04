import { modlinksOffline } from "../offlineFileCache";
import { downloadText } from "../utils/downloadFile";
import { ver_lg } from "../utils/version";
import { getModDate, ModCollection, ModLinksManifestData } from "./modlinks";
import { ModLinksProvider } from "./ModLinksProvider";

export class ModLinksArchiveProvider extends ModLinksProvider {
    public hasData(): boolean {
        return this.mods !== undefined;
    }
    protected mods: ModCollection | undefined;
    private latestMod: Record<string, ModLinksManifestData> = {};

    protected async fetchData(): Promise<any> {
        if(this.mods) return;

        this.mods = JSON.parse(await downloadText("https://raw.githubusercontent.com/HKLab/modlinks-archive/master/modlinks.json", 
            undefined, undefined, false, "ModLinks", "Download"));

        const data = { ...this.mods };
        data.saveDate = Date.now();
        const d = JSON.stringify(data, undefined, 4);
        modlinksOffline.saveLocal(Buffer.from(d, 'utf8'), data.saveDate);
    }
    public getMod(name: string, version?: string | undefined): ModLinksManifestData | undefined {
        const ver = this.mods?.mods[name];
        if (!ver) return undefined;
        if (version) return ver[version];
        if (this.latestMod[name]) return this.latestMod[name];
        let latest = "0.0.0.0";
        for (const v in ver) {
            if (ver_lg(v, latest)) {
                latest = v;
            }
        }
        return this.latestMod[name] = ver[latest];
    }
    public getAllModNames(): string[] {
        if(!this.mods) return [];
        return Object.keys(this.mods.mods);
    }
    public getModAllVersions(name: string): ModLinksManifestData[] | undefined {
        const vc = this.mods?.mods[name];
        if(!vc) return undefined;
        return Object.values(vc);
    }
    
    public getLowestDependencies(mod: ModLinksManifestData) {
        let moddate = getModDate(mod.date).valueOf();
        if (moddate == 0) {
            moddate = Number.MAX_VALUE;
        }
        const dep: ModLinksManifestData[] = [];
        for (const d of mod.dependencies) {
            const dm = this.getModAllVersions(d);
            if (!dm) continue;
            let lowestDate: number = undefined as any;
            let lowestMod: ModLinksManifestData = undefined as any;
            for (const key in dm) {
                const ver = dm[key];
                const vd = getModDate(ver.date ?? '');
                const ss = moddate - vd.valueOf();
                if (!lowestDate || !lowestMod) {
                    lowestDate = ss;
                    lowestMod = ver;
                    if (ss < 0 && Math.abs(ss) < 1000 * 60 * 60) break;
                    continue;
                }
                if (ss < 0) continue;
                if (lowestDate > ss || lowestDate < 0) {
                    lowestDate = ss;
                    lowestMod = ver;
                }
            }
            dep.push(lowestMod);
        }
        return dep;
    }
}
