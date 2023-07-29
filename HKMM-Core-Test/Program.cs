
using HKMM.Pack.Metadata;
using HKMM.Pack.Installer;
using System.Text.Json;
using HKMM.Interop;
using System.Reflection;
using HKMM.Pack;
using System.Diagnostics;
using HKMM.Tasks;
using HKMM;
using HKMM.Modules.Upload;
using HKMM.Pack.Provider.Custom;
using HKMM.Modules;

var msp = Path.GetFullPath(Path.Combine(Assembly.GetExecutingAssembly().Location, "..", "..", "..", "ModStore"));

JS.InitJSAPI(new()
{
    GameInjectRoot =  "F:\\HKLab\\HKMM\\gameinject\\Output",
    CacheDir = "Cache"
});

Settings.LoadSettings("config.json");

var data = JsonSerializer.Deserialize<PackCollection>(File.ReadAllText("TestDatabase.json"))!;

var ts1 = new CustomPackagesProvider("local:TestSource.json");
PackContext.customProviders.fallback.Add(ts1);
PackContext.customProviders.fallback.Add(new(data));

var installer = LocalPackManager.Instance;

ts1.MakeSureInit().Wait();
await Task.Delay(10);
await installer.LoadLocalPacks();

var test1 = PackContext.rootContext.FindPack("test.Test1");

var builder = new PackBuilder();
builder.AddDependency(test1!.ToHKMMPackageDef());
builder.AddDependency(PackContext.rootContext.FindPack("Test")!.ToHKMMPackageDef());
builder.AddDependency(PackContext.rootContext.FindPack("Test.12")!.ToHKMMPackageDef());

var result = builder.Build();

CacheModule.Instance.SetObject("P-Test-A", result);

Debugger.Break();
