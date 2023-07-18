using HKMM.Tasks;
using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace HKMM
{
    public enum LogLevel
    {
        Error, Warning, Log, Fine
    }
    public static class Logger
    {
        private static readonly Dictionary<LogLevel, Action<string>> handlers = new();
        public static LogLevel OutputLevel = LogLevel.Log;
        [JSExport]
        public static void RegisterLogHandler(string level, Action<string> handler)
        {
            handlers[Enum.Parse<LogLevel>(level)] = handler;
        }

        public static void Log(string msg, LogLevel level = LogLevel.Log)
        {
            if (level > OutputLevel) return;
            var task = TaskManager.CurrentTask;
            if(task != null)
            {
                task.Print(msg, level);
                msg = $"[In {task.Name}({task.Guid})]: " + msg;
            }
            if (handlers.TryGetValue(level, out var value))
            {
                value(msg);
            }
            var output = Console.Out;
            var prevColor = Console.ForegroundColor;
            if(level== LogLevel.Warning)
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
            }
            else if(level == LogLevel.Fine)
            {
                Console.ForegroundColor = ConsoleColor.Gray;
            } 
            else if(level == LogLevel.Error)
            {
                output = Console.Error;
                Console.ForegroundColor = ConsoleColor.Red;
            }
            output?.WriteLine($"[{level}]: {msg}");
            Console.ForegroundColor = prevColor;
        }
        public static void LogError(string msg)
        {
            Log(msg, LogLevel.Error);
        }
        public static void LogWarning(string msg)
        {
            Log(msg, LogLevel.Warning);
        }
        
        public static void Where([CallerMemberName] string name = "", 
            [CallerFilePath] string path = "", 
            [CallerLineNumber] int line = 0)
        {
            Log($"Call {name} in {path}:{line}", LogLevel.Fine);
        }
    }
}
