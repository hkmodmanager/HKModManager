using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Pack.Legacy
{
    [JSExport]
    public struct LegacyLocalModInfo
    {
        public string Name { get; set; }
        public string Version { get; set; }
        public long Install { get; set; }
        public string Path { get; set; }
        public LegacyModInfoFull Modinfo { get; set; }


    }
}
