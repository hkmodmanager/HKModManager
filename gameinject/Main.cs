

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
    public static void ScanMods()
    {
        foreach (var vp in config.loadedMods)
        {
            if (vp is null) continue;
            var parts = vp.Split('|');
            if (parts.Length != 3) continue;
            var v = parts[2];
            if (!Directory.Exists(v) || !v.StartsWith(config.modsPath, StringComparison.OrdinalIgnoreCase)) continue;
            var mmp = Path.Combine(v, "modversion.json");
            if (!File.Exists(mmp)) continue;
            var md = JsonConvert.DeserializeObject<ModMetadata>(File.ReadAllText(mmp))!;
            var mp = Path.GetFullPath(Path.Combine(ModPath, md.name));
            Debug.Log($"Redirect path: {mp} to {v}");
            Directory.CreateDirectory(mp);
            redirectPath.Add(mp.ToLower(), v);
            void FED(string realRoot, string modRoot)
            {
                redirectDir[modRoot] = realRoot;
                foreach (var f in Directory.EnumerateFiles(realRoot))
                {
                    //Debug.Log(f);
                    var fn = f;
                    var mf = Path.GetFullPath(Path.Combine(modRoot, Path.GetFileName(f)));
                    Debug.Log($"Redirect path: {mf} to {fn}");
                    redirectPath.Add(mf.ToLower(), fn);
                    if (Path.GetExtension(f) == ".dll")
                    {
                        get_location_redirect.Add(fn, mf);
                    }
                }
                foreach(var d in Directory.EnumerateDirectories(realRoot))
                {
                    //Debug.Log(d);
                    FED(d, Path.GetFullPath(Path.Combine(modRoot, Path.GetFileName(d))));
                }
            }
            FED(v, mp);
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
        ScanMods();

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
