using HKMM.Pack;
using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Interop
{
    [JSExport]
    public class PackageProviderProxy
    {
        public PackContext context = null!;

        public static PackageProviderProxy GetRoot()
        {
            Logger.Where();
            return new()
            {
                context = PackContext.rootContext
            };
        }

        public PackageDisplay[] GetAllPackages(bool onlyTop)
        {
            Logger.Where();
            if (onlyTop)
            {
                return context.packages.Values
                    .Select(x => new PackageDisplay() { package = x.ToHKMMPackageDef()}).ToArray();
            }
            else
            {
                return context.GetAllPackages()
                    .Select(x => new PackageDisplay() { package = x.ToHKMMPackageDef() }).ToArray();
            }
        }
        public string Name => context.Name;

        public static bool AllInited => PackContext.InitCount == 0;
        
        public PackageDisplay? GetPackage(string name)
        {
            return JS.ToCS<PackageDisplay?>(() =>
            {
                Logger.Where();
                var pack = context.FindPack(name);
                if (pack == null) return null;
                return new() { package = pack.ToHKMMPackageDef() };
            });
        }
    }
}
