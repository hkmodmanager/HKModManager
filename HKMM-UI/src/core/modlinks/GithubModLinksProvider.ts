import { ast, Parser } from "tsxml";
import { currentPlatform } from "../exportGlobal";
import { downloadText } from "../utils/downloadFile";
import { ContainerNode, findXmlNode, getCDATANodeText, getXmlNodeText, TextNode } from "../utils/xml";
import { ModLinksManifestData, ModTag } from "./modlinks";
import { ModLinksProvider } from "./ModLinksProvider";



export class GithubModLinksProvider extends ModLinksProvider {
    public constructor(public modlinksURL: string = "https://github.com/hk-modding/modlinks/raw/main/ModLinks.xml") {
        super();
    }

    private mods: Record<string, ModLinksManifestData> | undefined;
    
    protected async fetchData(): Promise<any> {
        const modlinks = await downloadText(this.modlinksURL, 
            undefined, undefined, false, "ModLinks", "Download");
        this.mods = await parseModLinks(modlinks);
    }
    public getMod(name: string): ModLinksManifestData | undefined {
        if(!this.mods) return undefined;
        return this.mods[name];
    }
    public getAllModNames(): string[] {
        if(!this.mods) return [];
        return Object.keys(this.mods);
    }
    public getModAllVersions(name: string): ModLinksManifestData[] | undefined {
        const mod = this.getMod(name);
        if(!mod) return undefined;
        return [mod];
    }
    public getLowestDependencies(mod: ModLinksManifestData): ModLinksManifestData[] {
        const dep: ModLinksManifestData[] = [];
        for (const d of mod.dependencies) {
            const mod = this.getMod(d);
            if(mod) {
                dep.push(mod);
            }
        }
        return dep;
    }
    public hasData(): boolean {
        return this.mods !== undefined;
    }
    
}
