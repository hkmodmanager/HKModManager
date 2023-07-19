using HKMM.Tasks;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Modules
{
    public class WebModule : ModuleBase<WebModule>
    {
        public static readonly List<string> githubHost = new()
        {
            "github.com",
            "raw.githubusercontent.com"
        };
        public static readonly Dictionary<string, string> localFiles = new()
        {
            [@"https://github.com/hk-modding/modlinks/raw/main/ApiLinks.xml"] = @"F:\HKLab\HKMM-Data\ApiLinks.xml",
            [@"https://github.com/hk-modding/modlinks/raw/main/ModLinks.xml"] = @"F:\HKLab\HKMM-Data\ModLinks.xml",
            [@"https://github.com/hk-modding/api/releases/download/1.5.78.11833-74/ModdingApiWin.zip"] = @"F:\HKLab\HKMM-Data\ModdingApiWin.zip"
        };
        private readonly HttpClient client = new();
        public virtual async Task<(string, byte[], bool)> DownloadRawFileDirect(string uri, bool noThrow = false)
        {
            //TODO:
            if(localFiles.TryGetValue(uri, out var lf))
            {
                return (Path.GetFileName(lf), File.ReadAllBytes(lf), true);
            }


            Logger.Log($"Downloading {uri}");
            string? fileName = null;
            var result = await client.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead);
            Logger.Log($"Response header:");
            foreach (var header in result.Headers)
            {
                Logger.Log($"{header.Key}: " + string.Join(',', header.Value));
            }
            if (!noThrow) result.EnsureSuccessStatusCode();
            else if (!result.IsSuccessStatusCode)
            {
                return ("", null!, false);
            }
            var disp = result.Content.Headers.ContentDisposition;
            if (disp != null)
            {
                fileName = disp.FileName;
            }
            if (string.IsNullOrEmpty(fileName))
            {
                fileName = Path.GetFileName(uri);
            }
            using var ms = new MemoryStream();
            var t = result.Content.CopyToAsync(ms);
            var len = result.Content.Headers.ContentLength ?? 0;
            Logger.Log("File size: " + len);
            if (len > 0 && TaskManager.CurrentTask is not null)
            {
                var task = TaskManager.CurrentTask;
                _ = Task.Run(async () =>
                {
                    while (!t.IsCompleted)
                    {
                        task.Progress = (int)Math.Round((float)ms.Length / len * 100);
                        Logger.Log($"Progress: {task.Progress}", LogLevel.Fine);
                        await Task.Delay(500);
                    }
                });
            }
            await t;
            if (TaskManager.CurrentTask != null) TaskManager.CurrentTask!.Progress = 100;
            return (fileName, ms.ToArray(), true);
        }
        public virtual async Task<(string, byte[])> DownloadRawFile(string uri)
        {
            var uri_inst = new Uri(uri);
            if (githubHost.Contains(uri_inst.Host, StringComparer.OrdinalIgnoreCase))
            {
                foreach (var v in Settings.Instance.MirrorGithub)
                {
                    try
                    {
                        var u = "https://" + v + "/" + uri;
                        var (filename, data, s) = await DownloadRawFileDirect(u, true);
                        if (s)
                        {
                            return (filename, data);
                        }
                    }
                    catch (Exception)
                    {
                        Logger.LogWarning($"Mirror `{v}` is unavailable");
                    }
                    
                }
            }
            
            {
                Logger.Log("Use the original download URL");
                var (filename, data, s) = await DownloadRawFileDirect(uri, false);
                return (filename, data);
            }
        }
    }
}
