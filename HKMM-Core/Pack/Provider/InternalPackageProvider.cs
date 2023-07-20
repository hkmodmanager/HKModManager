using HKMM.Interop;
using HKMM.Pack.Installer;
using HKMM.Pack.Metadata.HKMM;
using HKMM.Utils;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Pack.Provider
{
    public class InternalPackageProvider : PackContext
    {
        public override string Name => "Internal Package Provider";

        public readonly static InternalPackageProvider instance = new();
        public static readonly HKMMHollowKnightPackageDefV1 MP_GameInject = new() {
            Name = MODPACK_NAME_GAME_INJECT,
            Version = (NetUtils.GetAssemblyVersion(
                    Path.Combine(JS.Api.GetGameInjectRoot(), GAMEINJECT_DLL_NAME)
                    ) ?? throw new InvalidProgramException()).ToString(),
            DisplayName = "ModPack Loader",
            Icon = "internal-icons://defaultmod.svg",
            Description = "",
            AllowUninstall = false,
            AllowToggle = false,
            Repository = "https://github.com/hkmodmanager/HKModManager",
            IsImportant = true
        };

        protected override Task<bool> TryInit()
        {
            var pack = MP_GameInject;
            pack.Installer = InstallerUtils.GetInstaller(INSTALLER_GAMEINJECT_NAME);

            packages.Add(MODPACK_NAME_GAME_INJECT, pack);
            return Task.FromResult(true);
        }
    }
}
