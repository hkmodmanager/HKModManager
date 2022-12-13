/// <reference types="node" />
import { ModLinksManifestData } from "../modlinks/modlinks";
import { TaskInfo } from "../taskManager";
export interface ICustomDownloader {
    use(mod: ModLinksManifestData): Promise<boolean>;
    do(mod: ModLinksManifestData, task: TaskInfo): Promise<Buffer>;
}
export declare const downloaders: ICustomDownloader[];
export declare function getDownloader(mod: ModLinksManifestData): Promise<ICustomDownloader | undefined>;
