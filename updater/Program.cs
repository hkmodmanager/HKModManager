global using System;
global using System.IO;
global using System.IO.Compression;
global using System.Diagnostics;

void CopyDirectory(string sourceDir, string destinationDir)
{
    // Get information about the source directory
    var dir = new DirectoryInfo(sourceDir);

    // Check if the source directory exists
    if (!dir.Exists)
        throw new DirectoryNotFoundException($"Source directory not found: {dir.FullName}");

    // Cache directories before we start copying
    DirectoryInfo[] dirs = dir.GetDirectories();

    // Create the destination directory
    Directory.CreateDirectory(destinationDir);

    // Get the files in the source directory and copy to the destination directory
    foreach (FileInfo file in dir.GetFiles())
    {
        string targetFilePath = Path.Combine(destinationDir, file.Name);
        if(File.Exists(targetFilePath)) File.Delete(targetFilePath);
        file.MoveTo(targetFilePath);
    }

    foreach (DirectoryInfo subDir in dirs)
    {
        string newDestinationDir = Path.Combine(destinationDir, subDir.Name);
        CopyDirectory(subDir.FullName, newDestinationDir);
    }

    dir.Delete();
}

Console.WriteLine(args.Length);
var startApp = args.Length < 1 ? true : bool.Parse(args[0]);
var waitProcess = args.Length < 2 ? 0 : int.Parse(args[1]);
var appRoot = Path.GetDirectoryName(typeof(Program).Assembly.Location);
var bin = Path.Combine(appRoot, "HKModManager.exe");
var binr = Path.Combine(appRoot, "_update");
var updatePack = Path.Combine(appRoot, "update.zip");
var nupdater = Path.Combine(binr, "updater");

if(File.Exists(updatePack)) {
    if(Directory.Exists(binr)) Directory.Delete(binr);
    using(var zip = ZipFile.OpenRead(updatePack)) {
        Directory.CreateDirectory(binr);
        zip.ExtractToDirectory(binr);
    }
    File.Delete(updatePack);
}

if (waitProcess > 0)
{
    var proc = Process.GetProcessById(waitProcess);
    proc?.WaitForExit();
}


if (Directory.Exists(binr))
{
    CopyDirectory(binr, Path.GetDirectoryName(bin));
}
if (startApp)
{
    var app = Process.Start(new ProcessStartInfo(Path.GetFullPath(bin))
    {

    });
}
