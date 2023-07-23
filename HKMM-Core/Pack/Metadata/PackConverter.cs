using HKMM.Pack.Metadata;
using System.Collections.Generic;
using System.Globalization;
using System.Text.Json.Serialization;
using System.Text.Json;
using System;
using Microsoft.JavaScript.NodeApi;
using HKMM.Pack.Metadata.Providers;

namespace HKMM.Pack.Metadata;

internal static class Converter
{
    public static readonly JsonSerializerOptions Settings = new(JsonSerializerDefaults.General)
    {
        Converters =
            {
                InstallationRootConverter.Singleton,
                ReferencesConverter.Singleton,
                ReferenceVersionConverter.Singleton,
                FileTypeConverter.Singleton,
                ReleaseAssetsConverter.Singleton,
                new DateOnlyConverter(),
                new TimeOnlyConverter(),
                IsoDateTimeOffsetConverter.Singleton,
                PackageConverter.Singleton,
            },
        PropertyNameCaseInsensitive = true,
        TypeInfoResolver = CSPackSC.Default,
        WriteIndented = true
    };
}

internal class InstallationRootConverter : JsonConverter<InstallationRoot>
{
    public override bool CanConvert(Type t) => t == typeof(InstallationRoot);

    public override InstallationRoot Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        switch (value)
        {
            case "mods":
                return InstallationRoot.Mods;
            case "saves":
                return InstallationRoot.Saves;
        }
        throw new Exception("Cannot unmarshal type InstallationRoot");
    }

    public override void Write(Utf8JsonWriter writer, InstallationRoot value, JsonSerializerOptions options)
    {
        switch (value)
        {
            case InstallationRoot.Mods:
                JsonSerializer.Serialize(writer, "mods", options);
                return;
            case InstallationRoot.Saves:
                JsonSerializer.Serialize(writer, "saves", options);
                return;
        }
        throw new Exception("Cannot marshal type InstallationRoot");
    }

    public static readonly InstallationRootConverter Singleton = new();
}

internal class ReferencesConverter : JsonConverter<References>
{
    public override bool CanConvert(Type t) => t == typeof(References);

    public override References Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        switch (reader.TokenType)
        {
            case JsonTokenType.StartObject:
                var objectValue = JsonSerializer.Deserialize<Dictionary<string, ReferenceVersion>>(ref reader, options);
                return new References { AnythingMap = objectValue! };
            case JsonTokenType.StartArray:
                var arrayValue = JsonSerializer.Deserialize<string[]>(ref reader, options);
                return new References { StringArray = arrayValue! };
        }
        throw new Exception("Cannot unmarshal type References");
    }

    public override void Write(Utf8JsonWriter writer, References value, JsonSerializerOptions options)
    {
        if (value.StringArray != null)
        {
            JsonSerializer.Serialize(writer, value.StringArray, options);
            return;
        }
        if (value.AnythingMap != null)
        {
            JsonSerializer.Serialize(writer, value.AnythingMap, options);
            return;
        }
        throw new Exception("Cannot marshal type References");
    }

    public static readonly ReferencesConverter Singleton = new();
}

internal class ReferenceVersionConverter : JsonConverter<ReferenceVersion>
{
    public override bool CanConvert(Type t) => t == typeof(ReferenceVersion);

    public override ReferenceVersion Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        switch (reader.TokenType)
        {
            case JsonTokenType.String:
                var stringValue = reader.GetString();
                return new ReferenceVersion { String = stringValue };
            case JsonTokenType.StartObject:
                var objectValue = JsonSerializer.Deserialize<ReferenceDef>(ref reader, options);
                return new ReferenceVersion { ReferenceDef = objectValue };
        }
        throw new Exception("Cannot unmarshal type ReferenceVersion");
    }

    public override void Write(Utf8JsonWriter writer, ReferenceVersion value, JsonSerializerOptions options)
    {
        if (value.String != null)
        {
            JsonSerializer.Serialize(writer, value.String, options);
            return;
        }
        if (value.ReferenceDef != null)
        {
            JsonSerializer.Serialize(writer, value.ReferenceDef, options);
            return;
        }
        throw new Exception("Cannot marshal type ReferenceVersion");
    }

    public static readonly ReferenceVersionConverter Singleton = new();
}

internal class FileTypeConverter : JsonConverter<FileType>
{
    public override bool CanConvert(Type t) => t == typeof(FileType);

