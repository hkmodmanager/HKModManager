import { URL } from "url";
import { ModLinksManifestData } from "../modlinks/modlinks";
import { TaskInfo } from "../taskManager";
import { downloadRaw, getFileSize } from "../utils/downloadFile";
import { ICustomDownloader } from "./customDownloader";
import streams from "memory-streams"
import { join } from "path";
import { zip } from "compressing";


export class CKDownloader implements ICustomDownloader {
    async use(mod: ModLinksManifestData): Promise<boolean> {
        return mod.name === 'Custom Knight' && (await getFileSize(mod.link) > 10 * 1024 * 1024);
    }
    async do(mod: ModLinksManifestData, task: TaskInfo): Promise<Buffer> {
        task.pushState("Use custom knight downloader");
        const url = new URL(mod.link);
        const pbase = url.pathname.substring(0, url.pathname.lastIndexOf('/'));
        try {
            const zs = new zip.Stream();
            //Main
            url.pathname = join(pbase, "CustomKnight.dll");
            mod.link = url.toString();

            console.log(zs);
            return await downloadRaw(url.toString(), undefined, task);
        } catch (e: any) {
            task.pushState(e?.toString());
            task.pushState("Fallback, use default downloader");
            return await downloadRaw(mod.link, undefined, task);
        }
    }

}
