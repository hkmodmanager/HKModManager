using HKMM.Pack.Metadata.HKMM;
using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using System.Text.Json.Serialization.Metadata;
using System.Threading.Tasks;

namespace HKMM.Pack.Metadata
{
    internal class PackageBaseConverter : JsonConverter<PackageBase>
    {
        public override bool CanConvert(Type typeToConvert) => 
            typeToConvert.IsSubclassOf(typeof(PackageBase)) || typeToConvert == typeof(PackageBase);
        public override PackageBase? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var result = PackageBase.FromJson((JsonObject)JsonNode.Parse(ref reader)!);

            return result;
        }

        public override void Write(Utf8JsonWriter writer, PackageBase value, JsonSerializerOptions options)
        {
            JsonSerializer.Serialize(writer, value, value.GetJsonTypeInfo().Type, Converter.Settings);
        }
    }
    [JsonConverter(typeof(PackageBaseConverter))]
    [JSExport]
    public partial class PackageBase
    {
        public CSHollowKnightPackageDef Value => (CSHollowKnightPackageDef)this;
        public HKMMHollowKnightPackageDefV1 ToHKMMPackageDef()
        {
            var t = (CSHollowKnightPackageDef)this;
            if (t is HKMMHollowKnightPackageDefV1 v1)
            {
                return v1;
            }
            else
            {
                var result = new HKMMHollowKnightPackageDefV1();
                result.CopyFrom(t);
                return result;
            }
        }
        public static JsonTypeInfo GetJsonTypeInfo(int? packVersion)
        {
            var jtr = CSPackSC.Default;
            if (!packVersion.HasValue) return jtr.CSHollowKnightPackageDef;
            return packVersion.Value switch
            {
                1 => jtr.HKMMHollowKnightPackageDefV1,
                _ => throw new NotSupportedException()
            };
        }
        public static JsonTypeInfo GetJsonTypeInfo(JsonObject json)
        {
            var packVer = (JsonValue?)json["packageVersion"];
            if (packVer == null) return GetJsonTypeInfo((int?)null);
            return GetJsonTypeInfo(packVer.GetValue<int>());
        }
        public JsonTypeInfo GetJsonTypeInfo()
        {
            var jtr = CSPackSC.Default;
            if (this is not HKMMHollowKnightPackageDefV1 def) return jtr.CSHollowKnightPackageDef;
            return GetJsonTypeInfo(def.PackageVersion);
        }
        
        public static CSHollowKnightPackageDef? FromJson(JsonObject json)
        {
            if(json == null) return null;
            var jti = GetJsonTypeInfo(json);
            return (CSHollowKnightPackageDef?)JsonSerializer.Deserialize(json, jti.Type, Converter.Settings);
        }
        public string ToJson() => JsonSerializer.Serialize(this, GetJsonTypeInfo().Type, Converter.Settings);

        public List<string> GetAllDependencies(bool dev)
        {
            var list = new List<string>();
            void DoParse(References deps)
            {
                if (deps.StringArray is not null)
                {
                    foreach (var v in deps.StringArray)
                    {
                        list.Add(v);
                    }
                }
                if (deps.AnythingMap is not null)
                {
                    foreach (var v in deps.AnythingMap)
                    {
                        var d = v.Value.GetReferenceDef().Ref;
                        if (!string.IsNullOrEmpty(d.Version) ||
                            d.UseLatestPublished == true)
                        {
                            list.Add(v.Key);
                        }
                    }
                }
            }
            if (Value.Dependencies != null) DoParse(Value.Dependencies.Value);
            if (Value.DevDependencies != null && dev) DoParse(Value.DevDependencies.Value);
            return list;
        }
    }
}