    public override FileType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        switch (value)
        {
            case "dll":
                return FileType.Dll;
            case "infer":
                return FileType.Infer;
            case "zip":
                return FileType.Zip;
        }
        throw new Exception("Cannot unmarshal type FileType");
    }

    public override void Write(Utf8JsonWriter writer, FileType value, JsonSerializerOptions options)
    {
        switch (value)
        {
            case FileType.Dll:
                JsonSerializer.Serialize(writer, "dll", options);
                return;
            case FileType.Infer:
                JsonSerializer.Serialize(writer, "infer", options);
                return;
            case FileType.Zip:
                JsonSerializer.Serialize(writer, "zip", options);
                return;
        }
        throw new Exception("Cannot marshal type FileType");
    }

    public static readonly FileTypeConverter Singleton = new();
}

internal class ReleaseAssetsConverter : JsonConverter<ReleaseAssets>
{
    public override bool CanConvert(Type t) => t == typeof(ReleaseAssets);

    public override ReleaseAssets Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        switch (reader.TokenType)
        {
            case JsonTokenType.String:
                var stringValue = reader.GetString();
                return new ReleaseAssets { String = stringValue };
            case JsonTokenType.StartObject:
                var objectValue = JsonSerializer.Deserialize<PlatformAssets>(ref reader, options);
                return new ReleaseAssets { PlatformAssets = objectValue };
        }
        throw new Exception("Cannot unmarshal type ReleaseAssets");
    }

    public override void Write(Utf8JsonWriter writer, ReleaseAssets value, JsonSerializerOptions options)
    {
        if (value.String != null)
        {
            JsonSerializer.Serialize(writer, value.String, options);
            return;
        }
        if (value.PlatformAssets != null)
        {
            JsonSerializer.Serialize(writer, value.PlatformAssets, options);
            return;
        }
        throw new Exception("Cannot marshal type ReleaseAssets");
    }

    public static readonly ReleaseAssetsConverter Singleton = new();
}

public class DateOnlyConverter : JsonConverter<DateOnly>
{
    private readonly string serializationFormat;
    public DateOnlyConverter() : this(null) { }

    public DateOnlyConverter(string? serializationFormat)
    {
        this.serializationFormat = serializationFormat ?? "yyyy-MM-dd";
    }

    public override DateOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return DateOnly.Parse(value!);
    }

    public override void Write(Utf8JsonWriter writer, DateOnly value, JsonSerializerOptions options)
        => writer.WriteStringValue(value.ToString(serializationFormat));
}

public class TimeOnlyConverter : JsonConverter<TimeOnly>
{
    private readonly string serializationFormat;

    public TimeOnlyConverter() : this(null) { }

    public TimeOnlyConverter(string? serializationFormat)
    {
        this.serializationFormat = serializationFormat ?? "HH:mm:ss.fff";
    }

    public override TimeOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return TimeOnly.Parse(value!);
    }

    public override void Write(Utf8JsonWriter writer, TimeOnly value, JsonSerializerOptions options)
        => writer.WriteStringValue(value.ToString(serializationFormat));
}

internal class IsoDateTimeOffsetConverter : JsonConverter<DateTimeOffset>
{
    public override bool CanConvert(Type t) => t == typeof(DateTimeOffset);

    private const string DefaultDateTimeFormat = "yyyy'-'MM'-'dd'T'HH':'mm':'ss.FFFFFFFK";

    private DateTimeStyles _dateTimeStyles = DateTimeStyles.RoundtripKind;
    private string? _dateTimeFormat;
    private CultureInfo? _culture;

    public DateTimeStyles DateTimeStyles
    {
        get => _dateTimeStyles;
        set => _dateTimeStyles = value;
    }

    public string? DateTimeFormat
    {
        get => _dateTimeFormat ?? string.Empty;
        set => _dateTimeFormat = (string.IsNullOrEmpty(value)) ? null : value;
    }

    public CultureInfo Culture
    {
        get => _culture ?? CultureInfo.CurrentCulture;
        set => _culture = value;
    }

    public override void Write(Utf8JsonWriter writer, DateTimeOffset value, JsonSerializerOptions options)
    {
        string text;


        if ((_dateTimeStyles & DateTimeStyles.AdjustToUniversal) == DateTimeStyles.AdjustToUniversal
            || (_dateTimeStyles & DateTimeStyles.AssumeUniversal) == DateTimeStyles.AssumeUniversal)
        {
            value = value.ToUniversalTime();
        }

        text = value.ToString(_dateTimeFormat ?? DefaultDateTimeFormat, Culture);

        writer.WriteStringValue(text);
    }

    public override DateTimeOffset Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        string? dateText = reader.GetString();

        if (string.IsNullOrEmpty(dateText) == false)
        {
            if (!string.IsNullOrEmpty(_dateTimeFormat))
            {
                return DateTimeOffset.ParseExact(dateText, _dateTimeFormat, Culture, _dateTimeStyles);
            }
            else
            {
                return DateTimeOffset.Parse(dateText, Culture, _dateTimeStyles);
            }
        }
        else
        {
            return default;
        }
    }


    public static readonly IsoDateTimeOffsetConverter Singleton = new();
}


