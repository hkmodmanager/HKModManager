using HKMM.Pack;
using HKMM.Pack.Metadata;
using HKMM.Pack.Metadata.HKMM;
using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Interop
{
    [JSExport]
    public sealed class PackageDisplay
    {
        public HKMMHollowKnightPackageDefV1 package = null!;
        public PackageDisplay Check()
        {
            if(package == null)
            {
                throw new NotSupportedException();
            }
            return this;
        }
        public bool IsImportant => (package is HKMMHollowKnightPackageDefV1 v1) && v1.IsImportant;
        public string Name => package.Value.Name;
        public string Description => package.Value.Description;
        public string Type => package.Type == TypeEnum.Mod ? "Mod" : "ModPack";
        public string DisplayName => string.IsNullOrEmpty(package.DisplayName) ? 
            Name : package.DisplayName;
        public string Version => package.Version ?? "0.0.0.0";
        public string[] Authors => package.Value.Authors ?? Array.Empty<string>();
        public string[] Tags => package.Tags ?? Array.Empty<string>();
        public string? Repository => package.Value.Repository;
        public double Date => new TimeSpan(package.PublishDateCS.Ticks).TotalMilliseconds;
        public string Owner => "";
        public string Icon => package.Icon ?? "";
        public string[] Dependencies => package.GetAllDependencies(false).ToArray();
        public bool AllowToggle => package.AllowToggle;
        public bool AllowInstall => package.AllowInstall;
        public bool AllowUninstall => package.AllowUninstall;

        public Task Install()
        {
            return JS.ToCS(async () =>
            {
                Logger.Where();
                await LocalPackManager.Instance.InstallHKPackage(false, package);
            });
        }
    }
}
