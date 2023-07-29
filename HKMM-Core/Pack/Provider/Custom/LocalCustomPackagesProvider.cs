using HKMM.Interop;
using HKMM.Modules;
using HKMM.Pack.Installer;
using HKMM.Pack.Metadata;
using HKMM.Pack.Metadata.HKMM;
using HKMM.Utils;
using K4os.Hash.xxHash;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Pack.Provider.Custom
{
    public class LocalCustomPackagesProvider : PackContext
    {
        public static string SaveDir => Path.Combine(JS.Api.AppDataDir, "LPackages");
        public static string GetPath(string name)
        {
            FileModule.Instance.CreateDirectory(SaveDir);
            return Path.Combine(SaveDir, XXH64.DigestOf(Encoding.UTF8.GetBytes(name)) + ".pack.json");
        }
        public void LoadPackages()
        {
            packages.Clear();
            if (!Directory.Exists(SaveDir)) return;
            foreach(var pack in Directory.GetFiles(SaveDir, "*.pack.json", SearchOption.TopDirectoryOnly))
            {
                var p = JsonUtils.ToObject<HKMMHollowKnightPackageDefV1>(
                    FileModule.Instance.ReadText(pack));
                
                p.IsHidden = true;
                p.Installer = LocalPackInstaller.Instance;
                p.AllowToggle = false;
                packages[p.Name] = p;
            }
        }
        public void SavePackages()
        {
            if(Directory.Exists(SaveDir)) FileModule.Instance.Delete(SaveDir);
            FileModule.Instance.CreateDirectory(SaveDir);
            foreach (var pack in packages)
            {
                var p = GetPath(pack.Key);
                FileModule.Instance.WriteText(p, JsonUtils.ToJSON(pack.Value));
            }
        }
        public HKMMHollowKnightPackageDefV1 CreateNew()
        {
            var pack = new HKMMHollowKnightPackageDefV1
            {
                Name = "$lcp." + Guid.NewGuid().ToString(),
                DisplayName = "New ModPack",
                Type = TypeEnum.ModPack,
                Installer = LocalPackInstaller.Instance,
                IsHidden = true,
                AllowToggle = false,
                Version = "0.0.0.0",
                Description = ""
            };
            packages[pack.Name] = pack;
            SavePackages();
            return pack;
        }
        public HKMMHollowKnightPackageDefV1 GetCurrent()
        {
            HKMMHollowKnightPackageDefV1? result;
            var id = LocalPackManager.Instance.mods.Keys.FirstOrDefault(x => x.StartsWith("$lcp."));
            if(string.IsNullOrEmpty(id) || (result = FindPack(id)?.ToHKMMPackageDef()) == null)
            {
                result = CreateNew();
                _ = LocalPackInstaller.Instance.InstallHKPackage(false, result);
                return result;
            }
            return result;
        }
        public void AddModpack(string name)
        {
            var cur = GetCurrent();
            var dep = cur.Dependencies ?? new();
            dep.StringArray ??= Array.Empty<string>();
            if (dep.StringArray.Contains(name)) return;
            dep.StringArray = dep.StringArray.Append(name).ToArray();
            cur.Dependencies = dep;
            SavePackages();
        }
        public void RemoveModpack(string name)
        {
            var cur = GetCurrent();
            var dep = cur.Dependencies ?? new();
            dep.StringArray ??= Array.Empty<string>();
            if (!dep.StringArray.Contains(name)) return;
            dep.StringArray = dep.StringArray.Where(x => x != name).ToArray();
            cur.Dependencies = dep;
            SavePackages();
        }
        public static readonly LocalCustomPackagesProvider instance = new();
        protected override Task<bool> TryInit()
        {
            LoadPackages();
            return Task.FromResult(true);
        }
    }
}
