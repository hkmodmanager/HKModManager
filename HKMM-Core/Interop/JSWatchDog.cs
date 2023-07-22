using PInvoke;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Timers;
using Timer = System.Threading.Timer;

namespace HKMM.Interop
{
    internal class JSWatchDog
    {
        public static int count = 10;
        public static bool inited = false;
        public static bool disabled = false;
        public static void Init()
        {
            inited = true;
            new Thread(() =>
            {
                while(true)
                {
                    while(disabled) Thread.Yield();
                    Logger.Log($"WatchDog: " + count, LogLevel.Fine);
                    if(count > 20)
                    {
                        count = 10;
                    }
                    try
                    {
                        Task.Run(JS.Api.WatchDogCheck).Wait(500);
                        count = 20;
                    } catch(TimeoutException)
                    {

                    }
                    if(Interlocked.Add(ref count, -1) <= 0)
                    {
                        Logger.LogWarning($"Will timeout !!!!");
                        Thread.Sleep(1000);
                        if(count <= 0)
                        {
                            Logger.LogError($"Timeout!!!");
                            User32.MessageBox(nint.Zero, "Crash", "Timeout",
                                User32.MessageBoxOptions.MB_ICONERROR);
                            throw new TimeoutException();
                        }
                    }
                    Thread.Sleep(500);
                }
            })
            {
                Name = "JS Watch Dog",
                IsBackground = true
            }.Start();
        }
    }
}
