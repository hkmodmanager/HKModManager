using HKMM.Interop;
using HKMM.Pack.Installer;
using HKMM.Pack.Metadata;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Pack
{
    public class LocalPackManager : PackInstaller
    {
        public readonly static new LocalPackManager DefaultInstaller = new()
        {
            Context = new()
        };
        public readonly Dictionary<string, HKMMPackage> mods = new();
        public Task LoadLocalPacks()
        {
            return SingleTask(async () =>
            {
                var m = new List<HKMMPackage>();
                var msp = JS.Api.GetModStorePath();
                Logger.Log("Find mods in " + msp);
                foreach (var mod in Directory.GetDirectories(msp))
                {
                    var modname = Path.GetFileName(mod);
                    var pack = await HKMMPackage.From(modname, true);
                    if (pack is null) continue;
                    m.Add(pack);
                }
                Logger.Log($"Successfully loaded {m.Count} modpacks");
                lock (mods)
                {
                    mods.Clear();
                    foreach (var mod in m)
                    {
                        mods.Add(mod.Info.Name, mod);
                    }
                }
                
            }, nameof(LoadLocalPacks));
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
