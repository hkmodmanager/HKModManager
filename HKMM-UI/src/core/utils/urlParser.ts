
export function mdConvertURL(text: string) {
    return text
        .replace(/(?<!\/)(BV\S+)\b/ig, ($0, $1) => `[${$1}](https://bilibili.com/video/${$1})`)
        .replace(/\b(?:https?:\/\/|www\.)\S+\b/ig, ($0) => `<${$0}>`)
        .replace(/<(?:https?:\/\/www.bilibili.com\/video\/)(\S+)(\/\?)?\S+>/ig, ($0, $1) => `[${$1}](${$0})`)
        ;
}
