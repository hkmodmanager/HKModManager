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
    public class NetUtility
    {
        public static void InitUACHelper(string parentPID, string pipeName)
        {
            var pid = int.Parse(parentPID);
            var parent = Process.GetProcessById(pid);
            if(parent ==null)
            {
                return;
            }
            UACHelperMain.Init(parent, pipeName);
        }
    }
}
