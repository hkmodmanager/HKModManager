using HKMM.Interop;
using HKMM.Modules;
using HKMM.Pack.Installer;
using HKMM.Pack.Metadata;
using HKMM.Pack.Metadata.HKMM;
using HKMM.Parser;
using HKMM.Tasks;
using HKMM.Utils;
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

        public static void EditPackage(HKMMHollowKnightPackageDefV1 pack)
        {
            pack.Dependencies = Array.Empty<string>();
            pack.Name = MODPACK_NAME_MODDING_API;
            pack.Icon = @"internal-icons://moddingapi.png";
            pack.DisplayName = "Modding API";
            pack.Description = "A Hollow Knight Modding API/loader.";
            pack.AllowToggle = false;
            pack.Repository = "https://github.com/hk-modding/api";
            pack.Installer = InstallerUtils.GetInstaller(INSTALLER_MAPI_NAME);
            pack.IsImportant = true;
        }
        protected override async Task<bool> TryInit()
        {
            IsHidden = true;
            var text = await WebModule.Instance.DownloadTextFile(
                @"https://github.com/hk-modding/modlinks/raw/main/ApiLinks.xml");

            var pack = ApiLinksParser.ParseApiLinks(text);
            EditPackage(pack);
            CacheModule.Instance.SetObject("APP", "p.Info", pack);
            packages.Add(MODPACK_NAME_MODDING_API, pack);
            return true;
        }
    }
}
