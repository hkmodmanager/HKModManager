using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using static HKMM.Pack.Metadata.Providers.HKMMProviderV1;

namespace HKMM.Pack.Metadata.Providers
{
    internal class PackageConverter : JsonConverter<Package>
    {
        public override bool CanConvert(Type t) => t == typeof(Package);

        public override Package Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            switch (reader.TokenType)
            {
                case JsonTokenType.String:
                    var stringValue = reader.GetString();
                    try
                    {
                        var uri = new Uri("about:blank");
                        if (!string.IsNullOrEmpty(stringValue))
                        {
                            uri = new Uri(stringValue);
                        }
                        return new Package { PurpleUri = uri };
                    }
                    catch (UriFormatException) { }
                    break;
                case JsonTokenType.StartObject:
                    var objectValue = JsonSerializer.Deserialize<PackageBase>(ref reader, options);
                    return new Package { Pack = objectValue! };
            }
            throw new Exception("Cannot unmarshal type Package");
        }

        public override void Write(Utf8JsonWriter writer, Package value, JsonSerializerOptions options)
        {
            if (value.PurpleUri != null)
            {
                JsonSerializer.Serialize(writer, value.PurpleUri.ToString(), options);
                return;
            }
            if (value.Pack != null)
            {
                JsonSerializer.Serialize(writer, value.Pack, options);
                return;
            }
            throw new Exception("Cannot marshal type Package");
        }

        public static readonly PackageConverter Singleton = new();
    }
    public partial class HKMMProviderV1
    {
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("authors")]
        public List<string>? Authors { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("description")]
        public string Description { get; set; } = "A Package Provider";

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("icon")]
        public string? Icon { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("name")]
        public string Name { get; set; } = "";

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("packages")]
        public List<Package>? Packages { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("repository")]
        public Uri? Repository { get; set; }

        public partial struct Package
        {
            public PackageBase Pack;
            public Uri PurpleUri;

            public static implicit operator Package(PackageBase Pack) => new() { Pack = Pack };
            public static implicit operator Package(Uri PurpleUri) => new() { PurpleUri = PurpleUri };
        }
    }
}
