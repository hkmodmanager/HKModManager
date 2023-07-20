using HKMM.Interop;
using HKMM.Pack.Installer;
using HKMM.Pack.Metadata;
using HKMM.Utils;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Pack
{
    public class LocalPackManager : PackInstaller<LocalPackManager>
    {
        public readonly Dictionary<string, HKMMPackage> mods = new();
        public Task LoadLocalPacks()
        {
            Logger.Where();
            return SingleTask(async () =>
            {
                var m = new List<HKMMPackage>();
                Logger.Where();
                foreach(var v in InstallerUtils.nameToInstaller)
                {
                    Logger.Where();
                    Logger.Log("Installer: " + v.Key);
                    Logger.Where();
                    if (v.Value == null) continue;
                    try
                    {
                        Logger.Where();
                        await v.Value.GetInstalledPackage(m);
                        Logger.Where();
                    }catch(TimeoutException)
                    {
                        Logger.LogError("Unable to complete GetInstalledPackage: " + v.Key);
                    }
                }
                Logger.Log($"Successfully loaded {m.Count} modpacks", LogLevel.Fine);
                lock (mods)
                {
                    mods.Clear();
                    foreach (var mod in m)
                    {
                        if (mod == null) continue;
                        if(mods.ContainsKey(mod.Info.Name))
                        {
                            //Logger.LogWarning("Duplicate local modpack: " + mod.Info.Name);
                            continue;
                        }
                        mods[mod.Info.Name] = mod;
                    }
                }
                
            }, nameof(LoadLocalPacks));
        }
        public override async Task<List<HKMMPackage>> GetInstalledPackage(List<HKMMPackage> pack)
        {
            var msp = JS.Api.GetModStorePath();
            Logger.Log("Find mods in " + msp);
            foreach (var mod in Directory.GetDirectories(msp))
            {
                var modname = Path.GetFileName(mod);
                var p = await HKMMPackage.From(modname, true);
                if (p is null) continue;
                pack.Add(p);
            }
            return pack;
        }
        public HKMMPackage? FindPack(string name)
        {
            return mods.TryGetValue(name, out var result) ? result : null;
        }
        public override void RecordInstalledPack(HKMMPackage mod)
        {
            lock(mods)
            {
                mods[mod.Info.Name] = mod;
            }
        }
        public override void RemoveInstalledPack(string pack)
        {
            lock(mods)
            {
                mods.Remove(pack);
            }
        }
        public override bool IsInstalled(CSHollowKnightPackageDef pack)
        {
            return mods.TryGetValue(pack.Name, out var p) && p.Version >= new Version(pack.ToHKMMPackageDef().Version); 
        }
    }
}
