using HKMM.Interop;
using HKMM.Modules;
using HKMM.Pack.Installer;
using HKMM.Pack.Metadata;
using HKMM.Pack.Metadata.HKMM;
using HKMM.Tasks;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Pack.Provider
{
    public class ApiLinksPackageProvider : PackContext
    {
        public override string Name => "API";
        public readonly static ApiLinksPackageProvider instance = new();
        protected override async Task<bool> TryInit()
        {
            IsHidden = true;
            await TaskManager.StartTask("Fetch ApiLinks", async () =>
            {
                var text = 
                    Encoding.UTF8.GetString(
                        (await WebModule.Instance.DownloadRawFile(@"https://github.com/hk-modding/modlinks/raw/main/ApiLinks.xml")).Item2
                        );
                
                var api = await JS.Api.ParseAPILink(text);
                var pack = HKMMPackage.FromModLegacyToHKMM(api);
                pack.Name = MODPACK_NAME_MODDING_API;
                pack.Icon = @"internal-icons://moddingapi.png";
                pack.DisplayName = "Modding API";
                pack.Description = "A Hollow Knight Modding API/loader.";
                pack.AllowToggle = false;
                pack.Installer = new MAPIInstaller();
                packages.Add(MODPACK_NAME_MODDING_API, pack);
            });
            return true;
        }
    }
}
