using HKMM.Pack.Metadata;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Pack.Installer
{
    internal class MAPIInstaller : PackInstaller
    {
        public static bool CanUninstall => File.Exists(BackupPath) && NetUtils.GetAPIVersion(BackupPath) <= 0;
        public static string ManagedPath => Path.Combine(HKMMPackage.GameModsRoot, "..");
        public static string APIPath => Path.Combine(ManagedPath, API_FILE_NAME);
        public static string BackupPath => Path.Combine(ManagedPath, API_BACKUP_FILE_NAME);
        public override void UninstallPack(HKMMPackage pack)
        {
            pack.Info.AllowUninstall = CanUninstall;
            if (!pack.Info.AllowUninstall)
            {
                throw new InvalidOperationException("The original assembly backup is missing or contaminated");
            }

            base.UninstallPack(pack);
        }
        public override async Task<HKMMPackage> InstallHKPackageUnsafe(CSHollowKnightPackageDef def, 
            Task[] waitTasks)
        {
            var orig = NetUtils.GetAPIVersion(APIPath);
            if(orig <= 0)
            {
                Logger.Log("Create backup");
                File.Copy(APIPath, BackupPath, true);
            }
            
            var result = await base.InstallHKPackageUnsafe(def, waitTasks);
            result.Info.AllowUninstall = CanUninstall;
            if (!result.Info.AllowUninstall)
            {
                Logger.LogWarning("The original assembly backup is missing or contaminated");
            }
            return result;
        }
    }
}
