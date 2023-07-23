using HKMM.Tasks;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Modules.Upload
{
    public class CatboxUploadModule : UploadModuleBase<CatboxUploadModule>
    {
        public override async Task<string> Upload(string? name, byte[] data)
        {
            using var ms = new MemoryStream(data);
            var form = new MultipartFormDataContent
            {
                { new StreamContent(ms), "fileToUpload", name ?? "upload" },
                { new StringContent("fileupload"), "reqtype" }
            };

            var curTask = TaskManager.CurrentTask;
            if(curTask != null)
            {
                _ = Task.Run(async () =>
                {
                    while(ms.CanRead)
                    {
                        var progress = (int) Math.Round(ms.Position / (float)ms.Length) * 100;
                        curTask.Progress = progress;
                        Logger.Log("Progress: " + progress);
                        await Task.Delay(500);
                    }
                    curTask.Progress = 100;
                });
            }

            var resp = await WebModule.Client.PostAsync("https://catbox.moe/user/api.php", form);
            //resp.EnsureSuccessStatusCode();
            return await resp.Content.ReadAsStringAsync();
        }
    }
}
