

namespace GameInject;

static partial class Main
{
    public static readonly string ModPath = Path.Combine(Application.dataPath, "Managed", "Mods");
    public static readonly Dictionary<string, string> redirectPath = new();
    public static readonly Dictionary<string, string> get_location_redirect = new();
    public static readonly Dictionary<string, string> redirectDir = new();
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
    public static void ScanModPacks()
    {
        List<string> packs = new();
        foreach (var p in Directory.EnumerateDirectories(ModPath))
        {
            var statusPath = Path.Combine(p, "HKMM-PACKENABLED");
            if (!File.Exists(statusPath)) continue;
            packs.Add(File.ReadAllText(statusPath, Encoding.UTF8));
            Debug.Log($"Found enabled modpack: {p}");
        }
        foreach (var v in packs)
        {
            if (!Directory.Exists(v) || 
                !v.StartsWith(config.modsPath, StringComparison.OrdinalIgnoreCase)) continue;
            var mmp = Path.Combine(v, "ModPackMetadata.json");
            if (!File.Exists(mmp)) continue;
            var md = JsonConvert.DeserializeObject<ModMetadata>(File.ReadAllText(mmp))!;
            foreach((var path, var rp) in md.InstalledFiles)
            {
                var realPath = rp;
                if(rp.StartsWith("ModsRoot"))
                {
                    realPath = Path.Combine(ModPath, rp.Substring(9));
                }
                else if(rp.StartsWith("SaveRoot"))
                {
                    realPath = Path.Combine(Application.persistentDataPath, rp.Substring(9));
                }
                realPath = Path.GetFullPath(realPath);
                
                Debug.Log($"Redirect {realPath} -> {path}");

                redirectPath[realPath] = Path.GetFullPath(path);
                redirectPath[Path.GetDirectoryName(realPath)] = Path.GetDirectoryName(path);

                if(Path.GetExtension(realPath).EndsWith("dll", StringComparison.OrdinalIgnoreCase))
                {
                    get_location_redirect[path] = realPath;
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
