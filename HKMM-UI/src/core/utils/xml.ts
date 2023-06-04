import { ast } from "tsxml";

export type ContainerNode = ast.ContainerNode<ast.Node>;
export type TextNode = ast.TextNode;
export type CDataNode = ast.CDataSectionNode;

export function findXmlNode<T = Node>(parent: ContainerNode, tagName: string): T | undefined {
    return (parent.childNodes.find(x => x.tagName === tagName) as (T | undefined));
}

export function getXmlNodeText(parent: ContainerNode, tagName: string): string | undefined {
    return (findXmlNode<ContainerNode>(parent, tagName)?.childNodes[0] as (TextNode | undefined))?.content;
}

export function getCDATANodeText(parent: ContainerNode, tagName: string): string | undefined {
    return (findXmlNode<ContainerNode>(parent, tagName)?.childNodes[0] as (CDataNode | undefined))?.content;
}