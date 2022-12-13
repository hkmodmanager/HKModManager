/// <reference types="node" />
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { TaskInfo, TaskCategory } from '@/renderer/taskManager';
export declare function downloadFile<T = any>(url: string, config?: AxiosRequestConfig<any>, taskinfo?: TaskInfo, allowChangeProgress?: boolean, taskName?: string, taskCategory?: TaskCategory): Promise<AxiosResponse<T, any>>;
export declare function getFileSize(url: string): Promise<number>;
export declare function downloadText(url: string, config?: AxiosRequestConfig<any>, taskinfo?: TaskInfo, allowChangeProgress?: boolean, taskName?: string, taskCategory?: TaskCategory): Promise<string>;
export declare function downloadRaw(url: string, config?: AxiosRequestConfig<any>, taskinfo?: TaskInfo, allowChangeProgress?: boolean, taskName?: string, taskCategory?: TaskCategory): Promise<Buffer>;
