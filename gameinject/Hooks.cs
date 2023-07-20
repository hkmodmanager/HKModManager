
global using MonoMod.Cil;
global using Mono.Cecil;
global using Mono.Cecil.Cil;
using System.Linq;

namespace GameInject;

static partial class Main
{
    [ThreadStatic]
    public static int useOrigGetFileAttribute = 0;
    public static IEnumerable<string> GetDirRedirect(string fakeDir)
    {
        var dir = Path.GetFullPath(fakeDir);
        if(!fake2realDir.TryGetValue(dir, out var list))
        {
            return Enumerable.Empty<string>();
        }
        return list.Select(x => Path.GetFullPath(x));
    }
    public static string ConvertPath(string path)
    {
        var result = Path.GetFullPath(path);
        try
        {
            useOrigGetFileAttribute++;
            if (File.Exists(result)) return result;
        }
        finally
        {
            useOrigGetFileAttribute--;
        }
        if (fake2realPath.TryGetValue(result, out var rpath))
        {
            Log($"[Redirect] {result} to {rpath}");
            return rpath;
        }
        return result;
    }
    public static void InitHooks()
    {
        HookEndpointManager.Add(typeof(Assembly).GetMethod("LoadFrom", new[]{
            typeof(string)
        }), (Func<string, Assembly> orig, string path) =>
        {
            Log($"[Load Form]: {path}");
            return orig(ConvertPath(path));
        });

        HookEndpointManager.Add(typeof(Assembly).GetProperty("Location").GetMethod, (Func<Assembly, string> orig, Assembly self) =>
        {
            var result = orig(self);
            if (get_location_redirect.TryGetValue(result, out var r1)) return r1;
            return result;
        });
        
        HookEndpointManager.Add(typeof(Assembly).Assembly.GetType("System.Reflection.RuntimeAssembly")
            .GetMethod("get_CodeBase")
            , (Func<Assembly, string> orig, Assembly self) =>
        {
            return new Uri("file:///" + Uri.EscapeDataString(self.Location)).ToString();
        });
        #region System.IO.FileSystemEnumerableFactory
        On.System.IO.FileSystemEnumerableFactory.CreateFileNameIterator += FileSystemEnumerableFactory_CreateFileNameIterator;
        On.System.IO.FileSystemEnumerableFactory.CreateFileInfoIterator += FileSystemEnumerableFactory_CreateFileInfoIterator;
        On.System.IO.FileSystemEnumerableFactory.CreateDirectoryInfoIterator += FileSystemEnumerableFactory_CreateDirectoryInfoIterator;
        #endregion
        #region System.IO.MonoIO
        MethodInfo m_getfullpath = typeof(Main).GetMethod("ConvertPath");
        var t_MonoIO = typeof(File).Assembly.GetType("System.IO.MonoIO");

        HookEndpointManager.Modify(t_MonoIO.GetMethod("GetFileAttributes",
            BindingFlags.Static | BindingFlags.Public),
            (ILContext il) =>
            {
                ILCursor cur = new(il);
                cur.Goto(0);
                cur.Emit(OpCodes.Ldarg_0);
                cur.EmitDelegate((string a0) =>
                {
                    if (useOrigGetFileAttribute > 0) return a0;
                    return ConvertPath(a0);
                });
                cur.Emit(OpCodes.Starg, 0);
            }
        );
        HookEndpointManager.Modify(t_MonoIO.GetMethod("SetFileAttributes",
            BindingFlags.Static | BindingFlags.Public),
            (ILContext il) =>
            {
                ILCursor cur = new(il);
                cur.Goto(0);
                cur.Emit(OpCodes.Ldarg_0);
                cur.Emit(OpCodes.Call, m_getfullpath);
                cur.Emit(OpCodes.Starg, 0);
            }
        );
        HookEndpointManager.Modify(t_MonoIO.GetMethod("GetFileStat",
            BindingFlags.Static | BindingFlags.Public),
            (ILContext il) =>
            {
                ILCursor cur = new(il);
                cur.Goto(0);
                cur.Emit(OpCodes.Ldarg_0);
                cur.Emit(OpCodes.Call, m_getfullpath);
                cur.Emit(OpCodes.Starg, 0);
            }
        );
        HookEndpointManager.Modify(t_MonoIO.GetMethod("Open",
            BindingFlags.Static | BindingFlags.Public),
            (ILContext il) =>
            {
                ILCursor cur = new(il);
                cur.Goto(0);
                cur.Emit(OpCodes.Ldarg_0);
                cur.Emit(OpCodes.Call, m_getfullpath);
                cur.Emit(OpCodes.Starg, 0);
            }
        );
        HookEndpointManager.Modify(t_MonoIO.GetMethod("CreateDirectory",
            BindingFlags.Static | BindingFlags.Public),
            (ILContext il) =>
            {
                ILCursor cur = new(il);
                cur.Goto(0);
                cur.Emit(OpCodes.Ldarg_0);
                cur.Emit(OpCodes.Call, m_getfullpath);
                cur.Emit(OpCodes.Starg, 0);
            }
        );
        HookEndpointManager.Modify(t_MonoIO.GetMethod("RemoveDirectory",
            BindingFlags.Static | BindingFlags.Public),
            (ILContext il) =>
            {
                ILCursor cur = new(il);
                cur.Goto(0);
                cur.Emit(OpCodes.Ldarg_0);
                cur.Emit(OpCodes.Call, m_getfullpath);
                cur.Emit(OpCodes.Starg, 0);
            }
        );
        HookEndpointManager.Modify(t_MonoIO.GetMethod("CopyFile",
            BindingFlags.Static | BindingFlags.Public),
            (ILContext il) =>
            {
                ILCursor cur = new(il);
                cur.Goto(0);
                cur.Emit(OpCodes.Ldarg_0);
                cur.Emit(OpCodes.Call, m_getfullpath);
                cur.Emit(OpCodes.Starg, 0);
                cur.Emit(OpCodes.Ldarg_1);
                cur.Emit(OpCodes.Call, m_getfullpath);
                cur.Emit(OpCodes.Starg, 1);
            }
        );
        HookEndpointManager.Modify(t_MonoIO.GetMethod("DeleteFile",
            BindingFlags.Static | BindingFlags.Public),
            (ILContext il) =>
            {
                ILCursor cur = new(il);
                cur.Goto(0);
                cur.Emit(OpCodes.Ldarg_0);
                cur.Emit(OpCodes.Call, m_getfullpath);
                cur.Emit(OpCodes.Starg, 0);
            }
        );
        #endregion
    }
    #region System.IO.FileSystemEnumerableFactory
    private static IEnumerable<DirectoryInfo> FileSystemEnumerableFactory_CreateDirectoryInfoIterator(On.System.IO.FileSystemEnumerableFactory.orig_CreateDirectoryInfoIterator orig, 
        string path, string originalUserPath, string searchPattern, SearchOption searchOption)
    {
        throw new NotImplementedException();
    }

