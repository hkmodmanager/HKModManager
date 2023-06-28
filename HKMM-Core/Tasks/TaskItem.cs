using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Tasks
{
    [JSExport]
    public delegate void TaskPropertyChanged(TaskItem task, string? propertyName);

    [JSExport]
    public struct TaskLogInfo
    {
        public string Message { get; set; }
        public string? Color { get; set; }
    }

    [JSExport]
    public class TaskItem : INotifyPropertyChanged
    {
        public string Name { get; set; } = "";
        public string Guid { get; set; } = System.Guid.NewGuid().ToString();
        public int Progress { get; set; } = -1;
        public DateTime StartTime { get; } = DateTime.UtcNow;
        public DateTime EndTime { get; set; }
        public List<TaskLogInfo> logs = new();

        public event PropertyChangedEventHandler? PropertyChanged;
        public TaskPropertyChanged? OnChanged { get; set; }
        public TaskItemStatus Status { get; set; } = TaskItemStatus.Idle;
        public bool IsSuccess => Status == TaskItemStatus.Success;
        public bool IsFailed => Status == TaskItemStatus.Fail;
        public bool IsRunning => Status == TaskItemStatus.Running;

        public int LogCount => logs.Count;
        public TaskLogInfo GetLogAt(int id) => logs[id];
        
        public TaskItem()
        {
            PropertyChanged = (sender, p) =>
            {
                if(p.PropertyName == nameof(Status))
                {
                    if(Status != TaskItemStatus.Running)
                    {
                        EndTime = DateTime.UtcNow;
                    }
                }
                OnChanged?.Invoke(this, p.PropertyName);
            };
        }

        public void Log(string msg) => Print(msg, LogLevel.Log);
        public void LogError(string msg) => Print(msg, LogLevel.Error);
        public void LogWarn(string msg) => Print(msg, LogLevel.Warning);

        public void Print(string msg, LogLevel level)
        {
            foreach (var v in msg.Split('\n')
                        .Select(x => $"[{DateTime.UtcNow}][{level}] {x}"))
            {

                logs.Add(new()
                {
                    Message = msg,
                    Color = level switch
                    {
                        LogLevel.Log => "",
                        LogLevel.Error => "danger",
                        LogLevel.Warning => "warning",
                        _ => "",
                    }
                });
                Logger.Log($"[{Guid}-{Name}]: {msg}", level);
            }
            OnChanged?.Invoke(this, nameof(logs));
        }

        public long GetRunningTime()
        {
            var span = IsRunning ? (DateTime.UtcNow - StartTime) : (EndTime - StartTime);
            return (long)span.TotalMilliseconds;
        }
    }
    [JSExport]
    public enum TaskItemStatus
    {
        Idle,
        Running,
        Success,
        Fail
    }
}
