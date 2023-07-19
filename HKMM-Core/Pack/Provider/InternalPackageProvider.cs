using HKMM.Pack.Installer;
using HKMM.Pack.Metadata.HKMM;
using HKMM.Utils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Pack.Provider
{
    public class InternalPackageProvider : PackContext
    {
        public readonly static InternalPackageProvider instance = new();
        protected override Task<bool> TryInit()
        {
            var pack = new HKMMHollowKnightPackageDefV1()
            {
                Name = MODPACK_NAME_GAME_INJECT,
                Version = "3.1.0.0",
                DisplayName = "ModPack Loader",
                Icon = "internal-icons://defaultmod.svg",
                Description = "",
                AllowUninstall = false,
                AllowToggle = false,
                Installer = InstallerUtils.GetInstaller(INSTALLER_GAMEINJECT_NAME),
                Repository = "https://github.com/hkmodmanager/HKModManager"
            };

            packages.Add(MODPACK_NAME_GAME_INJECT, pack);
            return Task.FromResult(true);
        }
    }
}
