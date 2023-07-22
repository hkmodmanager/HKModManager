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

        public PackageProviderProxy Provider => new()
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
        public string URL => provider.url;
        public string Name => provider.Info!.Name;
        public string Description => provider.Info!.Description;
        public IList<string>? Authors => provider.Info!.Authors;
        public string? Icon => provider.Info?.Icon;
        public string? Repository => provider.Info?.Repository?.ToString();

        public void Remove()
        {
            Check();
            PackContext.customProviders.fallback.Remove(provider);
        }

        public static CustomPackageProviderProxy AddCustomProvider(string url)
        {
            var p = PackContext.customProviders.fallback.OfType<CustomPackagesProvider>()
                .FirstOrDefault(x => x.url == url);
            if (p == null)
            {
                p =new CustomPackagesProvider(url);
                PackContext.customProviders.fallback.Add(p);
            }
            return new() { provider = p };
        }
        public static CustomPackageProviderProxy[] GetAllCustomProviders()
        {
            return PackContext.customProviders.fallback
                .Select(x => new CustomPackageProviderProxy()
                {
                    provider = (CustomPackagesProvider)x
                })
                .ToArray();
        }
    }

}