    private static IEnumerable<FileInfo> FileSystemEnumerableFactory_CreateFileInfoIterator(On.System.IO.FileSystemEnumerableFactory.orig_CreateFileInfoIterator orig, 
        string path, string originalUserPath, string searchPattern, SearchOption searchOption)
    {
        throw new NotImplementedException();
    }

    private static IEnumerable<string> FileSystemEnumerableFactory_CreateFileNameIterator(On.System.IO.FileSystemEnumerableFactory.orig_CreateFileNameIterator orig,
        string path, string originalUserPath, string searchPattern,
        bool includeFiles, bool includeDirs, SearchOption searchOption, bool checkHost)
    {
        path = Path.GetFullPath(path);
        List<string> results = new();
        results.AddRange(orig(path, originalUserPath, searchPattern, includeFiles,
            includeDirs, searchOption, checkHost)
            .Select(x => Path.GetFullPath(x)));

        foreach (var v in GetDirRedirect(path))
        {
            foreach (var item in orig(v, v, searchPattern, includeFiles, includeDirs,
                searchOption, checkHost))
            {
                var r = Path.GetFullPath(item.Replace(v, path));
                Log($"[FSE_CFNI]Got name: {item} -> {r}");
                if(!results.Contains(r, StringComparer.OrdinalIgnoreCase))
                {
                    Log("[FSE_CFNI] New Path");
                    results.Add(r);
                }
            }
        }
        return results.Distinct();
    }
    #endregion
}
