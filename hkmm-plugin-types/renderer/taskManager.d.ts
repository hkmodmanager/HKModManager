export declare type TaskCategory = "Download" | "Build" | "Auto";
export declare class TaskInfo {
    task: Promise<any>;
    name: string;
    taskState: string[];
    taskGuid: string;
    progress: number | undefined;
    category: TaskCategory | undefined;
    isFailed: boolean;
    isSuccess: boolean;
    isHidden: boolean;
    desc: string;
    startTime: number;
    stopTime?: number;
    updateHandler: (() => void) | undefined;
    reportProgress(progress: number): void;
    setDirty(): void;
    setState(state: string): void;
    exitState(): void;
    pushState(state: string): void;
    finish(failed: boolean): void;
}
export declare const allTasks: TaskInfo[];
export declare function createTask(taskName: string, taskDisplayName?: string | undefined): TaskInfo;
export declare function startTask(taskName: string, taskDisplayName: string | undefined, task: (info: TaskInfo) => Promise<any>): TaskInfo;
export declare function getTask(taskGuid: String): TaskInfo | undefined;
