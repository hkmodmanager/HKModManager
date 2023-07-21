using HKMM.Tasks;
using Microsoft.JavaScript.NodeApi;
using PInvoke;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace HKMM
{
    [JSExport]
    public enum LogLevel
    {
        Error, Warning, Log, Fine
    }
    public static class Logger
    {
        private static readonly TextWriter logOutput;
        private static readonly string LogRoot =
            Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "hkmm-logs"
                );
        static Logger()
        {
            var d = DateTime.Now;
            Directory.CreateDirectory(LogRoot);
            var p = Path.Combine(LogRoot, d.ToString("yyyy-MM-dd_H-mm") + ".log");
            logOutput = new StreamWriter(File.Open(p, FileMode.Append | FileMode.OpenOrCreate, 
                FileAccess.Write, FileShare.ReadWrite), Encoding.UTF8);
        }
        private static readonly Dictionary<LogLevel, Action<string>> handlers = new();
#if DEBUG
        public static LogLevel OutputLevel = LogLevel.Fine;
#else
        public static LogLevel OutputLevel = LogLevel.Log;
#endif
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
                //value(msg);
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
            var n = DateTime.Now;
            if (level < LogLevel.Fine)
            {
                
                var head = $"[{level}][{n:HH-mm-ss:ffff}][t:{Kernel32.GetCurrentThreadId()}]";
                logOutput?.WriteLine(("\n" + msg).Replace("\n", $"\n{head}"));
                logOutput?.Flush();
            }
            output?.WriteLine($"[{level}][p:{Kernel32.GetCurrentProcessId()}][t:{Kernel32.GetCurrentThreadId()}]: {msg}");
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
            //Log($"Calling {name} in {path}:{line}", LogLevel.Fine);
        }
    }
}
