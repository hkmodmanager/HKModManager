
using HKMM.Interop;
using HKMM.Modules;
using HKMM.Pack.Metadata;
using HKMM.Tasks;
using HKMM.Utils;
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace HKMM.Pack.Installer
{
    public class PackInstaller<T> : PackInstaller where T : PackInstaller<T>, new()
    {
        private static T? _instance;
        public static T Instance => _instance ??= new();
        public PackInstaller()
        {
            _instance = (T)this;
        }
    }
    [JsonConverter(typeof(InstallerUtils.PackInstallerConverter))]
    public class PackInstaller
    {
        public static readonly PackInstaller DefaultInstaller = new();
        public record class InstalledFileInfo(string Path, string RelativePath, SHA256Tuple SHA256);
        public record class FileInfo(string Root, string RelativeRoot, string Link, string OverwriteName = "");
        private string? _modsRoot;

        public string ModsRoot
        {
            get
            {
                return string.IsNullOrEmpty(_modsRoot) ? JS.Api.GetModStorePath() : _modsRoot;
            }
            set
            {
                _modsRoot = value;
            }
        }
        public PackContext Context { get; set; } = PackContext.rootContext;
        public virtual string GetModRoot(string name) => Path.Combine(ModsRoot, name, HKMMPACK_VERSION_NAME);
        public virtual string GetInstallRoot(string name, InstallationRoot root) => root switch
        {
            InstallationRoot.Saves => Path.Combine(GetModRoot(name), HKMMPACK_SAVEROOT_NAME),
            InstallationRoot.Mods => Path.Combine(GetModRoot(name), HKMMPACK_MODSROOT_NAME),
            _ => throw new NotSupportedException()
        };
        public virtual string GetRelativeRoot(InstallationRoot root) => root switch
        {
            InstallationRoot.Saves => HKMMPACK_SAVEROOT_NAME,
            InstallationRoot.Mods => HKMMPACK_MODSROOT_NAME,
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
                    result.Add(new(Path.Combine(GetInstallRoot(def.Name, 
                        InstallationRoot.Mods), def.Name), GetRelativeRoot(InstallationRoot.Mods), link));
                }
            }
            if(def.AdditionalAssets != null)
            {
                foreach(var asset in def.AdditionalAssets)
                {
                    var root = GetInstallRoot(def.Name, asset.InstallRootDir);
                    var rr = GetRelativeRoot(asset.InstallRootDir);
                    if(!string.IsNullOrEmpty(asset.InstallPath))
                    {
                        root = Path.Combine(root, asset.InstallPath);
                        rr = Path.Combine(rr, asset.InstallPath);
                    }
                    result.Add(new(root, rr, asset.DownloadUrl));
                }
            }
            return result;
        }
        
        public virtual async Task<List<InstalledFileInfo>> DownloadFilesAndUncompress(FileInfo info)
        {
            Logger.Log($"Downloading modpack file: {info}");
            var result = new List<InstalledFileInfo>();
            Directory.CreateDirectory(info.Root);
            (string, byte[]) f;
            if (info.Link.StartsWith("local:"))
            {
                var p = info.Link[6..];
                f = (Path.GetFileName(p), await File.ReadAllBytesAsync(p));
            }
            else
            {
                f = await WebModule.Instance.DownloadRawFile(info.Link);
            }
                
            if(Path.GetExtension(f.Item1) .Equals(".zip", StringComparison.OrdinalIgnoreCase))
            {
                using var zip = new ZipArchive(new MemoryStream(f.Item2), ZipArchiveMode.Read);
                foreach(var e in zip.Entries)
                {
                    if (e.FullName.EndsWith('/') || e.FullName.EndsWith('\\')) continue;
                    var fp = Path.Combine(info.Root, e.FullName);
                    Directory.CreateDirectory(Path.GetDirectoryName(fp)!);

                    e.ExtractToFile(fp, true);

                    Logger.Log($"Got file {fp}");

                    result.Add(new(fp, Path.Combine(info.RelativeRoot, e.FullName), 
                        SHA256Module.Instance.CalcSHA256Tuple(File.ReadAllBytes(fp))));
                }
                return result;
            }
            {
                var fn = string.IsNullOrEmpty(info.OverwriteName) ? f.Item1 : info.OverwriteName;
                var fp = Path.Combine(info.Root, fn);
                Logger.Log($"Got file {fp}");
                await File.WriteAllBytesAsync(fp, f.Item2);
                using var s = File.OpenRead(fp);
                result.Add(new(fp, Path.Combine(info.RelativeRoot, fn), SHA256Module.Instance.CalcSHA256Tuple(s)));
            }
            return result;
        }

        public virtual async Task<HKMMPackage> InstallHKPackageUnsafe(CSHollowKnightPackageDef def,
            Task[] waitTasks)
        {
            if(this != GameInjectInstaller.Instance)
            {
                GameInjectInstaller.TryInstallGameInject();
            }

            var p = def.ToHKMMPackageDef();
            Logger.Log($"Installing {p.Name}(v{p.Version})");
            if(p.Installer != null && p.Installer != this)
            {
                Logger.Log($"Use custom installer");
                var result = await p.Installer.InstallHKPackageUnsafe(def, waitTasks);
                RecordInstalledPack(result);
                return result;
            }
            
            var pack = new HKMMPackage();
            var files = GetAllFiles(def);
            pack.Info = def.ToHKMMPackageDef();
            pack.InstallDate = DateTime.UtcNow;
            pack.InstallPath = GetModRoot(def.Name);
            var f = new List<InstalledFileInfo>();
            foreach (var file in files)
            {
                f.AddRange(await DownloadFilesAndUncompress(file));
            }
            pack.InstalledFiles = f.ToArray();
            if (waitTasks != null)
            {
                Logger.Log("Waiting for dependencies installation to complete");
                await Task.WhenAll(waitTasks);
            }
            pack.Save();
            RecordInstalledPack(pack);
            Logger.Log($"Successfully installed {p.Name}({p.Version})");
            return pack;
        }

        public virtual async Task<HKMMPackage> InstallHKPackage(bool isDev, CSHollowKnightPackageDef def)
        {
            Logger.Where();

            await LocalPackManager.Instance.LoadLocalPacks();

            Logger.Where();

            var packs = GetAndSortPackages(ParseDependencies(isDev, def));

            Logger.Where();
            HKMMPackage result = null!;
            var tasklist = new List<Task>();
            Logger.Log("All modpack: " + string.Join(';', packs.Select(x => x.Value.Name)));
            foreach(var pack in packs)
            {
                Logger.Where();
                var p = pack.ToHKMMPackageDef();
                if (IsInstalled(p))
                {
                    Logger.Log($"Skip existing pack: {p.Name}(v{p.Version})");
                    continue;
                }
                Logger.Where();
                var tl = tasklist.ToArray();
                tasklist.Add(SingleTask(() =>
                {
                    return TaskManager.StartTask($"Install {p.DisplayName ?? p.Name}", async () =>
                    {
                        var r = await InstallHKPackageUnsafe(p, tl);
                        if (r is null || !IsInstalled(p))
                        {
                            throw new InvalidOperationException(
                                $"Unable to install {p.Name}({p.Version})");
                        }
                        if (p.Name == def.Name)
                        {
                            result = r;
                        }
                    });
                }, $"{p.Name}_{p.Version}"));
            }
            await Task.WhenAll(tasklist);
            return result;
        }

        public virtual bool MakeSureCorrectInstaller(HKMMPackage pack, Action<PackInstaller> noThis)
        {
            var p = pack.GetInstaller();
            if(p != null && p != this)
            {
                noThis(p);
                return true;
            }
            return false;
        }
        public virtual bool MakeSureCorrectInstaller<T>(HKMMPackage pack, out T result,
            Func<PackInstaller, T> noThis)
        {
            result = default!;
            var p = pack.GetInstaller();
            if (p != null && p != this)
            {
                result = noThis(p);
                return true;
            }
            return false;
        }

        public virtual void UninstallPack(HKMMPackage pack)
        {
            Logger.Log("Uninstalling modpack:" + pack.InstallPath);
            if(MakeSureCorrectInstaller(pack, i =>
            {
                i.UninstallPack(pack);
            }))
            {
                RemoveInstalledPack(pack.Info.Name);
                return;
            }

            pack.Enabled = false;
            var root = Path.Combine(ModsRoot, pack.Info.Name);
            if(Directory.Exists(root)) Directory.Delete(root, true);
            RemoveInstalledPack(pack.Info.Name);
        }

        public virtual void RecordInstalledPack(HKMMPackage pack)
        {
            LocalPackManager.Instance.RecordInstalledPack(pack);
        }
        public virtual void RemoveInstalledPack(string pack)
        {
            LocalPackManager.Instance.RemoveInstalledPack(pack);
        }

        public virtual bool IsInstalled(CSHollowKnightPackageDef pack)
        {
            return LocalPackManager.Instance.IsInstalled(pack);
        }
        public virtual void SetEnable(HKMMPackage pack, bool enabled)
        {
            if (MakeSureCorrectInstaller(pack, i => i.SetEnable(pack, enabled))) return;

            if (this != GameInjectInstaller.Instance)
            {
                GameInjectInstaller.TryInstallGameInject();
            }

            if (enabled == IsEnabled(pack)) return;
            if (enabled)
            {
                foreach(var dep in pack.Info.GetAllDependencies(false))
                {
                    var loc = LocalPackManager.Instance.FindPack(dep);
                    if(loc == null)
                    {
                        Logger.LogWarning($"Missing dependencies(in {pack.Info.Name}): {dep}");
                    }
                    else
                    {
                        loc.Enabled = true;
                    }
                }
                var p = GetEnabledFilePath(pack.Info.Name);
                Directory.CreateDirectory(Path.GetDirectoryName(p)!);
                File.WriteAllText(p, pack.InstallPath);
            }
            else
            {
                File.Delete(GetEnabledFilePath(pack.Info.Name));
            }
        }
        public virtual string GetEnabledFilePath(string packName)
        {
            return Path.Combine(HKMMPackage.GameModsRoot, packName, HKMMPACK_ENABLED_FILE_NAME);
        }
        public virtual bool IsEnabled(HKMMPackage pack)
        {
            if (MakeSureCorrectInstaller(pack, out var result, i => i.IsEnabled(pack))) return result;
            var p = GetEnabledFilePath(pack.Info.Name);
            if (!File.Exists(p)) return false;
            return Path.GetFullPath(File.ReadAllText(p)) == Path.GetFullPath(pack.InstallPath);
        }
        public virtual void PostProcessingPackage(HKMMPackage pack)
        {
            MakeSureCorrectInstaller(pack, out var result, i => i.IsEnabled(pack));
        }
        public virtual Task<List<HKMMPackage>> GetInstalledPackage(List<HKMMPackage> pack)
        {
            return Task.FromResult(pack);
        }
    }
}
