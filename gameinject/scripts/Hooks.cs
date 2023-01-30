
global using MonoMod.Cil;
global using Mono.Cecil;
global using Mono.Cecil.Cil;

namespace GameInject;

static partial class Main
{
    [ThreadStatic]
    public static int useOrigGetFileAttribute = 0;
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
        if (redirectPath.TryGetValue(result.ToLower(), out var rpath))
        {
            Debug.Log($"[Redirect] {result} to {rpath}");
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
            Debug.Log($"[Load Form]: {path}");
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
        var t_FileSystemEnumerableFactory = typeof(File).Assembly.GetType("System.IO.FileSystemEnumerableFactory");
        HookEndpointManager.Add(t_FileSystemEnumerableFactory.GetMethod("CreateFileNameIterator", BindingFlags.Static | BindingFlags.NonPublic),
            (Func<string, string, string, bool, bool, SearchOption, bool, IEnumerable<string>> orig,
                string path, string originalUserPath, string searchPattern, bool includeFiles, bool includeDirs,
                SearchOption searchOption, bool checkHost) =>
            {
                Debug.Log($"[CreateFileNameIterator] {path}");
                IEnumerable<string>? result = null;

                var op = Path.GetFullPath(path);
                if (redirectDir.TryGetValue(op, out var rd))
                {
                    var frd = Path.GetFullPath(rd);
                    result = orig(frd, originalUserPath, searchPattern, includeFiles, includeDirs, searchOption, checkHost)
                        .Select(x =>
                        {
                            if (Path.GetFullPath(x).StartsWith(frd))
                            {
                                var r = Path.Combine(op, Path.GetFullPath(x).Remove(0, frd.Length + 1));
                                return r;
                            }
                            else
                            {
                                return x;
                            }
                        })
                        ;
                    foreach (var v in result)
                    {
                        Debug.Log($"[CreateFileNameIterator]D3: {v}");
                        Directory.CreateDirectory(Path.GetDirectoryName(v));
                    }
                }
                if (!Directory.Exists(op) && result != null) return result;

                result = result ?? Enumerable.Empty<string>();
                return result
                    .Concat(
                        orig(op, originalUserPath, searchPattern, includeFiles, includeDirs, searchOption, checkHost)
                        .Except(result)
                        );

            });
        HookEndpointManager.Add(t_FileSystemEnumerableFactory.GetMethod("CreateFileInfoIterator", BindingFlags.Static | BindingFlags.NonPublic),
            (Func<string, string, string, SearchOption, IEnumerable<FileInfo>> orig,
                string path, string originalUserPath, string searchPattern, SearchOption searchOption) =>
            {
                IEnumerable<FileInfo>? result = null;
                var op = Path.GetFullPath(path);
                if (redirectDir.TryGetValue(Path.GetFullPath(path), out var rd))
                {
                    var frd = Path.GetFullPath(rd);
                    result = orig(rd, originalUserPath, searchPattern, searchOption);
                }
                if (!Directory.Exists(path) && result != null) return result;
                result = result ?? Enumerable.Empty<FileInfo>();
                return result.Concat(orig(path, originalUserPath, searchPattern, searchOption));
            });
        HookEndpointManager.Add(t_FileSystemEnumerableFactory.GetMethod("CreateDirectoryInfoIterator", BindingFlags.Static | BindingFlags.NonPublic),
            (Func<string, string, string, SearchOption, IEnumerable<DirectoryInfo>> orig,
                string path, string originalUserPath, string searchPattern, SearchOption searchOption) =>
            {
                IEnumerable<DirectoryInfo>? result = null;
                if (redirectDir.TryGetValue(Path.GetFullPath(path), out var rd))
                {
                    result = orig(rd, originalUserPath, searchPattern, searchOption);
                }
                if (!Directory.Exists(path) && result != null) return result;
                result = result ?? Enumerable.Empty<DirectoryInfo>();
                return result.Concat(orig(path, originalUserPath, searchPattern, searchOption));
            });
        HookEndpointManager.Add(t_FileSystemEnumerableFactory.GetMethod("CreateFileSystemInfoIterator", BindingFlags.Static | BindingFlags.NonPublic),
            (Func<string, string, string, SearchOption, IEnumerable<FileSystemInfo>> orig,
                string path, string originalUserPath, string searchPattern, SearchOption searchOption) =>
            {
                IEnumerable<FileSystemInfo>? result = null;
                if (redirectDir.TryGetValue(Path.GetFullPath(path), out var rd))
                {
                    result = orig(rd, originalUserPath, searchPattern, searchOption);
                }
                if (!Directory.Exists(path) && result != null) return result;
                result = result ?? Enumerable.Empty<FileSystemInfo>();
                return result.Concat(orig(path, originalUserPath, searchPattern, searchOption));
            });
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

}
