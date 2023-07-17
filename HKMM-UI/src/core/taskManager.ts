
import { getCurrentWindow } from '@electron/remote';
import { TaskItem, TaskItemStatus, JSTaskManager } from 'core';

//let a = 0;

export function createTask(taskName: string): TaskItem {
    try {
        throw new Error(`Create Task: ${taskName}`);
    } catch (e) {
        console.dir(e);
    }

    //if(a++ > 20) return null as any;
    const result = new TaskItem();
    result.status = TaskItemStatus.Running;
    result.name = taskName;
    JSTaskManager.startTask(result);

    result.log("Start task");
    try {
        throw new Error("Start Task Stack Trace");
    } catch (e: any) {
        result.log(e.stack ?? "");
    }
    return result;
}

export function startTask(taskName: string, task: (info: TaskItem) => Promise<any>) {
    const t = createTask(taskName);
    try {
        const p = task(t);
        p.catch(r => {
            t.logError(r?.toString());
            t.status = TaskItemStatus.Fail;
        });
        p.then(() => {
            t.status = TaskItemStatus.Success;
        });
        return p;
    }
    catch (e: any) {
        t.logError(e?.toString());
        t.status = TaskItemStatus.Fail;
        return undefined;
    }
}

export function getTask(taskGuid: string) {
    return JSTaskManager.getTask(taskGuid);
}

export function* getAllTasks() {
    for (let i = 0; i < JSTaskManager.taskCount; i++) {
        const result = <TaskItem>JSTaskManager.getTaskAt(i);
        if (!result) continue;
        yield result;
    }
}

//Set Progress Bar
(function () {
    setInterval(() => {
        try {
            const progress = JSTaskManager.getTasksProgress();
            if (progress == 0) {
                getCurrentWindow().setProgressBar(-1);
                return;
            } else {
                getCurrentWindow().setProgressBar(progress);
            }
        } catch (e) {
            console.error(e);
        }
    }, 500);
})();

