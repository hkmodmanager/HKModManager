using HKMM.Interop;
using HKMM.Modules;
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
                FileModule.Instance.WriteText(p, JsonUtils.ToJSON(pack));
            }
        }
        public static readonly LocalCustomPackagesProvider instance = new();
        protected override Task<bool> TryInit()
        {
            LoadPackages();
            return Task.FromResult(true);
        }
    }
}
