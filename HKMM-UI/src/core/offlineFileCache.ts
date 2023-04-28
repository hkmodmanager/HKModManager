import { closeSync, existsSync, openSync, readFileSync, readSync, writeFileSync } from "fs";
import { join } from "path";
import { publicDir, userData } from "./remoteCache";


export class OfflineFileCache {
    public constructor(public name: string) {

    }
    public readInternal() {
        return readFileSync(join(publicDir, "offline", this.name)).subarray(8);
    }
    public getData() {
        const build = this.getDate(join(publicDir, "offline", this.name));
        const local = this.getDate(join(userData, this.name));
        
        if(!local) return this.readInternal();
        if(!build) return this.getLocalData();
        return (build < local ? this.getLocalData() : this.readInternal()) ?? this.readInternal();
    }
    public saveLocal(data: Buffer, date?: number) {
        date ??= Date.now();
        const head = Buffer.alloc(8);
        head.writeUIntBE(date, 0, 6);
        writeFileSync(join(userData, this.name), Buffer.concat([head, data]));
    }
    private getDate(p: string) {
        if (!existsSync(p)) return undefined;
        const buff = Buffer.alloc(8);
        const fd = openSync(p, "r", undefined);
        readSync(fd, buff, 0, 8, 0);
        closeSync(fd);
        const date = buff.readUIntBE(0, 6);
        return date;
    }
    public getLocalData() {
        const p = join(userData, this.name);
        if (!existsSync(p)) return undefined;
        return readFileSync(p).subarray(8);
    }
}

export const modlinksOffline: OfflineFileCache = new OfflineFileCache("modlinks.json");
export const modfilesOffline: OfflineFileCache = new OfflineFileCache("modfiles-cache.txt");

//@ts-ignore
window.offlineData = __webpack_exports__;
