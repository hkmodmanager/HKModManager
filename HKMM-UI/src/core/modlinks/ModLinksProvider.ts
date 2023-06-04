import { ModLinksManifestData } from "./modlinks";

export abstract class ModLinksProvider {
    protected abstract fetchData(): Promise<any>;
    public abstract getMod(name: string, version?: string): ModLinksManifestData | undefined;
    public abstract getAllModNames(): string[];
    public abstract getModAllVersions(name: string): ModLinksManifestData[] | undefined;
    public abstract getLowestDependencies(mod: ModLinksManifestData): ModLinksManifestData[];
    public abstract hasData(): boolean;

    private fetchDataPromise?: Promise<any>;

    public isOffline() {
        return false;
    }
    public getOfflineUpdateDate() {
        return Date.now();
    }

    public async tryFetchData() {
        if(this.hasData()) return;
        try {
            if (this.fetchDataPromise) {
                await this.fetchDataPromise;
            }
            else {
                this.fetchDataPromise = this.fetchData();
                await this.fetchDataPromise;
            }
        } finally {
            this.fetchDataPromise = undefined;
        }
    }

    public getAllMods() {
        const result: ModLinksManifestData[] = [];
        for (const name of this.getAllModNames()) {
            const mod = this.getMod(name);
            if (mod) {
                result.push(mod);
            }
        }
        return result;
    }

    
}
