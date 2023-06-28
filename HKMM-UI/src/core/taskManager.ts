
import { getCurrentWindow } from '@electron/remote';
import { TaskItem, TaskItemStatus, TaskManager } from 'core';

//let a = 0;

export function createTask(taskName: string): TaskItem {
    try
    {
        throw new Error(`Create Task: ${taskName}`);
    }catch(e)
    {
        console.dir(e);
    }

    //if(a++ > 20) return null as any;
    const result = new TaskItem();
    
    result.name = taskName;
    TaskManager.startTask(result);
    
    result.log("Start task");
    try
    {
        throw new Error("Start Task Stack Trace");
    } catch(e: any) {
        result.log(e.stack ?? "");
    }
    return result;
}

export function startTask(taskName: string, task: (info: TaskItem) => Promise<any>){
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
    return TaskManager.getTask(taskGuid);
}

export function* getAllTasks() {
    for(let i = 0; i < TaskManager.taskCount ; i++) {
        const result = <TaskItem>TaskManager.getTaskAt(i);
        if(!result) continue;
        yield result;
    }
}

//Set Progress Bar
(function () {
    setInterval(() => {
        let total = 0;
        let finished = 0;
        for (const task of getAllTasks()) {
            if(!task.isRunning) continue;
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
});

