using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Pack.Legacy
{
    [JSExport]
    public struct LegacyModInfoFull 
    {
        public string Name { get; set; }
        public string Version { get; set; }
        public string Desc { get; set; }
        public string? DisplayName { get; set; }
        public string? Link { get; set; }
        public string[] Dependencies { get; set; }
        public string[] Integrations { get; set; }
        public string? Repository { get; set; }
        public string[] Tags { get; set; }
        public string[] Authors { get; set; }
        public string? Date { get; set; }
    }
}
