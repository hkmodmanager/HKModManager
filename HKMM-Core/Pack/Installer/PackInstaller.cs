
using HKMM.Modules;
using HKMM.Pack.Metadata;
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Pack.Installer
{
    public class PackInstaller
    {
        public record class InstalledFileInfo(string Path, string RelativePath, SHA256Tuple SHA256);
        public record class FileInfo(string Root, string Link, string OverwriteName = "");
        public string ModsRoot { get; set; } = "";
        public string SaveRoot { get; set; } = "";
        public PackContext Context { get; set; } = null!;

        public virtual string GetInstallRoot(InstallationRoot root) => root switch
        {
            InstallationRoot.Saves => SaveRoot,
            InstallationRoot.Mods => ModsRoot,
            _ => throw new NotSupportedException()
        };
        public virtual PackDependencies ParseDependencies(bool dev = false, 
            params PackageBase[] entries)
        {
            var dict = new PackDependencies();
            foreach(var v in entries)
            {
                ParseDependencies(v, dev, dict);
            }
            return dict;
        }
        public virtual PackDependencies ParseDependencies(PackageBase entry,
            bool dev = false,
            PackDependencies? dict = null
            )
        {
            dict ??= new();
            if (dict.ContainsKey(entry)) return dict;

            var list = new List<PackageBase>();
            dict[entry] = list;

            foreach(var dep in entry.GetAllDependencies(dev))
            {
                var d = Context.FindPack(dep);
                if(d != null)
                {
                    list.Add(d);
                }
            }

            return dict;
        }
        public virtual List<PackageBase> GetAndSortPackages(PackDependencies pack)
        {
            var s = pack.SelectMany(x => x.Value.Append(x.Key)).Distinct().ToList();
            s.Sort((a,b) =>
            {
                if (pack.TryGetValue(a, out var dl) && dl.Contains(b)) return 1;
                if (pack.TryGetValue(b, out dl) && dl.Contains(a)) return -1;
                return 0;
            });
            return s;
        }

        public virtual List<FileInfo> GetAllFiles(PackageBase d)
        {
            var def = d.Value;
            var result = new List<FileInfo>();
            if(def.ReleaseAssets != null)
            {
                var ra = def.ReleaseAssets.Value;
                var link = !string.IsNullOrEmpty(ra.String) ? ra.String : ra.PlatformAssets?.Win32;
                if(!string.IsNullOrEmpty(link))
                {
                    result.Add(new(Path.Combine(GetInstallRoot(InstallationRoot.Mods), def.Name), link));
                }
            }
            if(def.AdditionalAssets != null)
            {
                foreach(var asset in def.AdditionalAssets)
                {
                    var root = GetInstallRoot(asset.InstallRootDir);
                    if(!string.IsNullOrEmpty(asset.InstallPath))
                    {
                        root = Path.Combine(root, asset.InstallPath);
                    }
                    result.Add(new(root, asset.DownloadUrl));
                }
            }
            return result;
        }

        public virtual async Task<List<InstalledFileInfo>> DownloadFilesAndUncompress(FileInfo info)
        {
            var result = new List<InstalledFileInfo>();
            if(Directory.Exists(info.Root))
            {
                Directory.CreateDirectory(info.Root);
            }
            var f = await WebModule.Instance.DownloadRawFile(info.Link);
            if(Path.GetExtension(f.Item1) .Equals(".zip", StringComparison.OrdinalIgnoreCase))
            {
                using var zip = new ZipArchive(new MemoryStream(f.Item2), ZipArchiveMode.Read);
                foreach(var e in zip.Entries)
                {
                    var fp = Path.Combine(info.Root, e.FullName);
                    Directory.CreateDirectory(Path.GetDirectoryName(fp)!);
                    e.ExtractToFile(fp, true);
                    using var s = File.OpenRead(fp);
                    result.Add(new(fp, e.FullName, SHA256Module.Instance.CalcSHA256Tuple(s)));
                }
                return result;
            }
            {
                var fn = string.IsNullOrEmpty(info.OverwriteName) ? f.Item1 : info.OverwriteName;
                var fp = Path.Combine(info.Root, fn);
                File.WriteAllBytes(fp, f.Item2);
                using var s = File.OpenRead(fp);
                result.Add(new(fp, fn, SHA256Module.Instance.CalcSHA256Tuple(s)));
            }
            return result;
        }

        public virtual async Task<HKMMPackage> InstallHKPackageDirect(CSHollowKnightPackageDef def)
        {
            var pack = new HKMMPackage();
            var files = GetAllFiles(def);
            pack.Info = def.ToHKMMPackageDef();
            pack.InstallDate = DateTime.UtcNow;
            var f = new List<InstalledFileInfo>();
            foreach(var file in files)
            {
                f.AddRange(await DownloadFilesAndUncompress(file));
            }
            pack.InstalledFiles = f.ToArray();
            return pack;
        }
    }
}
