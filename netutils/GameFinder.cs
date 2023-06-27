using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using Microsoft.Win32;
using Path = System.IO.Path;

namespace HKMM;
public static class GameFileHelper
{
    public static readonly int HOLLOWKNIGHT_APP_ID = 367520;
    public static readonly string HOLLOWKNIGHT_GAME_NAME = "Hollow Knight";


    public static string? FindSteamGamePath(int appid, string gameName)
    {
        string? appsPath;
        if ((appsPath = (string?)ReadRegistrySafe("Software\\Valve\\Steam", "SteamPath")) != null)
        {
            appsPath = Path.Combine(appsPath, "steamapps");

            if (File.Exists(Path.Combine(appsPath, $"appmanifest_{appid}.acf")))
            {
                return Path.Combine(Path.Combine(appsPath, "common"), gameName);
            }

            return SearchAllInstallations(Path.Combine(appsPath, "libraryfolders.vdf"), appid, gameName);
        }

        return null;
    }

    private static string? SearchAllInstallations(string libraryfolders, int appid, string gameName)
    {
        if (!File.Exists(libraryfolders))
        {
            return null;
        }
        StreamReader file = new(libraryfolders);
        string? line;
        while ((line = file.ReadLine()) != null)
        {
            line = line.Trim();
            line = Regex.Unescape(line);
            Match regMatch = Regex.Match(line, "\"(.*)\"\\s*\"(.*)\"");
            string key = regMatch.Groups[1].Value;
            string value = regMatch.Groups[2].Value;
            if (key == "path")
            {
                if (File.Exists(Path.Combine(value, "steamapps", $"appmanifest_{appid}.acf")))
                {
                    return Path.Combine(Path.Combine(value, "steamapps", "common"), gameName);
                }
            }
        }

        return null;
    }

    private static object? ReadRegistrySafe(string path, string key)
    {
        if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            return null;

        using (RegistryKey? subkey = Registry.CurrentUser.OpenSubKey(path))
        {
            if (subkey != null)
            {
                return subkey.GetValue(key);
            }
        }

        return null;
    }
}

