using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM
{
    public enum LogLevel
    {
        Log, Warning, Error
    }
    public static class Logger
    {
        private static readonly Dictionary<LogLevel, Action<string>> handlers = new();

        [JSExport]
        public static void RegisterLogHandler(string level, Action<string> handler)
        {
            handlers[Enum.Parse<LogLevel>(level)] = handler;
        }

        public static void Log(string msg, LogLevel level)
        {
            if (handlers.TryGetValue(level, out var value))
            {
                value(msg);
            }
        }
        public static void LogError(string msg)
        {
            Log(msg, LogLevel.Error);
        }
        public static void LogWarning(string msg)
        {
            Log(msg, LogLevel.Warning);
        }
    }
}
