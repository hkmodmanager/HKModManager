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
        public string InstallPath => package.InstallPath;
        public bool Enabled
        {
            get => package.Enabled; set => package.Enabled = value;
        }
        public void Uninstall()
        {
            Logger.Where();
            LocalPackManager.DefaultInstaller.UninstallPack(package);
        }
        public double InstallDate => package.InstallDateJS;

        public static LocalPackageProxy? GetMod(string name)
        {
            Logger.Where();
            return LocalPackManager.DefaultInstaller.mods.TryGetValue(name, out var p) ? new() { package = p } : null;
        }
        public static async Task<LocalPackageProxy[]> GetAllMods()
        {
            Logger.Where();
            await LocalPackManager.DefaultInstaller.LoadLocalPacks();
            return LocalPackManager.DefaultInstaller.mods.Values
                .Select(x => new LocalPackageProxy() { package = x })
                .ToArray();
        }
    }
}
