global using static HKMM.Consts;

namespace HKMM
{
    public static class Consts
    {
        public const string HKMMPACK_MODSROOT_NAME = "ModsRoot";
        public const string HKMMPACK_SAVEROOT_NAME = "SaveRoot";
        public const string PACK_METADATA_FILE_NAME = "ModPackMetadata.json";
        public const string HKMMPACK_VERSION_NAME = "@hkmm-v3";

        public const string HKMMPACK_ENABLED_FILE_NAME = "HKMM-PACKENABLED";

        public const string MODPACK_NAME_MODDING_API = "$ModdingAPI$";
        public const string MODPACK_NAME_GAME_INJECT = ".hkmm-internal.gameinject";

        public const string API_FILE_NAME = "Assembly-CSharp.dll";
        public const string API_BACKUP_FILE_NAME = "Backup-API.backup";

        public const string INSTALLER_MAPI_NAME = "ModdingAPI";
        public const string INSTALLER_DEFAULT_NAME = "Default";
        public const string INSTALLER_GAMEINJECT_NAME = "GameInject";
        public const string INSTALLER_LOCAL_PACK_MANAGER_NAME = "LocalPackManager";
        public const string INSTALLER_LOCAL_CUSTOM_PACK_NAME = "LocalCustomPack";

        public const string GAMEINJECT_DLL_NAME = "GameInject.dll";
    }
}
