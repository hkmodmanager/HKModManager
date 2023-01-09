
import { default as axios, AxiosRequestConfig, AxiosResponse, AxiosHeaders, AxiosResponseHeaders } from 'axios'
import { startTask, TaskInfo, TaskCategory } from '@/renderer/taskManager';
import { ipcRenderer } from 'electron';
import { Guid } from 'guid-typescript';
import { DownloadFileSeg } from '../nethelper';
import { hasOption, store } from '../settings';

export async function downloadFileFast<T = any>(url: string, size: number, allowChangeProgress: Boolean, config?: AxiosRequestConfig<any>, taskinfo?: TaskInfo): Promise<Buffer> {
    taskinfo?.pushState(`Download file ${url} using segments`);
    config ??= {};
    config = {...config};
    config.responseType = 'arraybuffer';
    const segments = 16;
    const persegments = Math.round(size / segments);
    const tasks: Promise<Buffer>[] = [];
    let offset = 0;
    for(let i = 0; i < segments ; i++) {
        const from = offset;
        const to = Math.min(offset + persegments, size -1);
        const range = `${from}-${to}`;
        offset += persegments + 1;
        tasks.push((async function(): Promise<Buffer>{
            taskinfo?.pushState(`Start download segment: ${i}(${range})`);
            /*const c = {...config};
            c.headers = new AxiosHeaders(config.headers as AxiosHeaders);
            c.headers.set('Range', `bytes=${range}`);
            const r = Buffer.from((await axios.get<ArrayBuffer>(url + "?_=" + Guid.create().toString(), c)).data);*/
            const r = await DownloadFileSeg(url, from, to);
            taskinfo?.pushState(`Download segment finished: ${i}(${range})`);
            return r;
        })());
    }
    const r = await Promise.all(tasks);
    return Buffer.concat(r);
}

export async function downloadFile<T = any>(url: string
    , config?: AxiosRequestConfig<any>, 
    canUseFast?: Boolean,
    taskinfo?: TaskInfo, 
    allowChangeProgress: boolean = false,
    taskName?: string,
    taskCategory?: TaskCategory, fallback?: string): Promise<AxiosResponse<T, any> | Buffer> {
    if (taskName) {
        return await startTask(taskName, undefined, async (info): Promise<AxiosResponse<T, any> | Buffer> => {
            info.category = taskCategory;
            return await downloadFile<T>(url, config, canUseFast, info, true);
        }).task as AxiosResponse<T, any>;
    }
    if (config) config = { ...config };
    else config = {};

    try {
        
        let acceptRanges = false;
        let size: number | undefined = undefined;
        try {
            const head = await axios.head(url, config);
            const header = head.headers as AxiosResponseHeaders;
            acceptRanges = header.get('Accept-Ranges') === 'bytes';
            size = header.getContentLength() as number;
        } catch (e) {
            console.error(e);
        }
        if (acceptRanges && size && size > 1024 * 1024 * 5 && canUseFast && store.get('enabled_exp_mode') && hasOption('FAST_DOWNLOAD')) {
            return await downloadFileFast<T>(url, size, allowChangeProgress,config, taskinfo);
        }
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
        const promise = axios.get<T>(url, config);
        taskinfo?.pushState(`Downloading '${url}'`);
        taskinfo?.exitState();
        taskinfo?.setState(`Progress (0/0): 0%`);
        const r = await promise;
        taskinfo?.pushState(`Result status code: ${r.status}`);
        taskinfo?.reportProgress(100);
        return r;
    } catch (e) {
        if (!fallback) throw e;
        return await downloadFile<T>(fallback, config, canUseFast,taskinfo, allowChangeProgress, taskName, taskCategory);
    }
}

export async function getFileSize(url: string) {
    const r = ((await axios.head(url)).headers as AxiosHeaders).getContentLength() as string;
    return Number.parseInt(r);
}

export async function downloadText(url: string, config?: AxiosRequestConfig<any>, taskinfo?: TaskInfo,
    allowChangeProgress: boolean = false, taskName?: string, taskCategory?: TaskCategory, fallback?: string) {
    config ??= {};
    config.responseType = 'text';
    const r = await downloadFile<string>(url, config, false, taskinfo, allowChangeProgress, taskName, taskCategory, fallback) as AxiosResponse<string>;
    return r.data;
}

export async function downloadRaw(url: string, config?: AxiosRequestConfig<any>, taskinfo?: TaskInfo, allowChangeProgress: boolean = false,
    taskName?: string, taskCategory?: TaskCategory, fallback?: string) {
    if (config) config = { ...config };
    else config = {};
    config.responseType = "arraybuffer";
    const r = await downloadFile<ArrayBuffer>(url, config, false, taskinfo, allowChangeProgress, taskName, taskCategory, fallback);
    return r instanceof Buffer ? r : Buffer.from(r.data);
}

const w = window as any;
w.gfs = getFileSize;
w.downloadText = downloadText;
w.downloadFile = downloadFile;
