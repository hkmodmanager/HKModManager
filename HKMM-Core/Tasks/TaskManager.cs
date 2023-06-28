using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Tasks
{
    [JSExport]
    public static class TaskManager
    {
        public readonly static List<TaskItem> tasks = new();
        public static int TaskCount => tasks.Count;
        public static TaskItem GetTaskAt(int id)
        {
            Logger.Log($"GetTaskAt: {id} {tasks[id]}", LogLevel.Log);
            return tasks[id];
        }
        public static void StartTask(TaskItem task)
        {
            if(task == null) throw new ArgumentNullException(nameof(task));
            tasks.Add(task);
        }
        public static TaskItem? GetTask(string guid)
        {
            return tasks.Find(x => x.Guid == guid);
        }
    }
}
