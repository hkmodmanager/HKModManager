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
        public string Path { get; set; }
    }
    [JSExport]
    public enum ResourceResovleType
    {
        None,
        WebFile
    }
}
