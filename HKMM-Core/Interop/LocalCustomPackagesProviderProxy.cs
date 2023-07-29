using HKMM.Pack;
using HKMM.Pack.Provider.Custom;
using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Interop
{
    [JSExport]
    public class LocalCustomPackagesProviderProxy
    {
        public static PackageProviderProxy Provider { get; } = new()
        {
            context = LocalCustomPackagesProvider.instance
        };
        public static PackageDisplay Current => new()
        {
            package = LocalCustomPackagesProvider.instance.GetCurrent()
        };
        public static PackageDisplay CreateNew()
        {
            return new()
            {
                package = LocalCustomPackagesProvider.instance.CreateNew()
            };
        }
        public static void Remove(PackageDisplay pack)
        {
            var inst = LocalCustomPackagesProvider.instance;
            inst.packages.Remove(pack.Name);
        }
        public static async Task SwitchTo(PackageDisplay pack)
        {
            foreach(var v in LocalPackManager.Instance.mods.ToArray())
            {
                if(v.Key.StartsWith("$lcp."))
                {
                    LocalPackManager.Instance.UninstallPack(v.Value);
                }
                else if(!v.Value.Info.IsImportant && v.Value.Info.AllowToggle)
                {
                    v.Value.Enabled = false;
                }
            }
            var p = await LocalPackManager.Instance.InstallHKPackage(false, pack.package);
            p.Enabled = true;
        }
        public static void Rename(PackageDisplay pack, string name)
        {
            pack.package.DisplayName = name;
            LocalCustomPackagesProvider.instance.SavePackages();
        }
    }
}
