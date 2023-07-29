using HKMM.Pack.Metadata;
using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Pack.Legacy
{
    [JSExport]
    public class LegacyModCollection
    {
        public List<PackageBase> mods = new();
        public void AddMod(LegacyModInfoFull mod)
        {
            mods.Add(HKMMPackage.FromModLegacyToHKMM(mod));
        }
    }
}
