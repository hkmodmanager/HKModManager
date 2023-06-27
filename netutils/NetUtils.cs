﻿
#pragma warning disable CS1998

global using System.Text;
global using System.Linq;
global using System.IO;
global using System.Threading.Tasks;
global using Mono.Cecil;
global using System.Threading;
global using System.Runtime.CompilerServices;
global using System.Runtime.InteropServices;
global using System.Runtime;
global using System;

using Microsoft.JavaScript.NodeApi;

namespace HKMM;

public static class NetUtils
{
    [JSExport]
    public static int GetAPIVersion(string apiPath)
    {
        using (var asm = AssemblyDefinition.ReadAssembly(apiPath))
        {
            var t_modhooks = asm.MainModule.GetType("Modding.ModHooks");
            if (t_modhooks is null) return -1;
            var ver = t_modhooks.Fields.FirstOrDefault(x => x.Name == "_modVersion");
            if (ver is null || !ver.IsLiteral) return -2;
            return (int)ver.Constant;
        }
    }

    [JSExport]
    public static string GetGameVersion(string apiPath)
    {
        using (var asm = AssemblyDefinition.ReadAssembly(apiPath))
        {
            var t_modhooks = asm.MainModule.GetType("Constants");
            if (t_modhooks is null) return "";
            var ver = t_modhooks.Fields.FirstOrDefault(x => x.Name == "GAME_VERSION");
            if (ver is null || !ver.IsLiteral) return "";
            var v = (string)ver.Constant;
            return v;
        }
    }

    [JSExport]
    public static string? TryFindGamePath()
    {
        return GameFileHelper.FindSteamGamePath(GameFileHelper.HOLLOWKNIGHT_APP_ID, GameFileHelper.HOLLOWKNIGHT_GAME_NAME);
    }
}
