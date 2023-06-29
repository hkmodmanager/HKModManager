#pragma warning disable CS8618

using System.Collections.Generic;
using System;
using Microsoft.JavaScript.NodeApi;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using System.Text.Json.Nodes;
using System.Linq;
using System.Text.Json;
using HKMM.Pack.Metadata.HKMM;

namespace HKMM.Pack.Metadata
{
    [JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
                                    IgnoreReadOnlyProperties = true,
                                    IgnoreReadOnlyFields = true,
                                    IncludeFields = false)]
    [JsonSerializable(typeof(CSHollowKnightPackageDef))]
    [JsonSerializable(typeof(Dictionary<string, ReferenceVersion>))]
    [JsonSerializable(typeof(string[]))]
    [JsonSerializable(typeof(DateTimeOffset))]
    [JsonSerializable(typeof(TimeOnly))]
    [JsonSerializable(typeof(HKMMPackage))]
    [JsonSerializable(typeof(HKMMHollowKnightPackageDefV1))]
    [JsonSerializable(typeof(PackCollection))]
    public partial class CSPackSC : JsonSerializerContext { }
    
    [JSExport]
    public partial class CSHollowKnightPackageDef : PackageBase
    {

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("additionalAssets")]
        public AdditionalAsset[] AdditionalAssets { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("authors")]
        public string[] Authors { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("dependencies")]
        public References? Dependencies { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("description")]
        public string Description { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("devDependencies")]
        public References? DevDependencies { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("releaseAssets")]
        public ReleaseAssets? ReleaseAssets { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("repository")]
        public string Repository { get; set; }
    }
    [JSExport]
    public partial class AdditionalAsset
    {
        [JsonPropertyName("downloadUrl")]
        public string DownloadUrl { get; set; }

        [JsonPropertyName("installPath")]
        public string InstallPath { get; set; }

        [JsonPropertyName("installRootDir")]
        public InstallationRoot InstallRootDir { get; set; }
    }
    [JSExport]
    public partial class ReferenceDef
    {
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("alternateInstallName")]
        public string AlternateInstallName { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("fileType")]
        public FileType? FileType { get; set; }

        [JsonPropertyName("ref")]
        public Reference Ref { get; set; }
    }
    [JSExport]
    public partial class Reference
    {
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("asset")]
        public ReleaseAssets? Asset { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("tag")]
        public string Tag { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("useLatestRelease")]
        public bool? UseLatestRelease { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("useLatestPublished")]
        public bool? UseLatestPublished { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("version")]
        public string Version { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("link")]
        public string Link { get; set; }
    }
    [JSExport]
    public partial class PlatformAssets
    {
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("linux")]
        public string Linux { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("macos")]
        public string Macos { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("win32")]
        public string Win32 { get; set; }
    }
    [JSExport]
    [JsonConverter(typeof(InstallationRootConverter))]
    public enum InstallationRoot { Mods, Saves };
    [JSExport]
    [JsonConverter(typeof(FileTypeConverter))]
    public enum FileType { Dll, Infer, Zip };
    
    [JSExport]
    [JsonConverter(typeof(ReleaseAssetsConverter))]
    public partial struct ReleaseAssets
    {
        public PlatformAssets? PlatformAssets { get; set; }
        public string? String { get; set; }

        public static implicit operator ReleaseAssets(PlatformAssets PlatformAssets) => new ReleaseAssets { PlatformAssets = PlatformAssets };
        public static implicit operator ReleaseAssets(string String) => new ReleaseAssets { String = String };

    }
    [JSExport]
    [JsonConverter(typeof(ReferenceVersionConverter))]
    public partial struct ReferenceVersion
    {
        public ReferenceDef? ReferenceDef { get; set; }
        public string? String { get; set; }

        public static implicit operator ReferenceVersion(ReferenceDef ReferenceDef) => new ReferenceVersion { ReferenceDef = ReferenceDef };
        public static implicit operator ReferenceVersion(string String) => new ReferenceVersion { String = String };

        private static readonly Regex modlinksVersionRegex = MyRegex();

        /// <summary>
        /// Fetches or constructs the final ReferenceDef representing this reference, processing the string version if needed.
        /// The created ReferenceDef may not be valid for serialization as modlinks versions and Git tag names are ambiguous.
        /// </summary>
        /// <returns>The ReferenceDef represented by this ReferenceVersion.</returns>
        /// <exception cref="InvalidOperationException">Thrown when both ReferenceDef and String versions are null.</exception>
        public ReferenceDef GetReferenceDef()
        {
            if (ReferenceDef != null)
            {
                return ReferenceDef;
            }
            if (String == null)
            {
                throw new InvalidOperationException("ReferenceDef and String are both null; one is needed to construct the correct ReferenceDef.");
            }
            string version = String;
            if (Uri.TryCreate(version, UriKind.Absolute, out var uriVersion))
            {
                return new ReferenceDef
                {
                    Ref = new Reference
                    {
                        Link = uriVersion.ToString(),
                    }
                };
            }
            else if (version == "@modlinks")
            {
                return new ReferenceDef
                {
                    Ref = new Reference
                    {
                        UseLatestPublished = true,
                    }
                };
            }
            else if (version == "@latest")
            {
                return new ReferenceDef
                {
                    Ref = new Reference
                    {
                        UseLatestRelease = true,
                    }
                };
            }
            else if (modlinksVersionRegex.IsMatch(version))
            {
                return new ReferenceDef
                {
                    Ref = new Reference
                    {
                        Version = version,
                    }
                };
            }
            else
            {
                return new ReferenceDef
                {
                    Ref = new Reference
                    {
                        Tag = version,
                    }
                };
            }
        }

        [GeneratedRegex("^(\\d+\\.){3}\\d+$")]
        private static partial Regex MyRegex();
    }
    [JSExport]
    [JsonConverter(typeof(ReferencesConverter))]
    public partial struct References
    {
        public Dictionary<string, ReferenceVersion> AnythingMap { get; set; }
        public string[] StringArray { get; set; }

        public static implicit operator References(Dictionary<string, ReferenceVersion> AnythingMap) => new References { AnythingMap = AnythingMap };
        public static implicit operator References(string[] StringArray) => new References { StringArray = StringArray };

    }
}

