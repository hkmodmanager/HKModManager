using HKMM.Pack.Metadata;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Pack
{
    public class PackContext
    {
        public readonly PackCollection packages;
        public readonly List<PackContext> fallback = new();
        public PackContext()
        {
            packages = new();
        }
        public PackContext(PackCollection packages)
        {
            this.packages = packages;
        }

        public virtual PackageBase? FindPack(string name)
        {
            if (packages.TryGetValue(name, out var pack)) return pack;
            foreach(var v in fallback)
            {
                var p = v.FindPack(name);
                if(p != null) return p;
            }
            return null;
        }
    }
}
