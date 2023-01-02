
namespace GameInject;

public static partial class Main
{
    public static bool useOrigGetPath = false;
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
            if(useOrigGetPath) return result;
            if (get_location_redirect.TryGetValue(result, out var r1)) return r1;
            return result;
        });

        HookEndpointManager.Add(typeof(Path).GetMethod("InsecureGetFullPath", BindingFlags.Static | BindingFlags.NonPublic),
            (Func<string, string> orig, string path) =>
            {
                var result = orig(path);
                if (redirectPath.TryGetValue(result.ToLower(), out var rpath))
                {
                    Debug.Log($"[Redirect] {result} to {rpath}");
                    return rpath;
                }
                return result;
            });

        var t_FileSystemEnumerableFactory = typeof(File).Assembly.GetType("System.IO.FileSystemEnumerableFactory");
        HookEndpointManager.Add(t_FileSystemEnumerableFactory.GetMethod("CreateFileNameIterator", BindingFlags.Static | BindingFlags.NonPublic),
            (Func<string, string, string, bool, bool, SearchOption, bool, IEnumerable<string>> orig,
                string path, string originalUserPath, string searchPattern, bool includeFiles, bool includeDirs,
                SearchOption searchOption, bool checkHost) =>
            {
                useOrigGetPath = true;
                var result = orig(path, originalUserPath, searchPattern, includeFiles, includeDirs, searchOption, checkHost);
                useOrigGetPath = false;
                if (redirectDir.TryGetValue(Path.GetFullPath(path), out var rd))
                {
                    return result.Concat(orig(rd, originalUserPath, searchPattern, includeFiles, includeDirs, searchOption, checkHost));
                }
                return result;
            });
        HookEndpointManager.Add(t_FileSystemEnumerableFactory.GetMethod("CreateFileInfoIterator", BindingFlags.Static | BindingFlags.NonPublic),
            (Func<string, string, string, SearchOption, IEnumerable<FileInfo>> orig,
                string path, string originalUserPath, string searchPattern, SearchOption searchOption) =>
            {
                useOrigGetPath = true;
                var result = orig(path, originalUserPath, searchPattern, searchOption);
                useOrigGetPath = false;
                if (redirectDir.TryGetValue(Path.GetFullPath(path), out var rd))
                {
                    return result.Concat(orig(rd, originalUserPath, searchPattern, searchOption));
                }
                return result;
            });
        HookEndpointManager.Add(t_FileSystemEnumerableFactory.GetMethod("CreateDirectoryInfoIterator", BindingFlags.Static | BindingFlags.NonPublic),
            (Func<string, string, string, SearchOption, IEnumerable<DirectoryInfo>> orig,
                string path, string originalUserPath, string searchPattern, SearchOption searchOption) =>
            {
                useOrigGetPath = true;
                var result = orig(path, originalUserPath, searchPattern, searchOption);
                useOrigGetPath = false;
                if (redirectDir.TryGetValue(Path.GetFullPath(path), out var rd))
                {
                    return result.Concat(orig(rd, originalUserPath, searchPattern, searchOption));
                }
                return result;
            });
        HookEndpointManager.Add(t_FileSystemEnumerableFactory.GetMethod("CreateFileSystemInfoIterator", BindingFlags.Static | BindingFlags.NonPublic),
            (Func<string, string, string, SearchOption, IEnumerable<FileSystemInfo>> orig,
                string path, string originalUserPath, string searchPattern, SearchOption searchOption) =>
            {
                useOrigGetPath = true;
                var result = orig(path, originalUserPath, searchPattern, searchOption);
                useOrigGetPath = false;
                if (redirectDir.TryGetValue(Path.GetFullPath(path), out var rd))
                {
                    return result.Concat(orig(rd, originalUserPath, searchPattern, searchOption));
                }
                return result;
            });
    }
}
