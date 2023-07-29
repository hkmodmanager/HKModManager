using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.ExceptionServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace HKMM.UACHelper
{
    internal class UACHelperSyncContext : SynchronizationContext
    {
        public static readonly UACHelperSyncContext instance = new();
        public class Worker
        {
            public readonly static Worker instance = new();
            public Worker()
            {
                new Thread(Runner)
                {
                    IsBackground = true
                }.Start();
            }
            private void Runner()
            {
                Thread.Sleep(1);
                SetSynchronizationContext(UACHelperSyncContext.instance);
                while (true)
                {
                    if(tasks.TryDequeue(out var task))
                    {
                        try
                        {
                            task.Item2(task.Item3);
                        } catch(Exception ex)
                        {
                            task.Item1?.Invoke(ex);
                            continue;
                        }
                        task.Item1?.Invoke(null);
                    }
                    else
                    {
                        Thread.Yield();
                    }
                }
            }
            public ConcurrentQueue<(Action<Exception?>?, SendOrPostCallback, object?)> tasks = new();
        }

        public override void Send(SendOrPostCallback d, object? state)
        {
            if(Current == this)
            {
                d(state);
                return;
            }
            var waiter = new object();
            Exception? e = null;
            Worker.instance.tasks.Enqueue((ex =>
            {
                lock(waiter)
                {
                    Monitor.Pulse(waiter);
                }
                e = ex;
            }, d, state));
            lock(waiter)
            {
                Monitor.Wait(waiter);
            }
            if(e != null)
            {
                ExceptionDispatchInfo.Capture(e).Throw();
            }
        }
        public override void Post(SendOrPostCallback d, object? state)
        {
            Worker.instance.tasks.Enqueue((null, d, state));
        }
    }
}
