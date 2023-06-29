using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Modules
{
    public class WebModule : ModuleBase<WebModule>
    {
        private readonly HttpClient client = new();
        public virtual async Task<(string, byte[])> DownloadRawFile(string uri)
        {
            string? fileName = null;
            var result = await client.GetAsync(uri);
            result.EnsureSuccessStatusCode();
            var disp = result.Content.Headers.ContentDisposition;
            if(disp != null)
            {
                fileName = disp.FileName;
            }
            if(string.IsNullOrEmpty(fileName))
            {
                fileName = Path.GetFileName(uri);
            }
            return (fileName, await result.Content.ReadAsByteArrayAsync());
        }
    }
}
