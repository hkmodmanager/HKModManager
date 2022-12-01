
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
    public updateHandler: (() => void) | undefined;
    public reportProgress(progress: number) {
        progress = Math.round(progress);
        if (progress < 0) this.progress = undefined;
        else if (progress > 100) this.progress = 100;
        else this.progress = progress;
        this.setDirty();
    }
    public setDirty() {
        if(this.updateHandler) this.updateHandler();
    }
    public setState(state: string) {
        if (this.taskState.length == 0) {
            this.exitState();
        }
        this.taskState[0] = '[' + new Date().toLocaleTimeString() + ']' + state;
        this.setDirty();
    }
    public exitState() {
        if((this.taskState[0]?.trim() ?? "") === "") return; 
        this.taskState = ["", ...this.taskState];
    }
    public pushState(state: string) {
        this.exitState();
        this.setState(state);
        this.exitState();
    }
    public finish(failed: boolean) {
        if(failed) {
            this.isFailed = true;
        } else {
            this.isSuccess = true;
        }
    }
}

export const allTasks: TaskInfo[] = [];


const w = window as any;
w.allTasks = allTasks;

export function createTask(taskName: string, taskDisplayName?: string | undefined) {
    const result = new TaskInfo();
    result.pushState("Start task");
    result.name = taskName;
    result.taskGuid = Guid.create().toString();
    result.desc = taskDisplayName ?? taskName;
    allTasks.push(result);
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
        p.then(r => {
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
