using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Resources
{
    [JSExport]
    public struct ResourceResovle
    {
        public ResourceResovleType Type { get; set; }
        public string Data { get; set; }
    }
    [JSExport]
    public enum ResourceResovleType
    {
        None,
        WebFile
    }
}
