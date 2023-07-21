using HKMM.Interop;
using HKMM.Modules;
using HKMM.Pack.Installer;
using HKMM.Pack.Legacy;
using HKMM.Pack.Metadata;
using HKMM.Pack.Metadata.HKMM;
using HKMM.Utils;
using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using System.Xml.Linq;
using static HKMM.Pack.Installer.PackInstaller;

namespace HKMM.Pack
{

    public class HKMMPackage : ICustomInstallerProvider
    {
        public static string GameModsRoot => Path.Combine(Settings.Instance.GamePath,
            "hollow_knight_Data", "Managed", "Mods");

        public static int CURRENT_PACKAGE_VERSION { get; } = 1;

        public int PackageVersion { get; set; } = CURRENT_PACKAGE_VERSION;
        public HKMMHollowKnightPackageDefV1 Info { get; set; } = new();

        public string InstallPath { get; set; } = "";
        public Version Version => new(Info.Version);
        public DateTime InstallDate { get; set; } = DateTime.UtcNow;
        public double InstallDateJS => InstallDate.Subtract(DateTime.MinValue).TotalMilliseconds;
        [JsonIgnore]
        public bool IsValid { get; set; } = true;
        public InstalledFileInfo[] InstalledFiles { get; set; } = Array.Empty<InstalledFileInfo>();

        public static implicit operator CSHollowKnightPackageDef(HKMMPackage pack)
        {
            return pack.Info;
        }

        public static HKMMHollowKnightPackageDefV1 FromModLegacyToHKMM(LegacyModInfoFull mod)
        {
            var hpm = new HKMMHollowKnightPackageDefV1
            {
                Name = mod.Name,
                Description = mod.Desc,
                Dependencies = mod.Dependencies,
                Authors = mod.Authors,
                Version = mod.Version,
                Tags = mod.Tags
            };
            if (!string.IsNullOrEmpty(mod.Repository)) hpm.Repository = mod.Repository;
            if (!string.IsNullOrEmpty(mod.Link)) hpm.ReleaseAssets = mod.Link;
            return hpm.ToHKMMPackageDef();
        }

        public static async Task<HKMMPackage> FromLocalModLegacy(LegacyLocalModInfo mod)
        {
            var pack = new HKMMPackage
            {
                Info = FromModLegacyToHKMM(mod.Modinfo).ToHKMMPackageDef(),
                InstallDate = DateTime.UtcNow,
                InstallPath = DefaultInstaller.GetModRoot(mod.Name)
            };
            var imp = Path.Combine(DefaultInstaller.GetInstallRoot(mod.Name, InstallationRoot.Mods), mod.Name);
            var rmp = Path.Combine(DefaultInstaller.GetRelativeRoot(InstallationRoot.Mods), mod.Name);

            var files = new List<InstalledFileInfo>();
            foreach(var f in Directory.GetFiles(mod.Path, "*", SearchOption.AllDirectories))
            {
                var rp = Path.GetRelativePath(mod.Path, f);
                var dp = Path.Combine(imp, rp);
                Directory.CreateDirectory(Path.GetDirectoryName(dp)!);
                var data = await FileModule.Instance.ReadBytesAsync(f);
                var wt = FileModule.Instance.WriteBytesAsync(dp, data);
                var fi = new InstalledFileInfo(dp, Path.Combine(rmp, rp),
                    SHA256Module.Instance.CalcSHA256Tuple(data));
                await wt;
                files.Add(fi);
            }
            pack.InstalledFiles = files.ToArray();
            pack.Save();
            return pack;
        }

        public void Save()
        {
            var root = InstallPath;
            Directory.CreateDirectory(root);
            FileModule.Instance.WriteText(Path.Combine(root, PACK_METADATA_FILE_NAME),
                JsonSerializer.Serialize(this, Converter.Settings));
        }
        public static bool Exists(string name)
        {
            return File.Exists(Path.Combine(DefaultInstaller.GetModRoot(name), PACK_METADATA_FILE_NAME));
        }
        public static async Task<HKMMPackage?> From(string name, bool noThrow = false)
        {
            var root = Path.Combine(JS.Api.GetModStorePath(), name);

            var p = Path.Combine(root, HKMMPACK_VERSION_NAME);
            Directory.CreateDirectory(p);
            var md = Path.Combine(p, PACK_METADATA_FILE_NAME);
            if(File.Exists(md))
            {
                var r = JsonUtils.ToObject<HKMMPackage>(await File.ReadAllTextAsync(md));
                if (r is null)
                {
                    if (noThrow) return null;
                    throw new InvalidDataException($"Invalid HKMMPackage: {md}");
                }
                r.InstallPath = p;

                return r;
            }

            var latest = Directory.GetDirectories(root, "*.*.*.*")
                .Select(x => Path.GetFileName(x))
                .Where(x => Version.TryParse(x, out _))
                .Select(x => new Version(x))
                .Max(x => x);

            if(latest is null)
            {
                if (noThrow) return null;
                throw new InvalidOperationException($"The specified HKMMPackage: '{name}' was not found");
            }
            var ln = latest.ToString(4);
            var lroot = Path.Combine(root, ln);
            var lmi = JsonUtils.ToObject<LegacyLocalModInfo>(
                File.ReadAllText(Path.Combine(lroot, "modversion.json")));

            var result = await FromLocalModLegacy(lmi);
            result.InstallPath = p;
            result.Save();
            return result;
        }

        
        [JsonIgnore]
        public bool Enabled
        {
            get => GetInstaller().IsEnabled(this);
            set => GetInstaller().SetEnable(this, value);
        }

        private PackInstaller? _installer;

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("installerType")]
        public PackInstaller? Installer
        {
            get => _installer;
            set
            {
                if (value == _installer) return;
                _installer = value;
                value?.PostProcessingPackage(this);
            }
        }
        public PackInstaller GetInstaller() => Installer ?? Info.Installer ?? DefaultInstaller;
    }
}
