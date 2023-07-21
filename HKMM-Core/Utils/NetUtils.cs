using HKMM.Interop;
using HKMM.Modules;
using Microsoft.JavaScript.NodeApi;
using Mono.Cecil;
using System;
using System.IO;
using System.Linq;

namespace HKMM.Utils;

public static class NetUtils
{

    [JSExport]
    public static int GetAPIVersion(string apiPath)
    {
        if (!File.Exists(apiPath)) return -3;
        Logger.Where();
        var data = FileModule.Instance.ReadBytes(apiPath);

        using var asm = AssemblyDefinition.ReadAssembly(new MemoryStream(data));
        Logger.Where();
        var t_modhooks = asm.MainModule.GetType("Modding.ModHooks");
        if (t_modhooks is null) return  -1;
        var ver = t_modhooks.Fields.FirstOrDefault(x => x.Name == "_modVersion");
        if (ver is null || !ver.IsLiteral) return  -2;
        return (int)ver.Constant;
    }

    [JSExport]
    public static string GetGameVersion(string apiPath)
    {
        if (!File.Exists(apiPath)) return "";
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

    public static Version? GetAssemblyVersion(string path)
    {
        if (!File.Exists(path)) return null;
        try
        {
            using var asm = AssemblyDefinition.ReadAssembly(path);
            return asm.Name.Version;
        }catch(BadImageFormatException)
        {
            return null;
        }
    }

    [JSExport]
    public static PackageProviderProxy GetRootPackageProvider()
    {
        return PackageProviderProxy.GetRoot();
    }
}
