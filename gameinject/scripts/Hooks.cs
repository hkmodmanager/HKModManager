
global using MonoMod.Cil;
global using Mono.Cecil;
global using Mono.Cecil.Cil;

namespace GameInject;

public static partial class Main
{
    [ThreadStatic]
    public static bool useOrigGetPath = false;
    [ThreadStatic]
    public static bool useOrigGetFileAttribute = false;
    public static string OrigGetFullPath(string path)
    {
        try
        {
            useOrigGetPath = true;
            return Path.GetFullPath(path);
        }
        finally
        {
            useOrigGetPath = false;
        }
    }
    public static void InitHooks()
    {
        HookEndpointManager.Add(typeof(Assembly).GetMethod("LoadFrom", new[]{
            typeof(string)
        }), (Func<string, Assembly> orig, string path) =>
        {
            Debug.Log($"[Load Form]: {path}");
            return orig(Path.GetFullPath(path));
        });

        HookEndpointManager.Add(typeof(Assembly).GetProperty("Location").GetMethod, (Func<Assembly, string> orig, Assembly self) =>
        {
            var result = orig(self);
            if (get_location_redirect.TryGetValue(result, out var r1)) return r1;
            return result;
        });
        HookEndpointManager.Add(typeof(FileStream).GetConstructor(BindingFlags.NonPublic | BindingFlags.Instance, null, new[] {
            typeof(string), typeof(FileMode), typeof(FileAccess), typeof(FileShare), typeof(int), typeof(bool), typeof(FileOptions)
        }, null),
            (
                Action<FileStream, string, FileMode, FileAccess, FileShare, int, bool, FileOptions> orig, FileStream self,
                string path, FileMode mode, FileAccess access, FileShare share, int bufferSize, bool anonymous, FileOptions options) =>
            {
                try
                {
                    if (access == FileAccess.Read)
                    {
                        useOrigGetFileAttribute = false;
                        path = Path.GetFullPath(path);
                        goto NEXT;
                    }
                    var of = OrigGetFullPath(path);
                    useOrigGetFileAttribute = false;
                    var f = Path.GetFullPath(path);
                    if (of.Equals(f, StringComparison.OrdinalIgnoreCase))
                    {
                        path = of;
                        goto NEXT;
                    }
                    try
                    {
                        useOrigGetFileAttribute = true;
                        File.Copy(f, of, true);
                    }
                    finally
                    {
                        useOrigGetFileAttribute = false;
                    }
                    NEXT:
                    orig(self, path, mode, access, share, bufferSize, anonymous, options);
                }
                finally
                {
                    useOrigGetPath = false;
                }
            }
        );
        HookEndpointManager.Add(typeof(Path).GetMethod("InsecureGetFullPath", BindingFlags.Static | BindingFlags.NonPublic),
            (Func<string, string> orig, string path) =>
            {
                var result = orig(path);
                if (useOrigGetPath) return result;
                try
                {
                    useOrigGetFileAttribute = true;
                    if (File.Exists(result)) return result;
                }
                finally
                {
                    useOrigGetFileAttribute = false;
                }
                if (redirectPath.TryGetValue(result.ToLower(), out var rpath))
                {
                    Debug.Log($"[Redirect] {result} to {rpath}");
                    return rpath;
                }
                return result;
            });
        #region System.IO.FileSystemEnumerableFactory
        var t_FileSystemEnumerableFactory = typeof(File).Assembly.GetType("System.IO.FileSystemEnumerableFactory");
        HookEndpointManager.Add(t_FileSystemEnumerableFactory.GetMethod("CreateFileNameIterator", BindingFlags.Static | BindingFlags.NonPublic),
            (Func<string, string, string, bool, bool, SearchOption, bool, IEnumerable<string>> orig,
                string path, string originalUserPath, string searchPattern, bool includeFiles, bool includeDirs,
                SearchOption searchOption, bool checkHost) =>
            {
                try
                {
                    Debug.Log($"[CreateFileNameIterator] {path}");
                    useOrigGetPath = true;
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
                }
                finally
                {
                    useOrigGetPath = false;
                }
            });
        HookEndpointManager.Add(t_FileSystemEnumerableFactory.GetMethod("CreateFileInfoIterator", BindingFlags.Static | BindingFlags.NonPublic),
            (Func<string, string, string, SearchOption, IEnumerable<FileInfo>> orig,
                string path, string originalUserPath, string searchPattern, SearchOption searchOption) =>
            {
                try
                {
                    useOrigGetPath = true;
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
                }
                finally
                {
                    useOrigGetPath = false;
                }
            });
        HookEndpointManager.Add(t_FileSystemEnumerableFactory.GetMethod("CreateDirectoryInfoIterator", BindingFlags.Static | BindingFlags.NonPublic),
            (Func<string, string, string, SearchOption, IEnumerable<DirectoryInfo>> orig,
                string path, string originalUserPath, string searchPattern, SearchOption searchOption) =>
            {
                try
                {
                    useOrigGetPath = true;
                    IEnumerable<DirectoryInfo>? result = null;
                    if (redirectDir.TryGetValue(Path.GetFullPath(path), out var rd))
                    {
                        result = orig(rd, originalUserPath, searchPattern, searchOption);
                    }
                    if (!Directory.Exists(path) && result != null) return result;
                    result = result ?? Enumerable.Empty<DirectoryInfo>();
                    return result.Concat(orig(path, originalUserPath, searchPattern, searchOption));
                }
                finally
                {
                    useOrigGetPath = false;
                }
            });
        HookEndpointManager.Add(t_FileSystemEnumerableFactory.GetMethod("CreateFileSystemInfoIterator", BindingFlags.Static | BindingFlags.NonPublic),
            (Func<string, string, string, SearchOption, IEnumerable<FileSystemInfo>> orig,
                string path, string originalUserPath, string searchPattern, SearchOption searchOption) =>
            {
                try
                {
                    useOrigGetPath = true;
                    IEnumerable<FileSystemInfo>? result = null;
                    if (redirectDir.TryGetValue(Path.GetFullPath(path), out var rd))
                    {
                        result = orig(rd, originalUserPath, searchPattern, searchOption);
                    }
                    if (!Directory.Exists(path) && result != null) return result;
                    result = result ?? Enumerable.Empty<FileSystemInfo>();
                    return result.Concat(orig(path, originalUserPath, searchPattern, searchOption));
                }
                finally
                {
                    useOrigGetPath = false;
                }
            });
        #endregion
        #region System.IO.MonoIO
        MethodInfo m_getfullpath = typeof(Path).GetMethod("GetFullPath");
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
                    if (useOrigGetFileAttribute) return a0;
                    return Path.GetFullPath(a0);
                });
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
        #endregion
    }

}
