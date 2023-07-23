using HKMM.Modules;
using HKMM.Pack.Metadata;
using HKMM.Pack.Metadata.Providers;
using HKMM.Utils;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Pack.Provider.Custom
{
    public class CustomPackagesProvider : PackContext
    {
        public CustomPackagesProvider(string url)
        {
            this.url = url;
        }
        public readonly string url;
        public string ProviderName { get; set; } = "";
        public HKMMProviderV1? Info { get; private set; }
        public override string Name => "Custom Provider";
        protected override async Task<bool> TryInit()
        {
            Info = JsonUtils.ToObject<HKMMProviderV1>(
                await WebModule.Instance.DownloadTextFile(url)
                );
            if(string.IsNullOrEmpty(Info.Name) || 
                string.IsNullOrEmpty(Info.Description) ||
                Info.Packages == null )
            {
                throw new InvalidDataException();
            }
            Logger.Log($"Provider Name: " + Info.Name);
            Logger.Log($"Packages: ");
            foreach(var v in Info.Packages)
            {
                PackageBase? pack = null;
                if (v.PurpleUri != null)
                {
                    Logger.Log($"From URL: " + v.PurpleUri);
                    var data = JsonUtils.ToObject<PackageBase>(
                        await WebModule.Instance.DownloadTextFile(v.PurpleUri.ToString())
                    ).ToHKMMPackageDef();
                    Logger.Log($"Got package: {data.Name}(v{data.Version})");
                    pack = data;
                }
                if(v.Pack != null)
                {
                    Logger.Log($"Got package: {v.Pack.Value.Name}");
                    pack = v.Pack;
                }
                if(pack != null)
                {
                    packages[pack.Value.Name] = pack;
                }
            }

            return true;
        }
    }
}
