using HKMM.Tasks;
using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Interop
{
    [JSExport]
    public static class JSTaskManager
    {
        public static int TaskCount => TaskManager.tasks.Count;
        public static TaskItem GetTaskAt(int id)
        {
            return TaskManager.tasks[id];
        }
        public static void StartTask(TaskItem task)
        {
            TaskManager.StartTask(task);
        }
        public static TaskItem? GetTask(string guid)
        {
            return TaskManager.GetTask(guid);
        }
        public static double GetTasksProgress()
        {
            return TaskManager.GetTasksProgress();
        }
    }
}
