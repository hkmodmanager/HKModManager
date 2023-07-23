using HKMM.Interop;
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
        public static Settings Instance { get; set; } = new();

        
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
