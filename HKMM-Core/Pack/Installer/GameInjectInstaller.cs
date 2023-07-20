using HKMM.Interop;
using HKMM.Pack.Metadata;
using HKMM.Pack.Provider;
using HKMM.Utils;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace HKMM.Pack.Installer
{
    public class GameInjectInstaller : PackInstaller<GameInjectInstaller>
    {
        [Serializable]
        public class Config
        {
            [JsonPropertyName("internalLibPath")]
            public string internalLibPath { get; set; } = "";
            [JsonPropertyName("modsPath")]
            public string modsPath { get; set; } = "";
            [JsonPropertyName("outputLog")]
            public bool outputLog { get; set; } = false;
            public static string ConfigPath => Path.Combine(MAPIInstaller.ManagedPath, "hkmm-gameinject.json");
            public static Config Load()
            {
                if (!File.Exists(ConfigPath)) return new();
                return JsonUtils.ToObject<Config>(File.ReadAllText(ConfigPath));
            }
            public void Save()
            {
                File.WriteAllText(ConfigPath, JsonUtils.ToJSON(this));
            }
        }

        public static string GameInjectDest => Path.Combine(MAPIInstaller.ManagedPath, GAMEINJECT_DLL_NAME);

        private HKMMPackage? CreateHKMMPackage()
        {
            var giv = NetUtils.GetAssemblyVersion(GameInjectDest);
            if(giv == null)
            {
                return null;
            }
            var c = Config.Load();
            if (string.IsNullOrEmpty(c.modsPath) || string.IsNullOrEmpty(c.internalLibPath)) return null;
            if(Path.GetFullPath(c.modsPath) != Path.GetFullPath(JS.Api.GetModStorePath())) return null;
            if (Path.GetFullPath(c.internalLibPath) != Path.GetFullPath(JS.Api.GetInternalLibRoot())) return null;
            Logger.Where();
            var p = new HKMMPackage()
            {
                Info = InternalPackageProvider.MP_GameInject.Clone().ToHKMMPackageDef(),
                Installer = this
            };
            Logger.Where();
            p.Info.Version = giv.ToString();
            return p;
        }

        public override Task<List<HKMMPackage>> GetInstalledPackage(List<HKMMPackage> pack)
        {
            Logger.Where();
            if (!File.Exists(GameInjectDest)) return Task.FromResult(pack);
            Logger.Where();
            pack.Add(CreateHKMMPackage()!);
            Logger.Where();
            return Task.FromResult(pack);
        }

        public override Task<HKMMPackage> InstallHKPackageUnsafe(CSHollowKnightPackageDef def, 
            Task[] waitTasks)
        {

            var scripts = ScriptingAssemblies.Load();
            var loads = RuntimeInitializeOnLoads.Load();

            var id = scripts.names.IndexOf(GAMEINJECT_DLL_NAME);
            if(id == -1)
            {
                scripts.names.Add(GAMEINJECT_DLL_NAME);
                scripts.types.Add((int)ScriptingAssemblies.ScriptingAssemblyType.CustomAssembly);
                scripts.Save();
            }
            var item = loads.root.FirstOrDefault(x => x.assemblyName == "GameInject");
            if(item == null)
            {
                item = new()
                {
                    assemblyName = "GameInject"
                };
                loads.root.Add(item);
            }
            item.methodName = "Init";
            item.nameSpace = "GameInject";
            item.className = "Main";
            item.loadTypes = (int)RuntimeInitializeOnLoads.RuntimeInitializeLoadType.AfterAssembliesLoaded;
            item.isUnityClass = false;
            loads.Save();

            var src = Path.Combine(JS.Api.GetGameInjectRoot(), GAMEINJECT_DLL_NAME);
            File.Copy(src, GameInjectDest, true);
            File.Copy(Path.ChangeExtension(src, "pdb"), Path.ChangeExtension(GameInjectDest, "pdb"), true);

            var config = new Config
            {
                internalLibPath = JS.Api.GetInternalLibRoot(),
                modsPath = JS.Api.GetModStorePath()
            };
            config.Save();

            return Task.FromResult(CreateHKMMPackage()!);
        }
        public override void UninstallPack(HKMMPackage pack)
        {
            throw new NotSupportedException();
        }
        public override bool IsEnabled(HKMMPackage pack)
        {
            return true;
        }
        public override void SetEnable(HKMMPackage pack, bool enabled)
        {
            
        }

        public static void TryInstallGameInject()
        {
            var pack = PackContext.rootContext.FindPack(MODPACK_NAME_GAME_INJECT)!.ToHKMMPackageDef();
            var local = LocalPackManager.Instance.FindPack(MODPACK_NAME_GAME_INJECT);
            if(local != null)
            {
                if(local.Info.Version == pack.Version)
                {
                    return;
                }
            }
            _ = DefaultInstaller.InstallHKPackage(false, pack);
        }
    }

}
