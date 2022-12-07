
namespace GameInject;

public static partial class Main
{
    public static void InitHooks() {
        HookEndpointManager.Add(typeof(Assembly).GetMethod("LoadFrom", new[]{
            typeof(string)
        }), (Func<string, Assembly> orig, string path) => {
            return orig(Path.GetFullPath(path));
        });

        HookEndpointManager.Add(typeof(Assembly).GetProperty("Location").GetMethod, (Func<Assembly, string> orig, Assembly self) => {
            var result = orig(self);
            if(get_location_redirect.TryGetValue(result, out var r1)) return r1;
            return result;
        });

        HookEndpointManager.Add(typeof(Path).GetMethod("InsecureGetFullPath", BindingFlags.Static | BindingFlags.NonPublic),
            (Func<string, string> orig, string path) => {
                var result = orig(path);
                if(redirectPath.TryGetValue(result, out var rpath)) {
                    Debug.Log($"[Redirect] {result} to {rpath}");
                    return rpath;
                }
                return result;
            });
    }
}
