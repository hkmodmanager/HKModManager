

namespace GameInject;

public static partial class Main
{
    public static readonly string ModPath = Path.Combine(Application.dataPath, "Managed", "Mods");
    public static readonly Dictionary<string, string> redirectPath = new();
    public static readonly Dictionary<string, string> get_location_redirect = new();
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
        var cp = Path.Combine(Path.GetDirectoryName(typeof(Main).Assembly.Location), "hkmm-gameinject.json");
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
    public static void ScanMods()
    {
        foreach (var v in Directory.GetDirectories(config.modsPath))
        {
            var mmp = Path.Combine(v, "modversion.json");
            if(!File.Exists(mmp)) continue;
            var md = JsonConvert.DeserializeObject<ModMetadata>(File.ReadAllText(mmp))!;
            var mp = Path.GetFullPath(Path.Combine(ModPath, md.name));
            Debug.Log($"Redirect path: {mp} to {v}");
            Directory.CreateDirectory(mp);
            redirectPath.Add(mp, v);
            foreach(var f in md.files) {
                var fn = Path.GetFullPath(Path.Combine(v, f));
                var mf = Path.GetFullPath(Path.Combine(mp, f));
                redirectPath.Add(mf, fn);
                if(Path.GetExtension(f) == ".dll") {
                    get_location_redirect.Add(fn, mf);
                }
            }
        }
    }
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterAssembliesLoaded)]
    public static void Init()
    {
        if (!ShouldLoad()) return;
        ScanMods();

        var modsp = Path.Combine(Application.dataPath, "Managed", "Mods", "hkmm-inject", "GameInject.dll");
        if (!File.Exists(modsp))
        {
            Directory.CreateDirectory(Path.GetDirectoryName(modsp));
            FileSystemUtils.CreateSymbolicLink(modsp, typeof(Main).Assembly.Location, false);
            //File.Copy(typeof(Main).Assembly.Location, modsp, true);
        }

        InitHooks();
    }

    
}
