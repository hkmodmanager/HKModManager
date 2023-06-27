
import { default as axios, AxiosRequestConfig, AxiosResponse, AxiosHeaders } from 'axios'
import { startTask, TaskInfo, TaskCategory } from '../taskManager';
import { store } from '../settings';
import { ConvertSize } from './utils';
export async function downloadFile<T = any>(url: string
    , config?: AxiosRequestConfig<any>,
    canUseFast?: Boolean,
    taskinfo?: TaskInfo,
    allowChangeProgress: boolean = (taskinfo == undefined),
    taskName?: string,
    taskCategory?: TaskCategory, fallback?: string,
    useGhProxy = store.store.cdn == 'GH_PROXY', mirrors: string[] = store.store.mirror_github): Promise<AxiosResponse<T, any> | Buffer> {
    if (taskName) {
        return await startTask(taskName, undefined, async (info): Promise<AxiosResponse<T, any> | Buffer> => {
            info.category = taskCategory;
            return await downloadFile<T>(url, config, canUseFast, info, true);
        }).task as AxiosResponse<T, any>;
    }
    if (config) config = { ...config };
    else config = {}; 
    config.headers = new AxiosHeaders();
    //config.httpAgent = config.httpsAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) hkmm/2.2.0 Chrome/108.0.5359.179 Electron/22.0.2 Safari/537.36 HKMM/fetch-pass";
    const origURL = url;


    try {
        if (useGhProxy && mirrors.length > 0) {
            const ur = new URL(url);
            if (ur.hostname == 'github.com' || ur.hostname == 'raw.githubusercontent.com') {
                ur.pathname = '/' + ur.hostname + ur.pathname;
                ur.hostname = mirrors[0];
                url = ur.toString();
            } else {
                useGhProxy = false;
            }
        } else {
            useGhProxy = false;
        }
        if (taskinfo) {
            config.onDownloadProgress = ev => {
                if (!ev.total || !ev.progress) return;
                const progress = ev.progress * 100;
                taskinfo.setState(`Progress (${ConvertSize(ev.total * ev.progress)}/${ConvertSize(ev.total)}): ${progress}%`);
                if (allowChangeProgress) {
                    taskinfo.reportProgress(progress);
                }
            };
        }

        const promise = axios.get<T>(url, config);
        taskinfo?.pushState(`Downloading '${url}'`);
        taskinfo?.exitState();
        taskinfo?.setState(`Progress (0/0): 0%`);
        const r = await promise;
        taskinfo?.pushState(`Result status code: ${r.status}`);
        taskinfo?.reportProgress(100);
        return r;
    } catch (e) {
        if (useGhProxy) {
            console.log(`Fallback to next github mirror`);
            return await downloadFile<T>(origURL, config, canUseFast, taskinfo, allowChangeProgress,
                taskName, taskCategory, fallback, true, mirrors.slice(1));
        }
        if (!fallback) throw e;
        return await downloadFile<T>(fallback, config, canUseFast, taskinfo, allowChangeProgress, taskName, taskCategory);
    }
}

export async function getFileSize(url: string) {
    const r = ((await axios.head(url)).headers as AxiosHeaders).getContentLength() as string;
    return Number.parseInt(r);
}

export async function downloadText(url: string, config?: AxiosRequestConfig<any>, taskinfo?: TaskInfo,
    allowChangeProgress: boolean = (taskinfo == undefined), taskName?: string, taskCategory?: TaskCategory, fallback?: string) {
    config ??= {};
    config.responseType = 'text';
    const r = await downloadFile<string>(url, config, false, taskinfo, allowChangeProgress, taskName, taskCategory, fallback) as AxiosResponse<string>;
    return r.data;
}

export async function downloadRaw(url: string, config?: AxiosRequestConfig<any>, taskinfo?: TaskInfo, allowChangeProgress: boolean = (taskinfo == undefined),
    taskName?: string, taskCategory?: TaskCategory, fallback?: string) {
    if (config) config = { ...config };
    else config = {};
    config.responseType = "arraybuffer";
    const r = await downloadFile<ArrayBuffer>(url, config, true, taskinfo, allowChangeProgress, taskName, taskCategory, fallback);
    return r instanceof Buffer ? r : Buffer.from(r.data);
}

const w = window as any;
w.gfs = getFileSize;
w.downloadText = downloadText;
w.downloadFile = downloadFile;
