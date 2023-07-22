using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace HKMM.Modules.Upload
{
    public class PastebinUploadModule : UploadModuleBase<PastebinUploadModule>
    {
        public override async Task<string> Upload(string? name, string data)
        {
            var form = new MultipartFormDataContent()
            {
                { new StringContent("w6VD3O4rMTkJ1DKdraH8SgwVqA6waCFN"), "api_dev_key" },
                { new StringContent(data), "api_paste_code" },
                { new StringContent(name ?? ""), "api_paste_name" },
                { new StringContent("paste"), "api_option" },
                { new StringContent("text"), "api_paste_format" },
                { new StringContent("0"), "api_paste_private" },
                { new StringContent("N"), "api_paste_expire_date" },
            };
            var resp = await WebModule.Client.PostAsync("https://pastebin.com/api/api_post.php", form);
            resp.EnsureSuccessStatusCode();
            return await resp.Content.ReadAsStringAsync();
        }

        public override Task<string> Upload(string? name, byte[] data)
        {
            return Upload(name, BitConverter.ToString(data));
        }
    }
}
