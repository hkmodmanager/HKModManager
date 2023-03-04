
import { default as axios, AxiosRequestConfig, AxiosResponse, AxiosHeaders, AxiosResponseHeaders } from 'axios'
import { startTask, TaskInfo, TaskCategory } from '@/renderer/taskManager';
import { DownloadFileSeg } from '../nethelper';
import { hasOption, store } from '../settings';
import asyncPool from 'tiny-async-pool'
import { ConvertSize } from './utils';

export async function downloadFileFast(url: string, size: number, allowChangeProgress: Boolean,
    config?: AxiosRequestConfig<any>, taskinfo?: TaskInfo): Promise<Buffer> {
    taskinfo?.pushState(`Download file ${url} using segments`);
    config ??= {};
    config = { ...config };
    config.responseType = 'arraybuffer';
    let segments = 16;
    if (size < 1024 * 1024 * 10) segments = 4;
    else if (size < 1024 * 1024 * 20) segments = 8;
    else if (size < 1024 * 1024 * 50) segments = 12;
    else segments = 16;
    const persegments = Math.round(size / segments);
    taskinfo?.pushState(`Total segments: ${segments}(${ConvertSize(persegments)})`);
    const ranges: [number, number][] = [];
    let offset = 0;
    for (let i = 0; i < segments; i++) {
        const from = offset;
        const to = Math.min(offset + persegments, size - 1);
        ranges.push([from, to]);
        offset += persegments + 1;
    }
    const buf: Buffer[] = [];
    let id = 0;
    let totalComplate = 1;
    for await (const c of asyncPool(store.get('maxConnection', 16), ranges, async (range) => {
        const sid = id++;
        for (let retry = 0; retry <= store.get('downloadRetry'); retry++) {
            try {
                taskinfo?.pushState(`Begin download segment: ${sid}(${range[0]}-${range[1]}) Size: ${ConvertSize(range[1] - range[0])}`);
                const r = await DownloadFileSeg(url, range[0], range[1]);
                taskinfo?.pushState(`Finish download segment(${totalComplate++}/${segments}): ${sid}`);
                if (allowChangeProgress) {
                    taskinfo?.reportProgress(totalComplate / segments * 100);
                }
                return [sid, r] as [number, Buffer];
            } catch (e: any) {
                console.error(e);
                taskinfo?.pushState(e?.toString());
                if (retry == store.get('downloadRetry')) throw e;
                taskinfo?.pushState(`Retry download segment: ${sid}`);
            }
        }
        throw new Error('Failed Retry');
    })) {
        buf[c[0]] = c[1];
    }
    return Buffer.concat(buf);
}

export async function downloadFile<T = any>(url: string
    , config?: AxiosRequestConfig<any>,
    canUseFast?: Boolean,
    taskinfo?: TaskInfo,
    allowChangeProgress: boolean = (taskinfo == undefined),
    taskName?: string,
    taskCategory?: TaskCategory, fallback?: string,
    useGhProxy = hasOption('USE_GH_PROXY'), mirrors: string[] = store.store.mirror_github): Promise<AxiosResponse<T, any> | Buffer> {
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
        if (canUseFast && hasOption('FAST_DOWNLOAD')) {
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
            if (acceptRanges && size && size > 1024 * 1024 * 5) {
                return await downloadFileFast(url, size, allowChangeProgress, config, taskinfo);
            }
        }
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
