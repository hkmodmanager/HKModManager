
using HKMM.Pack.Metadata;
using HKMM.Pack.Installer;
using System.Text.Json;
using HKMM.Interop;
using System.Reflection;
using HKMM.Pack;
using System.Diagnostics;
using HKMM.Tasks;
using HKMM;

var msp = Path.GetFullPath(Path.Combine(Assembly.GetExecutingAssembly().Location, "..", "..", "..", "ModStore"));

JS.InitJSAPI(new()
{
    GetModStorePath = () => msp,
    GetConfigPath = () => "config.json",
    ParseAPILink = async _ => new HKMM.Pack.Legacy.LegacyModInfoFull(),
    ParseModLinks = async _ => new HKMM.Pack.Legacy.LegacyModCollection(),
    GetGameInjectRoot = () => "F:\\HKLab\\HKMM\\gameinject\\Output"
}); ;

var data = JsonSerializer.Deserialize<PackCollection>(File.ReadAllText("TestDatabase.json"))!;

PackContext.customProviders.fallback.Add(new(data));

var installer = LocalPackManager.Instance;

await installer.LoadLocalPacks();

await TaskManager.StartTask("Test", async () =>
{
    await installer.InstallHKPackage(false, data["Custom Knight"].Value);
});

_ = Settings.Instance;

Debugger.Break();
