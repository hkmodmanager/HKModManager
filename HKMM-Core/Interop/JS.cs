using HKMM.Pack.Legacy;
using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Interop
{
    public static class JS
    {
        public static JSAPI Api => SupportJSAPI ? api : throw new NotSupportedException();
        private static JSAPI api;
        public static bool SupportJSAPI { get; private set; } = false;

        [JSExport]
        public static void InitJSAPI(JSAPI api)
        {
            JS.api = api;
            SupportJSAPI = true;
        }

        [JSExport]
        public static void OnSettingChanged()
        {
            Settings.LoadSettings();
        }
    }
    [JSExport]
    public struct JSAPI
    {
        public Func<string> GetModStorePath { get; set; }
        public Func<string> GetConfigPath { get; set; }
        public Func<string, Task<LegacyModCollection>> ParseModLinks { get; set; }
        public Func<string, Task<LegacyModInfoFull>> ParseAPILink { get; set; }
    }
}
