using HKMM.Pack;
using HKMM.Pack.Installer;
using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Interop
{
    [JSExport]
    public class LocalPackageProxy
    {
        public HKMMPackage package = null!;
        public LocalPackageProxy Check()
        {
            if(package == null)
            {
                throw new NotSupportedException();
            }
            return this;
        }
        private PackageDisplay? display;
        public PackageDisplay Info => display ??= new()
        {
            package = package.Info
        };
        public string InstallPath => JS.ToCS(() => package.InstallPath);
        public bool Enabled
        {
            get => JS.ToCS(() => package.Enabled); set => JS.ToCS(() => package.Enabled = value);
        }
        public void Uninstall()
        {
            JS.ToCS(() =>
            {
                LocalPackManager.Instance.UninstallPack(package);
            });
        }
        public double InstallDate => package.InstallDateJS;

        public static LocalPackageProxy? GetMod(string name)
        {
            return JS.ToCS<LocalPackageProxy?>(() => {
                Logger.Where();
                return LocalPackManager.Instance.mods.TryGetValue(name, out var p) ? new() { package = p } : null;
            });
        }
        public static Task<LocalPackageProxy[]> GetAllMods()
        {
            return JS.ToCS(async () =>
            {
                Logger.Where();
                await LocalPackManager.Instance.LoadLocalPacks();
                Logger.Where();
                return LocalPackManager.Instance.mods.Values
                    .Select(x => new LocalPackageProxy() { package = x })
                    .ToArray();
            });
        }
    }
}
