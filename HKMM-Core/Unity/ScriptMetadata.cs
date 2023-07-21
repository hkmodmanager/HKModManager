using static System.Net.Mime.MediaTypeNames;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using HKMM.Interop;
using HKMM.Pack.Installer;
using HKMM.Pack.Metadata;
using System;
using System.Text.Json.Serialization;
using HKMM;
using HKMM.Utils;
using HKMM.Modules;

[Serializable]
public class RuntimeInitializeOnLoads
{
    [Serializable]
    public enum RuntimeInitializeLoadType
    {
        AfterSceneLoad,
        BeforeSceneLoad,
        AfterAssembliesLoaded,
        BeforeSplashScreen,
        SubsystemRegistration
    }
    public static string DataPath => Path.Combine(MAPIInstaller.ManagedPath, "..");
    public class RuntimeInitializeOnLoadsItem
    {
        [JsonPropertyName("assemblyName")]
        public string assemblyName { get; set; } = "";
        [JsonPropertyName("nameSpace")]
        public string nameSpace { get; set; } = "";
        [JsonPropertyName("className")]
        public string className { get; set; } = "";
        [JsonPropertyName("methodName")]
        public string methodName { get; set; } = "";
        [JsonPropertyName("loadTypes")]
        public int loadTypes { get; set; } = (int)RuntimeInitializeLoadType.AfterAssembliesLoaded;
        [JsonPropertyName("isUnityClass")]
        public bool isUnityClass { get; set; } = false;
    }
    [JsonPropertyName("root")]
    public List<RuntimeInitializeOnLoadsItem> root { get; set; } = new();
    private static readonly string JSON_PATH = Path.Combine(DataPath, 
        "RuntimeInitializeOnLoads.json");
    public static RuntimeInitializeOnLoads Load()
    {
        return JsonUtils.ToObject<RuntimeInitializeOnLoads>(File.ReadAllText(JSON_PATH)
            )!;
    }
    public void Save()
    {
        FileModule.Instance.WriteText(JSON_PATH, JsonSerializer.Serialize(this, Converter.Settings));
    }
}
[Serializable]
public class ScriptingAssemblies
{
    public static string DataPath => Path.Combine(MAPIInstaller.ManagedPath, "..");
    [Serializable]
    public enum ScriptingAssemblyType
    {
        UnityLibrary = 2,
        CustomAssembly = 16
    }
    [JsonPropertyName("names")]
    public List<string> names { get; set; } = new();
    [JsonPropertyName("types")]
    public List<int> types { get; set; } = new();
    public void AddAssembly(string path, ScriptingAssemblyType type = ScriptingAssemblyType.CustomAssembly)
    {
        path = Path.GetFullPath(path)[(DataPath.Length + "/Managed/".Length)..];

        int id = names.IndexOf(path);
        if (id == -1)
        {
            names.Add(path);
            types.Add((int)type);
            return;
        }
        types[id] = (int)type;
    }
    public void Remove(string path)
    {
        path = Path.GetFullPath(path)[(DataPath.Length + "/Managed/".Length)..];
        int id = names.IndexOf(path);
        if (id == -1) return;
        types.RemoveAt(id);
        names.RemoveAt(id);
    }
    private static readonly string JSON_PATH = Path.Combine(DataPath, "ScriptingAssemblies.json");
    public static ScriptingAssemblies Load()
    {
        return JsonUtils.ToObject<ScriptingAssemblies>(File.ReadAllText(JSON_PATH))!;
    }
    public void Save()
    {
        FileModule.Instance.WriteText(JSON_PATH, JsonSerializer.Serialize(this, Converter.Settings));
    }
}