
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
    GetConfigPath= () => "config.json",
});

var data = JsonSerializer.Deserialize<PackCollection>(File.ReadAllText("TestDatabase.json"))!;

var installer = new LocalPackManager();
installer.Context = new(data);
await installer.LoadLocalPacks();

await TaskManager.StartTask("Test", async () =>
{
    await installer.InstallHKPackage(false, data["AbsoluteZote"].Value);
});

_ = Settings.Instance;

Debugger.Break();
