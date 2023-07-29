using HKMM.Pack.Installer;
using HKMM.Pack.Legacy;
using HKMM.Pack;
using HKMM.Pack.Metadata;
using HKMM.Pack.Metadata.HKMM;
using HKMM.Pack.Metadata.Providers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace HKMM.Utils
{
    [JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
                                    IgnoreReadOnlyProperties = true,
                                    IgnoreReadOnlyFields = true,
                                    IncludeFields = false)]
    
    [JsonSerializable(typeof(PackCollection))]
    [JsonSerializable(typeof(Dictionary<string, HKMMHollowKnightPackageDefV1>))]
    [JsonSerializable(typeof(string[]))]
    [JsonSerializable(typeof(DateTimeOffset))]
    [JsonSerializable(typeof(TimeOnly))]
    [JsonSerializable(typeof(HKMMPackage))]
    [JsonSerializable(typeof(HKMMHollowKnightPackageDefV1))]
    [JsonSerializable(typeof(PackCollection))]
    [JsonSerializable(typeof(LegacyLocalModInfo))]
    [JsonSerializable(typeof(LegacyModInfoFull))]
    [JsonSerializable(typeof(Settings))]
    [JsonSerializable(typeof(RuntimeInitializeOnLoads))]
    [JsonSerializable(typeof(ScriptingAssemblies))]
    [JsonSerializable(typeof(GameInjectInstaller.Config))]
    [JsonSerializable(typeof(HKMMProviderV1))]
    [JsonSerializable(typeof(PackCollection))]
    #region CSHollowKnightPackageDef
    [JsonSerializable(typeof(Dictionary<string, ReferenceVersion>))]
    [JsonSerializable(typeof(Dictionary<string, CSHollowKnightPackageDef>))]
    [JsonSerializable(typeof(CSHollowKnightPackageDef))]
    [JsonSerializable(typeof(ReleaseAssets))]
    [JsonSerializable(typeof(ReferenceVersion))]
    [JsonSerializable(typeof(References))]
    [JsonSerializable(typeof(PlatformAssets))]
    [JsonSerializable(typeof(ReferenceDef))]
    #endregion
    public partial class JsonSerializableContext : JsonSerializerContext { }
    public static class JsonUtils
    {
        public static T ToObject<T>(string json)
        {
            return JsonSerializer.Deserialize<T>(json, Converter.Settings)!;
        }
        public static string ToJSON<T>(T obj)
        {
            return JsonSerializer.Serialize(obj, Converter.Settings);
        }
    }
}
