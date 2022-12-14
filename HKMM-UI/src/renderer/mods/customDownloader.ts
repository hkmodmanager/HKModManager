import { ModLinksManifestData } from "../modlinks/modlinks";
import { TaskInfo } from "../taskManager";

export interface ICustomDownloader {
    use(mod: ModLinksManifestData): Promise<boolean>;
    do(mod: ModLinksManifestData, task: TaskInfo): Promise<Buffer>;
}

export const downloaders: ICustomDownloader[] = [
    
];

export async function getDownloader(mod: ModLinksManifestData) {
    for (const v of downloaders) {
        if(await v?.use(mod)) {
            return v;
        }
    }
}
