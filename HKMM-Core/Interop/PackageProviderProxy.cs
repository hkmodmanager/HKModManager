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

        public static PackageProviderProxy Root => new()
        {
            context = PackContext.rootContext
        };

        public PackageDisplay[] GetAllPackages(bool onlyTop)
        {
            if(onlyTop)
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
    }
}
