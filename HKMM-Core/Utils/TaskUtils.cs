
global using static HKMM.Utils.TaskUtils;using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;


namespace HKMM.Utils
{
    public static class TaskUtils
    {
        private readonly static Dictionary<string, Task> singleTasks = new();
        public static Task SingleTask(Func<Task> task, [CallerMemberName] string name = "", 
            [CallerFilePath] string path = "")
        {
            var id = name + "#" + path;
            lock(singleTasks)
            {
                if(singleTasks.TryGetValue(id, out var t) && !t.IsCompleted)
                {
                    return t;
                }
                t = task();
                singleTasks[id] = t;
                return t;
            }
        }
        public static Task<T> SingleTask<T>(Func<Task<T>> task, [CallerMemberName] string name = "",
            [CallerFilePath] string path = "")
        {
            return (Task<T>)SingleTask((Func<Task>)task, name, path);
        }
    }
}
