using HKMM.Tasks;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using System.Web;

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
#if TEST_DATA
            [@"https://github.com/hk-modding/modlinks/raw/main/ApiLinks.xml"] = @"F:\HKLab\HKMM-Data\ApiLinks.xml",
            [@"https://github.com/hk-modding/modlinks/raw/main/ModLinks.xml"] = @"F:\HKLab\HKMM-Data\ModLinks.xml",
            [@"https://github.com/hk-modding/api/releases/download/1.5.78.11833-74/ModdingApiWin.zip"] = @"F:\HKLab\HKMM-Data\ModdingApiWin.zip"
#endif
        };
        public static SocketsHttpHandler Handler { get; } = new();
        public static HttpClient Client { get; } = new(Handler);
        public virtual async Task<(string, byte[], bool)> DownloadRawFileDirect(string uri, bool noThrow = false)
        {
            if (localFiles.TryGetValue(uri, out var lf))
            {
                return (Path.GetFileName(lf), FileModule.Instance.ReadBytes(lf), true);
            }


            Logger.Log($"Downloading {uri}");
            string? fileName = null;
            var result = await Client.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead);
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
            if(uri.StartsWith("local:"))
            {
                var p = uri[6..];
                return (Path.GetFileName(p), FileModule.Instance.ReadBytes(p));
            }
            if(uri.StartsWith("data:"))
            {
                //Data URL
                var dataStart = uri.IndexOf(',');
                var header = uri[..dataStart];
                var isBase64 = header.Contains(";base64");
                var data = uri[(dataStart + 1)..]!;
                if(isBase64)
                {
                    return ("", Convert.FromBase64String(data));
                }
                else
                {
                    return ("", HttpUtility.UrlDecodeToBytes(data));
                }
            }
            var uri_inst = new Uri(uri);
            if (Settings.Instance.CDN == "GH_PROXY" &&
                githubHost.Contains(uri_inst.Host, StringComparer.OrdinalIgnoreCase))
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

        public virtual async Task<string> DownloadTextFile(string uri, bool saveCache = true)
        {
            try
            {
                var result = Encoding.UTF8.GetString((await DownloadRawFile(uri)).Item2);
                if(saveCache)
                {
                    CacheModule.Instance.SetString("TextCache", uri, result);
                }
                return result;
            } catch(Exception ex)
            {
                Logger.LogError(ex.ToString());
                var data = saveCache ? CacheModule.Instance.GetString("TextCache", uri) : null;
                if(data != null)
                {
                    return data;
                }
                else
                {
                    throw;
                }
            }
        }
    }
}
