import { modlinksOffline } from "../offlineFileCache";
import { fixModLinks, ModCollection } from "./modlinks";
import { ModLinksArchiveProvider } from "./ModLinksArchiveProvider";

export class OfflineModLinksArchiveProvider extends ModLinksArchiveProvider {
    protected async fetchData(): Promise<any> {
        const offline = modlinksOffline.getData();
        if (!offline) throw new Error("loadLocalModLinks[0]");
        const result = JSON.parse(offline.toString('utf-8')) as ModCollection;
        fixModLinks(result);

        this.mods = result;
    }

    public isOffline(): boolean {
        return true;
    }
    public getOfflineUpdateDate(): number {
        return this.mods?.lastUpdate ?? this.mods?.saveDate ?? 0;
    }
}
