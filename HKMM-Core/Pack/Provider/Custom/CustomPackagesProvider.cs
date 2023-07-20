﻿using HKMM.Modules;
using HKMM.Pack.Metadata;
using HKMM.Pack.Metadata.Providers;
using HKMM.Utils;
using System;
using System.Collections.Generic;
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
                Encoding.UTF8.GetString((await WebModule.Instance.DownloadRawFile(url)).Item2)
                );
            var cacheKey = "CPP-" + Info.Name;
            CacheModule.Instance.SetObject(cacheKey, "info", Info);
            Logger.Log($"Provider Name: " + Info.Name);
            Logger.Log($"Packages: ");
            foreach(var v in Info.Packages)
            {
                PackageBase? pack = null;
                if (v.PurpleUri != null)
                {
                    Logger.Log($"From URL: " + v.PurpleUri);
                    var data = JsonUtils.ToObject<PackageBase>(
                        Encoding.UTF8.GetString((await WebModule.Instance.DownloadRawFile(
                            v.PurpleUri.ToString()
                            )).Item2)
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
                    CacheModule.Instance.SetObject(cacheKey, "p." + pack.Value.Name);
                    packages[pack.Value.Name] = pack;
                }
            }

            return true;
        }
    }
}
