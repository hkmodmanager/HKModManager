
import process from 'process';
import { Parser, ast } from 'tsxml'
import { downloadText } from '../utils/downloadFile';

type ContainerNode = ast.ContainerNode<ast.Node>;
type TextNode = ast.TextNode;
type CDataNode = ast.CDataSectionNode;

export type ModTag = "Boss" | "Cosmetic" | "Expansion" | "Gameplay" | "Library" | "Utility";

export let currentPlatform: string = "";
const cp = process.platform;
if (cp == "win32") currentPlatform = "Windows";
else if (cp == "darwin") currentPlatform = "Mac";
else if (cp == "linux") currentPlatform = "Linux";

export class ModLinksManifestData {
    public name: string = "";
    public desc: string = "";
    public version: string = "";
    public link: string = "";
    public dependencies: string[] = [];
    public repository: string | undefined;
    public integrations: string[] = [];
    public tags: ModTag[] = [];
    public authors: string[] = [];
}

export class ModLinksData {
    public mods: ModLinksManifestData[] = [];
    public lastGet: number = 0;
    public getMod(name: string) {
        return this.mods.find(x => x.name == name);
    }
}

export class ModdingAPIData {
    public link: string = "";
    public version: number = 0;
    public lastGet: number = 0;
}

function findXmlNode<T = Node>(parent: ContainerNode, tagName: string): T | undefined {
    return (parent.childNodes.find(x => x.tagName === tagName) as (T | undefined));
}

function getXmlNodeText(parent: ContainerNode, tagName: string): string | undefined {
    return (findXmlNode<ContainerNode>(parent, tagName)?.childNodes[0] as (TextNode | undefined))?.content;
}

function getCDATANodeText(parent: ContainerNode, tagName: string): string | undefined {
    return (findXmlNode<ContainerNode>(parent, tagName)?.childNodes[0] as (CDataNode | undefined))?.content;
}

export async function parseModLinks(content: string): Promise<ModLinksData> {
    const result = new ModLinksData();
    const xml = await Parser.parseString(content);
    const root = xml.getAst().childNodes[1] as ContainerNode;
    if (!root) throw 0;
    for (let i = 0; i < root.childNodes.length; i++) {
        const node = root.childNodes[i];
        if (node instanceof ast.CommentNode) continue;
        const manifest = node as ContainerNode;
        const mod = new ModLinksManifestData();
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

        result.mods.push(mod);
    }
    result.mods.sort((a, b) => a.name.localeCompare(b.name));
    result.lastGet = new Date().valueOf();
    return result;
}

let promise_get_modlinks: Promise<ModLinksData> | undefined;
export let modlinksCache: ModLinksData | undefined;

export async function getModLinksFromRepo() {
    if (promise_get_modlinks) {
        return await promise_get_modlinks;
    }
    if (modlinksCache) {
        const ts = new Date().valueOf() - modlinksCache.lastGet;
        if (ts < 10000) {
            promise_get_modlinks = undefined;
            return modlinksCache;
        }
    }
    const url = "https://raw.githubusercontent.com/hk-modding/modlinks/main/ModLinks.xml";
    const content = await downloadText(url, undefined, undefined, false, "ModLinks", "Download");
    const p = parseModLinks(content);
    modlinksCache = await p;
    promise_get_modlinks = undefined;
    return modlinksCache;
}

export async function getModLinks() {
    const p = promise_get_modlinks ?? getModLinksFromRepo();
    promise_get_modlinks = p;
    if (!modlinksCache) return await p;
    return p;
}

let promise_get_api: Promise<ModdingAPIData> | undefined;
export let apiInfoCache: ModdingAPIData | undefined;

export async function getAPIInfoFromRepo() {
    if (promise_get_api) {
        return await promise_get_api;
    }
    if (apiInfoCache) {
        const ts = new Date().valueOf() - apiInfoCache.lastGet;
        if (ts < 10000) {
            promise_get_api = undefined;
            return apiInfoCache;
        }
    }
    const url = "https://raw.githubusercontent.com/hk-modding/modlinks/main/ApiLinks.xml";
    const content = await downloadText(url, undefined, undefined, false, "ModLinks", "Download");
    const xml = await Parser.parseString(content);
    const manifest = (<ContainerNode>xml.getAst().childNodes[1]).childNodes[0] as ContainerNode;
    const result = new ModdingAPIData();
    const version = getXmlNodeText(manifest, "Version");
    if (!version) throw "Invalid ApiLinks.xml";
    result.version = Number.parseInt(version);
    const links = findXmlNode<ContainerNode>(manifest, "Links");
    if (!links) throw "Invalid ApiLinks.xml";
    const link = getCDATANodeText(links, currentPlatform);
    if (!link) throw "Invalid ApiLinks.xml";
    result.link = link;
    result.lastGet = new Date().valueOf();
    localStorage.setItem("cache-api-info", JSON.stringify(result));
    return apiInfoCache = result;
}

export async function getAPIInfo() {
    const p = promise_get_api ?? getAPIInfoFromRepo();
    promise_get_api = p;
    if (!apiInfoCache) return await p;
    return p;
}

getAPIInfoFromRepo();
getModLinksFromRepo();

export async function getModLinkMod(name: string) {
    const modlinks = await getModLinks();
    return modlinks.getMod(name);
}

export function getModLinkModSync(name: string) {
    if(!modlinksCache) return undefined;
    return modlinksCache.getMod(name);
}

