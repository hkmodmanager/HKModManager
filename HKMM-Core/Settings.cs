using HKMM.Interop;
using HKMM.Modules;
using HKMM.Pack.Metadata;
using HKMM.Utils;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace HKMM
{
    [Serializable]
    public class Settings
    {
        [JsonPropertyName("mirror_github")]
        public List<string> MirrorGithub { get; set; } = new();
        [JsonPropertyName("gamepath")]
        public string GamePath { get; set; } = "";
        [JsonPropertyName("modsavepathMode")]
        public int ModSavePathMode { get; set; } = 1;
        [JsonPropertyName("options")]
        public List<string> Options { get; set; } = new();
        [JsonPropertyName("cdn")]
        public string CDN { get; set; } = "";
        [JsonIgnore]
        public static Settings Instance { get; set; } = new();

        public string GetModStorePath()
        {
            var path = ModSavePathMode switch
            {
                0 => Path.Combine(Path.GetDirectoryName(JS.Api.ElectronExe)!, "managedMods"),
                1 => Path.Combine(JS.Api.AppDataDir, "managedMods"),
                2 => Path.Combine(GamePath, "hkmm-mods"),
                _ => Path.Combine(JS.Api.AppDataDir, "managedMods")
            };
            FileModule.Instance.CreateDirectory(path);
            return path;
        }
        public static void LoadSettings(string configPath)
        {
            var conf = configPath;
            if (!File.Exists(conf))
            {
                Instance = new();
                return;
            }
            Instance = JsonUtils.ToObject<Settings>(File.ReadAllText(conf)) 
                ?? new();
        }
    }
}
