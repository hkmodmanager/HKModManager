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
    public class CustomPackageProviderProxy
    {
        public CustomPackagesProvider provider = null!;

        public PackageProviderProxy Provider => new PackageProviderProxy()
        {
            context = provider
        };

        public CustomPackageProviderProxy Check()
        {
            if (provider == null)
            {
                throw new NotSupportedException();
            }
            return this;
        }

        public string Name => provider.Info!.Name;
        public string Description => provider.Info!.Description;
        public IList<string>? Authors => provider.Info!.Authors;
        public string? Icon => provider.Info?.Icon;
        public string? Repository => provider.Info?.Repository?.ToString();
    }

}