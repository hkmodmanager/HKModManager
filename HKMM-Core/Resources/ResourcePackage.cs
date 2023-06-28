using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Resources
{
    [JSExport]
    public struct ResourcePackage
    {
        public string Name { get; set; }
        public string Guid { get; set; }
        public ResourceResovleType Type { get; set; }
        public string? DisplayName { get; set; }
        public string? Description { get; set; }
        public string Version { get; set; }
        
        public ResourceResovle[] Resources { get; set; }
    }
    [JSExport]
    public enum ResourcePackageType
    {
        None,
        Mod,
        Modpack
    }
}
