/// <reference types="node" />
import { ICustomDownloader } from '@/renderer/mods/customDownloader';
import { IHKMMPlugin, PluginContext } from '@/renderer/plugins';
import { ModLinksManifestData } from '@/renderer/modlinks/modlinks';
import { TaskInfo } from '@/renderer/taskManager';
declare class Downloader implements ICustomDownloader {
    use(mod: ModLinksManifestData): Promise<boolean>;
    do(mod: ModLinksManifestData, task: TaskInfo): Promise<Buffer>;
}
export declare const pluginName = "hklab-plugin-bckd";
export default class PluginMain implements IHKMMPlugin {
    context: PluginContext;
    name: string;
    displayName: string;
    ck_downloader: Downloader;
    desc: string;
    author: string;
    constructor(context: PluginContext);
    enable(): void;
    disable(): void;
}
export {};
