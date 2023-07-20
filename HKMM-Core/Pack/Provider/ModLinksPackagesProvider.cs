using HKMM.Interop;
using HKMM.Modules;
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
            var text =
                Encoding.UTF8.GetString(
                    (await WebModule.Instance.DownloadRawFile(@"https://github.com/hk-modding/modlinks/raw/main/ModLinks.xml")).Item2
                    );
            var mods = await JS.Api.ParseModLinks(text);
            foreach (var mod in mods.mods)
            {
                var pack = mod.ToHKMMPackageDef();
                packages.Add(mod.Value.Name, pack);
            }
            CacheModule.Instance.SetObject("MPP", "p.Info", packages);
            return true;
        }
    }
}
