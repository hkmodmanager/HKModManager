using HKMM.Pack.Metadata;
using HKMM.Pack.Metadata.HKMM;
using HKMM.Pack.Provider;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Pack.Installer
{
    internal class MAPIInstaller : PackInstaller<MAPIInstaller>
    {
        public static bool CanUninstall => File.Exists(BackupPath) && NetUtils.GetAPIVersion(BackupPath) <= 0;
        public static string ManagedPath => Path.Combine(HKMMPackage.GameModsRoot, "..");
        public static string APIPath => Path.Combine(ManagedPath, API_FILE_NAME);
        public static string BackupPath => Path.Combine(ManagedPath, API_BACKUP_FILE_NAME);
        public override void PostProcessingPackage(HKMMPackage pack)
        {
            var ver = NetUtils.GetAPIVersion(APIPath);
            if (ver <= 0)
            {
                pack.IsValid = false;
                return;
            }
            pack.IsValid = true;
            pack.Info.Version = $"{ver}.0.0.0";
            pack.Info.AllowUninstall = CanUninstall;
        }
        public override async Task<List<HKMMPackage>> GetInstalledPackage(List<HKMMPackage> pack)
        {
            var ver = NetUtils.GetAPIVersion(APIPath);
            if (ver <= 0)
            {
                return pack;
            }
            HKMMHollowKnightPackageDefV1? info;
            try
            {
                await ApiLinksPackageProvider.instance.MakeSureInit();
                info = ApiLinksPackageProvider.instance.FindPack(MODPACK_NAME_MODDING_API)?.ToHKMMPackageDef();
            } catch(Exception)
            {
                info = new();
                ApiLinksPackageProvider.EditPackage(info);
            }
            if(info == null)
            {
                return pack;
            }
            var p = new HKMMPackage()
            {
                Info = info,
                InstallDate = DateTime.MinValue
            };

            pack.Add(p);
            return pack;
        }
        public override void UninstallPack(HKMMPackage pack)
        {
            pack.Info.AllowUninstall = CanUninstall;
            if (!pack.Info.AllowUninstall)
            {
                throw new InvalidOperationException("The original assembly backup is missing or contaminated");
            }
            File.Copy(BackupPath, APIPath, true);
            base.UninstallPack(pack);
        }
        public override bool IsEnabled(HKMMPackage pack)
        {
            return NetUtils.GetAPIVersion(APIPath) > 0;
        }
        public override void SetEnable(HKMMPackage pack, bool enabled)
        {
            throw new NotSupportedException();
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
            foreach(var file in result.InstalledFiles)
            {
                File.Copy(file.Path, Path.Combine(ManagedPath, Path.GetFileName(file.Path)), true);
            }
            if (!result.Info.AllowUninstall)
            {
                Logger.LogWarning("The original assembly backup is missing or contaminated");
            }
            return result;
        }
    }
}
