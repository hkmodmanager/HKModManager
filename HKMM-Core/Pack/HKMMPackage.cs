using HKMM.Pack.Legacy;
using HKMM.Pack.Metadata;
using HKMM.Pack.Metadata.HKMM;
using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using static HKMM.Pack.Installer.PackInstaller;

namespace HKMM.Pack
{
    [JSExport]
    public class HKMMPackage
    {
        public static int CURRENT_PACKAGE_VERSION { get; } = 1;

        public int PackageVersion { get; set; } = CURRENT_PACKAGE_VERSION;
        public HKMMHollowKnightPackageDefV1 Info { get; set; } = new();

        public string InstallPath { get; set; } = "";
        public Version Version => new(Info.Version);
        public DateTime InstallDate { get; set; } = DateTime.UtcNow;
        public double InstallDateJS => InstallDate.Subtract(DateTime.MinValue).TotalMilliseconds;

        public InstalledFileInfo[] InstalledFiles { get; set; } = Array.Empty<InstalledFileInfo>();

        public static implicit operator CSHollowKnightPackageDef(HKMMPackage pack)
        {
            return pack.Info;
        }

        public static HKMMHollowKnightPackageDefV1 FromModLegacyToHKMM(LegacyModInfoFull mod)
        {
            var hpm = new HKMMHollowKnightPackageDefV1
            {
                Name = mod.Name,
                Description = mod.Desc,
                Dependencies = mod.Dependencies,
                Authors = mod.Authors,
                Version = mod.Version,
            };
            if (!string.IsNullOrEmpty(mod.Repository)) hpm.Repository = mod.Repository;
            if (!string.IsNullOrEmpty(mod.Link)) hpm.ReleaseAssets = mod.Link;
            return hpm.ToHKMMPackageDef();
        }

        public static HKMMPackage FromLocalModLegacy(LegacyLocalModInfo mod)
        {
            var pack = new HKMMPackage
            {
                Info = FromModLegacyToHKMM(mod.Modinfo).ToHKMMPackageDef()
            };
            return pack;
        }
    }
}
