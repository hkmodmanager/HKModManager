

using HKMM.Interop;
using HKMM.Modules;
using Microsoft.JavaScript.NodeApi;
using Mono.Cecil;
using System.IO;
using System.Linq;

namespace HKMM;

public static class NetUtils
{
    private static SHA256Tuple? cacheAPIHash;
    private static int cacheAPIVer;
    [JSExport]
    public static int GetAPIVersion(string apiPath)
    {
        var data = File.ReadAllBytes(apiPath);
        if(cacheAPIHash != null)
        {
            if(SHA256Module.Instance.CompareSHA256(data, cacheAPIHash))
            {
                return cacheAPIVer;
            }
        }
        cacheAPIHash = SHA256Module.Instance.CalcSHA256Tuple(data);
        using var asm = AssemblyDefinition.ReadAssembly(new MemoryStream(data));
        var t_modhooks = asm.MainModule.GetType("Modding.ModHooks");
        if (t_modhooks is null) return cacheAPIVer = -1;
        var ver = t_modhooks.Fields.FirstOrDefault(x => x.Name == "_modVersion");
        if (ver is null || !ver.IsLiteral) return cacheAPIVer = -2;
        return (int)ver.Constant;
    }

    [JSExport]
    public static string GetGameVersion(string apiPath)
    {
        using var asm = AssemblyDefinition.ReadAssembly(apiPath);
        var t_modhooks = asm.MainModule.GetType("Constants");
        if (t_modhooks is null) return "";
        var ver = t_modhooks.Fields.FirstOrDefault(x => x.Name == "GAME_VERSION");
        if (ver is null || !ver.IsLiteral) return "";
        var v = (string)ver.Constant;
        return v;
    }

    [JSExport]
    public static string? TryFindGamePath()
    {
        return GameFileHelper.FindSteamGamePath(GameFileHelper.HOLLOWKNIGHT_APP_ID, GameFileHelper.HOLLOWKNIGHT_GAME_NAME);
    }

    [JSExport]
    public static PackageProviderProxy GetRootPackageProvider()
    {
        return PackageProviderProxy.GetRoot();
    }
}
