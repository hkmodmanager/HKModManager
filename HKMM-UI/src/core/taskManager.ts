
import { LogSkipStackFrame } from '@/common';
import { getCurrentWindow } from '@electron/remote';
import { Guid } from 'guid-typescript'

export type TaskCategory = "Download" | "Build" | "Auto";

export class TaskInfo {
    public task: Promise<any> = undefined as unknown as any;
    public name: string = "";
    public taskState: string[] = [];
    public taskGuid: string = "";
    public progress: number | undefined;
    public category: TaskCategory | undefined;
    public isFailed: boolean = false;
    public isSuccess: boolean = false;
    public isHidden: boolean = false;
    public desc: string = "";
    public startTime: number = new Date().valueOf();
    public stopTime?: number;
    public updateHandler: (() => void) | undefined;
    public reportProgress(progress: number) {
        progress = Math.round(progress);
        if (progress < 0) this.progress = undefined;
        else if (progress > 100) this.progress = 100;
        else this.progress = progress;
        this.setDirty();
    }
    public setDirty() {
        if (this.updateHandler) this.updateHandler();
    }
    public setState(state: string) {
        if (this.taskState.length == 0) {
            this.exitState();
        }
        this.taskState[0] = '[' + new Date().toLocaleTimeString() + ']' + state;
        this.setDirty();
    }
    public exitState() {
        if ((this.taskState[0]?.trim() ?? "") === "") return;
        this.taskState = ["", ...this.taskState];
    }
    public pushState(state: string) {
        this.exitState();
        console.log(`[Task (${this.name})-{${this.taskGuid}}]:${state}`, new LogSkipStackFrame(1));
        this.setState(state);
        this.exitState();
    }
    public finish(failed: boolean) {
        if (failed) {
            this.isFailed = true;
        } else {
            this.isSuccess = true;
        }
        this.stopTime = new Date().valueOf();
        console.log(
            `[Task finish (${this.name})-{${this.taskGuid}}] (${failed ? 'Failed' : 'Complate'}) - ${new Date(this.startTime).toLocaleString()} to ${new Date().toLocaleString()} = ${this.stopTime - this.startTime}ms`
            , new LogSkipStackFrame(1));
    }
    public isStop() {
        return this.isFailed || this.isSuccess;
    }
}

export const allTasks: TaskInfo[] = [];


const w = window as any;
w.allTasks = allTasks;

export function createTask(taskName: string, taskDisplayName?: string | undefined) {
    const result = new TaskInfo();
    
    result.name = taskName;
    result.taskGuid = Guid.create().toString();
    result.desc = taskDisplayName ?? taskName;
    allTasks.push(result);
    
    result.pushState("Start task");
    try
    {
        throw new Error("Start Task Stack Trace");
    } catch(e: any) {
        result.pushState(e.stack ?? "");
    }
    return result;
}

export function startTask(taskName: string, taskDisplayName: string | undefined, task: (info: TaskInfo) => Promise<any>): TaskInfo {
    const t = createTask(taskName, taskDisplayName);
    try {
        const p = task(t);
        p.catch(r => {
            t.pushState(r?.toString());
            t.finish(true);
        });
        p.then(() => {
            t.pushState("Task finished");
            t.finish(false);
        });
        t.task = p;
    }
    catch (e: any) {
        t.pushState(e?.toString());
        t.finish(true);
    }
    return t;
}

export function getTask(taskGuid: String) {
    return allTasks.find((val) => val.taskGuid === taskGuid);
}

//Set Progress Bar
(function () {
    setInterval(() => {
        let total = 0;
        let finished = 0;
        for (const task of allTasks) {
            if(task.isStop()) continue;
            if(!task.progress || task.progress < 0) continue;
            total += 100;
            finished += task.progress;
        }
        if(total == 0) {
            getCurrentWindow().setProgressBar(-1);
            return;
        } else {
            getCurrentWindow().setProgressBar(finished / total);
        }
        
    }, 500);
})();

