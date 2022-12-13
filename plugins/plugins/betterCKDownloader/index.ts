
import { getFileSize, downloadRaw } from 'hkmm-types/renderer/utils/downloadFile'
import { ICustomDownloader, downloaders } from 'hkmm-types/renderer/mods/customDownloader'
import { IHKMMPlugin } from 'hkmm-types'
import { ModLinksManifestData } from 'hkmm-types/renderer/modlinks/modlinks'
import { TaskInfo } from 'hkmm-types/renderer/taskManager'
import { join } from 'path';

class Downloader implements ICustomDownloader {
    async use(mod: ModLinksManifestData): Promise<boolean> {
        return mod.name === 'Custom Knight' && (await getFileSize(mod.link) > 10 * 1024 * 1024);
    }
    async do(mod: ModLinksManifestData, task: TaskInfo): Promise<Buffer> {
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

export default class PluginMain implements IHKMMPlugin {
    public name = 'Better Custom Knight Downloader'
    public ck_downloader = new Downloader();
    public desc = '';
    public author = 'HKLab';
    public constructor() {

    }
    public enable(): void {
        downloaders.push(this.ck_downloader);
    }
    public disable(): void {
        
    }
}


