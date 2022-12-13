export interface ReleaseInfo {
    name: string;
    assets: {
        name: string;
        browser_download_url: string;
    }[];
}
export declare function getUpdatePath(): string;
export declare function getUpdateSetup(): string;
export declare function checkUpdate(): Promise<string[] | undefined>;
export declare function installUpdate(): Promise<void>;
