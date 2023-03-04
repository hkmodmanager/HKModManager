
import { getFileSize, downloadRaw } from '@/renderer/utils/downloadFile'
import { ICustomDownloader, downloaders } from '@/renderer/mods/customDownloader'
import { IHKMMPlugin, PluginContext, } from '@/renderer/plugins'
import { ModLinksManifestData } from '@/renderer/modlinks/modlinks'
import { TaskInfo } from '@/renderer/taskManager'
import { join } from 'path';

class Downloader implements ICustomDownloader {
    async use(mod: ModLinksManifestData): Promise<boolean> {
        if(!mod.link) return false;
        return mod.name === 'Custom Knight' && (await getFileSize(mod.link) > 10 * 1024 * 1024);
    }
    async do(mod: ModLinksManifestData, task: TaskInfo): Promise<Buffer> {
        if(!mod.link) throw new Error();
        task.pushState("Use custom knight downloader");
        const url = new URL(mod.link);
        const pbase = url.pathname.substring(0, url.pathname.lastIndexOf('/'));
        try {
            //Main
            url.pathname = join(pbase, "CustomKnight.dll");
            mod.link = url.toString();
            return await downloadRaw(url.toString(), undefined, task);
        } catch (e: any) {
            task.pushState(e?.toString());
            task.pushState("Fallback, use default downloader");
            return await downloadRaw(mod.link, undefined, task);
        }
    }
}
export const pluginName = 'hklab-plugin-bckd';
export default class PluginMain implements IHKMMPlugin {
    name = pluginName;
    public displayName = 'Better Custom Knight Downloader'
    public ck_downloader = new Downloader();
    public desc = '';
    public author = 'HKLab';
    public constructor(public context: PluginContext) {

    }
    public enable(): void {
        downloaders.push(this.ck_downloader);
    }
    public disable(): void {
        const di = downloaders.indexOf(this.ck_downloader);
        if(di > 0) {
            delete downloaders[di];
        }
    }
}


