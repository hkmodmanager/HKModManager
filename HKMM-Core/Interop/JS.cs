using HKMM.Pack.Legacy;
using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace HKMM.Interop
{
    public static class JS
    {
        public static JSAPI Api => SupportJSAPI ? api : throw new NotSupportedException();
        private static JSAPI api;
        public static bool SupportJSAPI { get; private set; } = false;
        public static Thread JSMain { get; private set; } = null!;
        public static T ToCS<T>(Func<T> action)
        {
            try
            {
                return action();
            } catch(Exception ex)
            {
                Logger.LogError(ex.ToString());
                throw;
            }
        }
        public static void ToCS(Action action)
        {
            try
            {
                action();
            }
            catch (Exception ex)
            {
                Logger.LogError(ex.ToString());
                throw;
            }
        }
        public static async Task<T> ToCS<T>(Func<Task<T>> task)
        {
            try
            {
                return await task();
            } catch(Exception ex)
            {
                Logger.LogError(ex.ToString());
                throw;
            }
        }
        public static async Task ToCS(Func<Task> task)
        {
            try
            {
                await task();
            }
            catch (Exception ex)
            {
                Logger.LogError(ex.ToString());
                throw;
            }
        }
        [JSExport]
        public static void EnableWatchDog(bool enable)
        {
            JSWatchDog.disabled = !enable;
        }

        [JSExport]
        public static void InitJSAPI(JSAPI api)
        {
            JS.api = api;
            JSMain = Thread.CurrentThread;
            SupportJSAPI = true;
        }

        [JSExport]
        public static void OnSettingChanged(string path)
        {
            Settings.LoadSettings(path);
        }

        [JSExport]
        public static void ResetWatchDog()
        {
            if(!JSWatchDog.inited)
            {
                JSWatchDog.Init();
            }
            if(JSWatchDog.count < 10)
            {
                JSWatchDog.count = 10;
            }
            Interlocked.Add(ref JSWatchDog.count, 10);
        }
    }
    [JSExport]
    public struct JSAPI
    {
        public Func<string> GetModStorePath { get; set; }
        public Func<string, Task<LegacyModCollection>> ParseModLinks { get; set; }
        public Func<string, Task<LegacyModInfoFull>> ParseAPILink { get; set; }
        public Action WatchDogCheck { get; set; }
        public string GameInjectRoot { get; set; }
        public string InternalLibRoot { get; set; }
        public string CacheDir { get; set; }
        public string AppDataDir { get; set; }
        public string StartArgv { get; set; }
        public string ElectronExe { get; set; }
    }
}
