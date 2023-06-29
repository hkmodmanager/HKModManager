using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace HKMM
{
    [Serializable]
    internal class Settings
    {
        [JsonPropertyName("mirror_github")]
        public List<string> MirrorGithub = new()

    }
}
