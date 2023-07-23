import { currentPlatform } from "@/core/exportGlobal";
import { ContainerNode, findXmlNode, getCDATANodeText, getXmlNodeText, TextNode } from "@/core/utils/xml";
import { ast, Parser } from "tsxml";

export class ModdingAPIData {
    public link: string = "";
    public version: number = 0;
    public lastGet: number = 0;
    public files: string[] = [];
}

export async function parseAPILink(input: string) {

    const content = input;
    const xml = await Parser.parseString(content);
    const manifest = (<ContainerNode>xml.getAst().childNodes[1]).childNodes[0] as ContainerNode;
    const result = new ModdingAPIData();
    const version = getXmlNodeText(manifest, "Version");
    if (!version) throw "Invalid ApiLinks.xml";
    result.version = Number.parseInt(version);

    const links = findXmlNode<ContainerNode>(manifest, "Links");
    if (!links) throw new Error("Invalid ApiLinks.xml");

    const link = getCDATANodeText(links, currentPlatform);
    if (!link) throw new Error("Invalid ApiLinks.xml");

    const files = findXmlNode<ContainerNode>(manifest, "Files");
    if (!files) throw new Error("Invalid ApiLinks.xml");
    for (const node of files.childNodes) {
        const text = (node as ast.ContainerNode<TextNode>).childNodes[0].content;
        result.files.push(text);
    }


    result.link = link;
    result.lastGet = new Date().valueOf();
    return result;
}
