using HKMM.Interop;
using HKMM.Modules;
using HKMM.Parser;
using HKMM.Tasks;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Pack.Provider
{
    public class ModLinksPackagesProvider : PackContext
    {
        public override string Name => "ModLinks";
        public static readonly ModLinksPackagesProvider instance = new();
        protected override async Task<bool> TryInit()
        {
            var text = await WebModule.Instance.DownloadTextFile(
                @"https://github.com/hk-modding/modlinks/raw/main/ModLinks.xml");
            var mods = ModLinksParser.ParseModLinks(text);
            foreach (var mod in mods)
            {
                var pack = mod.ToHKMMPackageDef();
                packages.Add(mod.Value.Name, pack);
            }
            CacheModule.Instance.SetObject("MPP", "p.Info", packages);
            return true;
        }
    }
}
