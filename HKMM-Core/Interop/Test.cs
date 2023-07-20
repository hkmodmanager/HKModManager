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
        public static void Crash()
        {
            throw new NotImplementedException();
        }
        public static void AttachDebugger()
        {
            Debugger.Launch();
        }
    }
}
