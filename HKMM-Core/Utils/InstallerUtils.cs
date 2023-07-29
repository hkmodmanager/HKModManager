using HKMM.Pack;
using HKMM.Pack.Installer;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace HKMM.Utils
{
    public static class InstallerUtils
    {
        internal class PackInstallerConverter : JsonConverter<PackInstaller>
        {
            public override PackInstaller? Read(ref Utf8JsonReader reader, Type typeToConvert, 
                JsonSerializerOptions options)
            {
                return GetInstaller(reader.GetString()!);
            }

            public override void Write(Utf8JsonWriter writer, PackInstaller value, 
                JsonSerializerOptions options)
            {
                writer.WriteStringValue(GetInstallerName(value));
            }
        }
        public readonly static Dictionary<string, PackInstaller> nameToInstaller = new()
        {
            [INSTALLER_MAPI_NAME] = MAPIInstaller.Instance,
            [INSTALLER_GAMEINJECT_NAME] = GameInjectInstaller.Instance,
            [INSTALLER_DEFAULT_NAME] = PackInstaller.DefaultInstaller,
            [INSTALLER_LOCAL_PACK_MANAGER_NAME] = LocalPackManager.Instance,
            [INSTALLER_LOCAL_CUSTOM_PACK_NAME] = LocalPackInstaller.Instance
        };
        public readonly static Dictionary<PackInstaller, string> installerToName;

        static InstallerUtils()
        {
            var dict = new Dictionary<PackInstaller, string>();
            foreach(var v in nameToInstaller)
            {
                if(v.Value == null)
                {
                    Logger.LogError("Missing installer: " + v.Key);
                    continue;
                }
                dict.Add(v.Value, v.Key); 
            }
            installerToName = dict;
        }
        public static PackInstaller GetInstaller(string name)
        {
            return nameToInstaller[name];
        }
        public static string GetInstallerName(PackInstaller installer)
        {
            return installerToName[installer];
        }
        public static PackInstaller GetInstaller(this ICustomInstallerProvider provider)
        {
            return provider.Installer ?? PackInstaller.DefaultInstaller;
        }
    }
}
