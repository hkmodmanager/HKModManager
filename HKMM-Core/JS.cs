using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM
{
    public static class JS
    {
        public static JSAPI api;

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

        }
    }
    [JSExport]
    public struct JSAPI
    {
        public Func<string> GetConfigPath { get; set; }
    }
}
