using HKMM.Pack.Metadata;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace HKMM.Utils
{
    public static class JsonUtils
    {
        public static T ToObject<T>(string json)
        {
            return JsonSerializer.Deserialize<T>(json, Converter.Settings)!;
        }
        public static string ToJSON<T>(T obj)
        {
            return JsonSerializer.Serialize<T>(obj, Converter.Settings);
        }
    }
}
