

namespace GameInject;

static partial class Main
{
    public static readonly string ModPath = Path.Combine(Application.dataPath, "Managed", "Mods");
    public static readonly Dictionary<string, string> fake2realPath = new();
    public static readonly Dictionary<string, string> get_location_redirect = new();
    public static readonly Dictionary<string, string> real2fakePath = new();
    public static readonly Dictionary<string, List<string>> fake2realDir = new();
    public static Config config = null!;
    public static bool CheckAPI()
    {
        var mh = typeof(HeroController).Assembly.GetType("Modding.ModHooks");
        if (mh is null) return false;
        var ver = mh.GetField("_modVersion", BindingFlags.Static | BindingFlags.NonPublic);
        if (ver is null) return false;
        var v = (int)ver.GetValue(null);
        if (v < 72)
        {
            Debug.LogError("Modding API is too old");
            return false;
        }
        return true;
    }
    public static bool LoadConfig()
    {
        var cp = Path.Combine(Path.GetDirectoryName(typeof(HeroController).Assembly.Location), "hkmm-gameinject.json");
        if (!File.Exists(cp))
        {
            Debug.LogError("Not found hkmm-gameinject.json");
            return false;
        }
        try
        {
            config = JsonConvert.DeserializeObject<Config>(File.ReadAllText(cp))!;
        }
        catch (Exception e)
        {
            Debug.LogError(e);
            return false;
        }
        return true;
    }
    public static bool ShouldLoad()
    {
        if (!CheckAPI()) return false;
        if (!LoadConfig()) return false;
        if (!Directory.Exists(config.internalLibPath))
        {
            Debug.Log("HKMM is uninstalled");
            return false;
        }
        if (!Directory.Exists(config.modsPath))
        {
            return false;
        }
        return true;
    }
    public static void Log(string msg)
    {
        if (!config.outputLog)
        {
            Debug.Log(msg);
        }
    }
    public static void ScanModPacks()
    {
        List<string> packs = new();
        foreach (var p in Directory.EnumerateDirectories(ModPath))
        {
            var statusPath = Path.Combine(p, "HKMM-PACKENABLED");
            if (!File.Exists(statusPath)) continue;
            packs.Add(Path.GetFullPath(File.ReadAllText(statusPath, Encoding.UTF8)));
            Debug.Log($"Found enabled modpack: {p}");
        }
        foreach (var v in packs)
        {
            if (!Directory.Exists(v) ||
                !v.StartsWith(config.modsPath, StringComparison.OrdinalIgnoreCase)) continue;
            var mmp = Path.Combine(v, "ModPackMetadata.json");
            if (!File.Exists(mmp)) continue;
            var md = JsonConvert.DeserializeObject<ModMetadata>(File.ReadAllText(mmp))!;
            foreach ((var realPath, var rp) in md.InstalledFiles)
            {
                var fakePath = rp;
                if (rp.StartsWith("ModsRoot"))
                {
                    fakePath = Path.Combine(ModPath, rp.Substring(9));
                }
                else if (rp.StartsWith("SaveRoot"))
                {
                    fakePath = Path.Combine(Application.persistentDataPath, rp.Substring(9));
                }
                fakePath = Path.GetFullPath(fakePath);

                Log($"Redirect {fakePath} -> {realPath}");

                var r = Path.GetFullPath(realPath);

                fake2realPath[fakePath] = r;
                real2fakePath[r] = fakePath;
                fake2realPath[Path.GetDirectoryName(fakePath)] = Path.GetDirectoryName(r);

                var fakeDir = Path.GetDirectoryName(fakePath);
                var realDir = Path.GetDirectoryName(r);
                while (!string.IsNullOrEmpty(fakeDir) && !string.IsNullOrEmpty(realDir))
                {
                    if (!fake2realDir.TryGetValue(fakeDir, out var targets))
                    {
                        try
                        {
                            Directory.CreateDirectory(fakeDir);
                        } catch(Exception)
                        {

                        }
                        targets = new();
                        fake2realDir[fakeDir] = targets;
                    }
                    if (!targets.Contains(realDir))
                    {
                        targets.Add(realDir);
                    }

                    fakeDir = Path.GetDirectoryName(fakeDir);
                    realDir = Path.GetDirectoryName(realDir);
                }

                if (Path.GetExtension(fakePath).EndsWith("dll", StringComparison.OrdinalIgnoreCase))
                {
                    get_location_redirect[r] = fakePath;
                }
            }
        }
    }
    static void M0()
    {
        ModLoaderR.TryAddModInstance(typeof(HKMMLoader), new()
        {
            Mod = (ModR)(object)new HKMMLoader(),
            Enabled = true,
            Error = null,
            Name = "Hollow Knight Mod Manager"
        });
    }
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterAssembliesLoaded)]
    public static void Init()
    {
        if (!ShouldLoad()) return;
        ScanModPacks();

        InitHooks();

        try
        {
            M0();
        }
        catch (Exception e)
        {
            Debug.LogError(e);
        }
    }


}
