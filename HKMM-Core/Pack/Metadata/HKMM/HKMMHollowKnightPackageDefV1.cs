using HKMM.Pack.Installer;
using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace HKMM.Pack.Metadata.HKMM
{
    [JsonConverter(typeof(TypeEnumConverter))]
    public enum TypeEnum { Mod, ModPack };
    internal class TypeEnumConverter : JsonConverter<TypeEnum>
    {
        public override bool CanConvert(Type t) => t == typeof(TypeEnum);

        public override TypeEnum Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.GetString();
            switch (value)
            {
                case "Mod":
                    return TypeEnum.Mod;
                case "ModPack":
                    return TypeEnum.ModPack;
            }
            throw new Exception("Cannot unmarshal type TypeEnum");
        }

        public override void Write(Utf8JsonWriter writer, TypeEnum value, JsonSerializerOptions options)
        {
            switch (value)
            {
                case TypeEnum.Mod:
                    JsonSerializer.Serialize(writer, "Mod", options);
                    return;
                case TypeEnum.ModPack:
                    JsonSerializer.Serialize(writer, "ModPack", options);
                    return;
            }
            throw new Exception("Cannot marshal type TypeEnum");
        }

        public static readonly TypeEnumConverter Singleton = new();
    }

    public partial class HKMMHollowKnightPackageDefV1 : CSHollowKnightPackageDef, ICustomInstallerProvider
    {
        public HKMMHollowKnightPackageDefV1()
        {
            PackageVersion = PACKAGE_VERSION;
        }

        public void CopyFrom(CSHollowKnightPackageDef def)
        {
            PackageVersion = 1;
            Version = def.Version ?? "0.0.0.0";
            Type = def.ReleaseAssets == null ? TypeEnum.ModPack : TypeEnum.Mod;

            AdditionalAssets = def.AdditionalAssets;
            ReleaseAssets = def.ReleaseAssets;
            Repository = def.Repository;
            Dependencies = def.Dependencies;
            DevDependencies = def.DevDependencies;
            Description = def.Description;
            Name = def.Name;
            Tags = def.Tags;
        }

        protected virtual int PACKAGE_VERSION => 1;

        [JsonPropertyName("packageVersion")]
        public int PackageVersion { get; set; }
        
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("displayName")]
        public string DisplayName { get; set; } = null!;
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("publishDate")]
        public string PublishDate { get; set; } = null!;

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("icon")]
        public string Icon { get; set; } = null!;

        [JsonPropertyName("type")]
        public TypeEnum Type { get; set; }

        public bool AllowToggle { get; set; } = true;
        public bool AllowInstall { get; set; } = true;
        public bool AllowUninstall { get; set; } = true;

        [JsonIgnore]
        public bool IsHidden { get; set; } = false;
        [JsonIgnore]
        public bool IsImportant { get; set; } = false;

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("installerType")]
        public PackInstaller? Installer { get; set; }
        public DateTime PublishDateCS => string.IsNullOrEmpty(PublishDate) ? DateTime.MinValue : DateTime.Parse(PublishDate);
    }
}
