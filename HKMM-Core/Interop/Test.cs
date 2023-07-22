using HKMM.Modules;
using HKMM.UACHelper;
using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Interop
{
    [JSExport]
    public class Test
    {
        public static void CheckUACHelper()
        {
            UACHelperServer.CheckUACProcess();
        }
        public static unsafe void Crash()
        {
            *((int*)0) = 1024;
        }
    }
}
