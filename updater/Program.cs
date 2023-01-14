global using System.Collections.Generic;
global using System.Linq;
global using System;
global using System.IO;
global using System.IO.Compression;
global using System.Diagnostics;
using System.Text;

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
        if (file.Name == "default_app.asar")
        {
            file.Delete();
            continue;
        }
        string targetFilePath = Path.Combine(destinationDir, file.Name);
        if (File.Exists(targetFilePath)) File.Delete(targetFilePath);
        file.MoveTo(targetFilePath);
    }

    foreach (DirectoryInfo subDir in dirs)
    {
        string newDestinationDir = Path.Combine(destinationDir, subDir.Name);
        CopyDirectory(subDir.FullName, newDestinationDir);
    }

    dir.Delete(true);
}

Console.WriteLine(args.Length);
var startApp = args.Length < 1 ? true : bool.Parse(args[0]);
var waitProcess = args.Length < 2 ? 0 : int.Parse(args[1]);
var appRoot = Path.GetDirectoryName(typeof(Program).Assembly.Location);
var bin = Path.Combine(appRoot, "HKModManager.exe");
var binr = Path.Combine(appRoot, "_update");
var updatePack = Path.Combine(appRoot, "update.zip");
var nupdater = Path.Combine(binr, "updater");

if (File.Exists(updatePack))
{
    if (Directory.Exists(binr)) Directory.Delete(binr, true);
    using (var zip = ZipFile.OpenRead(updatePack))
    {
        Directory.CreateDirectory(binr);
        zip.ExtractToDirectory(binr);
    }
    File.Delete(updatePack);
}

try
{
    if (waitProcess > 0)
    {
        var proc = Process.GetProcessById(waitProcess);
        proc?.WaitForExit();
    }
}
catch (System.Exception)
{
}



if (Directory.Exists(binr))
{
    CopyDirectory(binr, Path.GetDirectoryName(bin));
}
#region Processing Electron
var electron = Path.Combine(appRoot, "electron.exe");
if (File.Exists(electron))
{
    var buildExe = Path.Combine(appRoot, "HKModManager.exe");
    Console.WriteLine("Start patch electron.exe");
    var rcedit = Path.Combine(appRoot, "updater", "rcedit.exe");
    if (File.Exists(rcedit))
    {
        Console.WriteLine("Has rcedit.exe");
        Dictionary<string, string> versions = new() {
            {"CompanyName", "HKLab"},
            {"FileDescription", "HKModManager"},
            {"InternalName", "HKModManager"},
            {"LegalCopyright", "Copyright © 2023 HKLab"},
            {"ProductName", "HKModManager"},
            {"FileVersion", "0.0.0"},
            {"ProductVersion", "0.0.0"}
        };
        
        if (File.Exists(buildExe))
        {
            foreach (var v in versions.Keys.ToArray())
            {
                var proc = Process.Start(new ProcessStartInfo()
                {
                    Arguments = $@"{buildExe} --get-version-string {v}",
                    FileName = rcedit,
                    RedirectStandardOutput = true,
                    UseShellExecute = false
                });
                proc.WaitForExit();
                versions[v] = proc.StandardOutput.ReadToEnd();
            }
        }



        StringBuilder sb = new();
        sb.Append('\"');
        sb.Append(electron);
        sb.Append("\" ");
        foreach (var v in versions)
        {
            Console.WriteLine($"Version: {v.Key}={v.Value}");
            sb.Append(" --set-version-string ");
            sb.Append('\"');
            sb.Append(v.Key);
            sb.Append('\"');

            sb.Append(' ');
            sb.Append('\"');
            sb.Append(v.Value);
            sb.Append('\"');
        }

        var iconPath = Path.Combine(appRoot, "updater", "appicon.ico");
        if (File.Exists(iconPath))
        {
            sb.Append(" --set-icon \"");
            sb.Append(iconPath);
            sb.Append('\"');
        }
        Console.WriteLine($"Start: {rcedit} {sb.ToString()}");
        Process.Start(new ProcessStartInfo()
        {
            FileName = rcedit,
            Arguments = sb.ToString(),
            UseShellExecute = false
        }).WaitForExit();
    }
    if(File.Exists(buildExe)) File.Delete(buildExe);
    File.Move(electron, buildExe);
}
#endregion
if (startApp)
{
    var app = Process.Start(new ProcessStartInfo(Path.GetFullPath(bin))
    {

    });
}
