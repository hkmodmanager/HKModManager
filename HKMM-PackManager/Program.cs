
using HKMM.Pack.Metadata;
using HKMM.Pack.Installer;
using System.Text.Json;

var data = JsonSerializer.Deserialize<PackCollection>(File.ReadAllText("TestDatabase.json"))!;

var installer = new PackInstaller
{
    SaveRoot = "%(SaveRoot)",
    ModsRoot = "%(ModsRoot)",
    Context = new(data)
};

var packs = installer.GetAndSortPackages(installer.ParseDependencies(
    false,
    data["UnityExplorerPlus"],
    data["Test of Teamwork"],
    data["Hallownest-Vocalized"],
    data["SFCore"]
    ));

Console.WriteLine($"-----Packages: {packs.Count}");
Console.WriteLine(string.Join('\n', packs.Select(x => x.Value.Name)));

var files = packs.SelectMany(installer.GetAllFiles).ToList();

Console.WriteLine("-----Download Files:");
Console.WriteLine(string.Join('\n', files.Select(x => $"{x.Link} -> {x.Root} ({x.OverwriteName})")));


