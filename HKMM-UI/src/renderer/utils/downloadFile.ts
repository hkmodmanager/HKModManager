
import { default as axios, AxiosRequestConfig, AxiosResponse, AxiosHeaders } from 'axios'
import { startTask, TaskInfo, TaskCategory } from '@/renderer/taskManager';

export async function downloadFile<T = any>(url: string
    , config?: AxiosRequestConfig<any>, taskinfo?: TaskInfo, allowChangeProgress: boolean = false,
    taskName?: string,
    taskCategory?: TaskCategory, fallback?: string) : Promise<AxiosResponse<T, any>> {
    if (taskName) {
        return await startTask(taskName, undefined, async (info): Promise<AxiosResponse<T, any>> => {
            info.category = taskCategory;
            return await downloadFile<T>(url, config, info, true);
        }).task as AxiosResponse<T, any>;
    }
    if (config) config = { ...config };
    else config = {};


    if (taskinfo) {
        config.onDownloadProgress = ev => {
            if (!ev.total || !ev.progress) return;
            const progress = ev.progress * 100;
            taskinfo.setState(`Progress (${ev.total * ev.progress}/${ev.total}): ${progress}%`);
            if (allowChangeProgress) {
                taskinfo.reportProgress(progress);
            }
        };
    }
    try {
        const promise = axios.get<T>(url, config);
        if (taskinfo) {
            taskinfo.pushState(`Downloading '${url}'`);
            taskinfo.exitState();
            taskinfo.setState(`Progress (0/0): 0%`);
            const r = await promise;
            taskinfo.pushState(`Result status code: ${r.status}`);
            taskinfo.reportProgress(100);
            return r;
        }
        return await promise;
    } catch (e) {
        if(!fallback) throw e;
        return await downloadFile<T>(fallback, config, taskinfo, allowChangeProgress, taskName, taskCategory);
    }
}

export async function getFileSize(url: string) {
    const r = ((await axios.head(url)).headers as AxiosHeaders).getContentLength() as string;
    return Number.parseInt(r);
}

export async function downloadText(url: string, config?: AxiosRequestConfig<any>, taskinfo?: TaskInfo, 
    allowChangeProgress: boolean = false, taskName?: string, taskCategory?: TaskCategory, fallback?: string) {
    const r = await downloadFile<string>(url, config, taskinfo, allowChangeProgress, taskName, taskCategory, fallback);
    return r.data;
}

export async function downloadRaw(url: string, config?: AxiosRequestConfig<any>, taskinfo?: TaskInfo, allowChangeProgress: boolean = false, 
    taskName?: string, taskCategory?: TaskCategory, fallback?: string) {
    if (config) config = { ...config };
    else config = {};
    config.responseType = "arraybuffer";
    const r = await downloadFile<ArrayBuffer>(url, config, taskinfo, allowChangeProgress, taskName, taskCategory, fallback);
    return Buffer.from(r.data);
}

const w = window as any;
w.gfs = getFileSize;
w.downloadText = downloadText;
w.downloadFile = downloadFile;
