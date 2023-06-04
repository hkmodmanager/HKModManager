import { ast, Parser } from "tsxml";
import { currentPlatform } from "../exportGlobal";
import { downloadText } from "../utils/downloadFile";
import { ContainerNode, findXmlNode, getCDATANodeText, getXmlNodeText, TextNode } from "../utils/xml";
import { ModLinksManifestData, ModTag } from "./modlinks";
import { ModLinksProvider } from "./ModLinksProvider";

async function parseModLinks(content: string): Promise<Record<string, ModLinksManifestData>> {
    const result: Record<string, ModLinksManifestData> = {};
    const xml = await Parser.parseString(content);
    const root = xml.getAst().childNodes[1] as ContainerNode;
    if (!root) throw 0;
    for (let i = 0; i < root.childNodes.length; i++) {
        const node = root.childNodes[i];
        if (node instanceof ast.CommentNode) continue;
        const manifest = node as ContainerNode;
        const mod: ModLinksManifestData = {
            name: "",
            desc: "",
            version: "",
            dependencies: [],
            repository: "",
            integrations: [],
            tags: [],
            authors: [],
            date: "1970-12-22T04:50:23Z"
        };

        mod.name = getXmlNodeText(manifest, "Name") ?? "";
        mod.desc = getXmlNodeText(manifest, "Description") ?? "";
        mod.version = getXmlNodeText(manifest, "Version") ?? "";
        let tlink = getCDATANodeText(manifest, "Link");
        if (!tlink) {
            const nlinks = findXmlNode<ContainerNode>(manifest, "Links");
            tlink = nlinks ? getCDATANodeText(nlinks, currentPlatform) : undefined;
            if (!tlink) continue;
        }
        mod.link = tlink;

        const depNode = findXmlNode<ContainerNode>(manifest, "Dependencies");
        if (depNode && !(depNode instanceof ast.SelfClosingNode)) {
            for (let i2 = 0; i2 < depNode.childNodes.length; i2++) {
                const dep = (depNode.childNodes[i2] as ContainerNode).childNodes[0] as TextNode;
                mod.dependencies.push(dep.content);
            }
        }

        mod.repository = getCDATANodeText(manifest, "Repository");
        if (!mod.repository) {
            const url = new URL(tlink);
            if (url.hostname == 'github.com') {
                url.pathname = url.pathname.substring(0, url.pathname.indexOf('/releases/download/'));
                mod.repository = url.toString();
            }

        }

        const integrationsNode = findXmlNode<ContainerNode>(manifest, "Integrations");
        if (integrationsNode) {
            for (let i2 = 0; i2 < integrationsNode.childNodes.length; i2++) {
                const integration = (integrationsNode.childNodes[i2] as ContainerNode).childNodes[0] as TextNode;
                mod.integrations.push(integration.content);
            }
        }

        const tagsNode = findXmlNode<ContainerNode>(manifest, "Tags");
        if (tagsNode) {
            for (let i2 = 0; i2 < tagsNode.childNodes.length; i2++) {
                const tag = (tagsNode.childNodes[i2] as ContainerNode).childNodes[0] as TextNode;
                mod.tags.push(tag.content as ModTag);
            }
        }

        const authorsNode = findXmlNode<ContainerNode>(manifest, "Authors");
        if (authorsNode) {
            for (let i2 = 0; i2 < authorsNode.childNodes.length; i2++) {
                const author = (authorsNode.childNodes[i2] as ContainerNode).childNodes[0] as TextNode;
                mod.authors.push(author.content as ModTag);
            }
        }

        result[mod.name] = mod;
    }
    return result;
}

export class GithubModLinksProvider extends ModLinksProvider {
    private mods: Record<string, ModLinksManifestData> | undefined;
    
    protected async fetchData(): Promise<any> {
        const modlinks = await downloadText("https://github.com/hk-modding/modlinks/raw/main/ModLinks.xml", 
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
