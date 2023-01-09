
global using System;
global using System.Linq;
global using System.Collections.Generic;
global using System.Net;

class FileDownload
{
    public static async Task<byte[]> DownloadFileSegment(string url, (int from, int to) range, (string, string)[]? header)
    {
        System.Net.ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
        var client = (HttpWebRequest)WebRequest.Create(url);
        client.Method = "GET";
        if(header is not null) 
        {
            foreach(var v in header) 
            {
                client.Headers.Set(v.Item1, v.Item2);
            }
        }
        client.AddRange(range.from, range.to);
        var resp = await client.GetResponseAsync();
        var buf = new byte[resp.ContentLength];
        var offset = 0;
        using(var stream = resp.GetResponseStream())
        {
            while(offset < resp.ContentLength) {
                offset += await stream.ReadAsync(buf, offset, buf.Length - offset);
            }
        }
        return buf;
    }
}
