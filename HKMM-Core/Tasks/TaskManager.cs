using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace HKMM.Tasks
{
    
    
    public static class TaskManager
    {
        public readonly static List<TaskItem> tasks = new();
        public static int TaskCount => tasks.Count;
        private static AsyncLocal<TaskItem?> current = new();
        public static TaskItem? CurrentTask => current.Value;
        public static TaskItem GetTaskAt(int id)
        {
            return tasks[id];
        }
        public static void StartTask(TaskItem task)
        {
            if(task == null) throw new ArgumentNullException(nameof(task));
            tasks.Add(task);
        }
        public static Task StartTask(string name, Func<Task> task)
        {
            return StartTask<object?>(name, async () =>
            {
                await task();
                return null;
            }, out _);
        }

        [Serializable]
        public class TaskException : Exception
        {
            public TaskException() { }
            public TaskException(string message) : base(message) { }
            public TaskException(string message, Exception inner) : base(message, inner) { }
            protected TaskException(
              System.Runtime.Serialization.SerializationInfo info,
              System.Runtime.Serialization.StreamingContext context) : base(info, context) { }
        }
        public static Task<T> StartTask<T>(string name, Func<Task<T>> task, out TaskItem item)
        {
            var t = new TaskItem();
            item = t;
            t.Name = name;
            t.Guid = Guid.NewGuid().ToString();
            return Task.Run<T>(async () =>
            {
                T result = default!;
                current.Value = t;
                try
                {
                    result = await task();
                }
                catch (Exception e)
                {
                    t.Status = TaskItemStatus.Fail;
                    Logger.LogError(e.ToString());
                    throw new TaskException($"An exception is thrown in task `{t.Name}`({t.Guid})");
                }
                t.Status = TaskItemStatus.Success;
                return result;
            });
        }
        public static TaskItem? GetTask(string guid)
        {
            return tasks.Find(x => x.Guid == guid);
        }
        public static double GetTasksProgress()
        {
            var it = tasks.Where(x => x != null && x.IsRunning && x.Progress >= 0);
            var count = it.Count();
            if (count == 0) return -1;
            double total = count * 100;
            double complete = it.Average(x => x.Progress);
            return complete / total;
        }
    }
}
