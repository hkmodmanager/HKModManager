using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Modules
{
    public class SHA256Tuple
    {
        public string FullHash { get; set; } = "";
        public string FastHash { get; set; } = "";
    }
    public class SHA256Module : ModuleBase<SHA256Module>
    {
        private readonly SHA256 sha256 = SHA256.Create();
        private readonly ThreadLocal<byte[]> fastSha256Buffer = new(() => new byte[512 * 1024]);

        public virtual SHA256Tuple CalcSHA256Tuple(Stream stream)
        {
            var result = new SHA256Tuple();
            var p = stream.Position;
            result.FastHash = CalcFastSHA256(stream);
            stream.Position = p;
            result.FullHash = CalcSHA256(stream);
            return result;
        }
        public virtual SHA256Tuple CalcSHA256Tuple(byte[] data, int? offset = null, int? length = null)
        {
            var result = new SHA256Tuple();
            result.FastHash = CalcFastSHA256(data, offset, length);
            result.FullHash = CalcSHA256(data, offset, length);
            return result;
        }
        public virtual string CalcSHA256(Stream stream)
        {
            return BitConverter.ToString(sha256.ComputeHash(stream)).Replace("-", "").ToLower();
        }
        public virtual string CalcSHA256(byte[] data, int? offset = null, int? length = null)
        {
            return BitConverter.ToString(sha256.ComputeHash(data, offset ?? 0, length ?? data.Length))
                .Replace("-", "").ToLower();
        }
        public virtual string CalcFastSHA256(Stream stream)
        {
            var buffer = fastSha256Buffer.Value!;
            var s = stream.Read(buffer, 0, buffer.Length);
            return CalcSHA256(buffer, 0, s);
        }
        public virtual string CalcFastSHA256(byte[] data, int? offset = null, int? length = null)
        {
            var buffer = fastSha256Buffer.Value!;
            var c = Math.Min(length ?? data.Length, buffer.Length);
            return CalcSHA256(buffer, offset, c);
        }
        public virtual bool CompareSHA256(Stream data, SHA256Tuple sha256)
        {
            var p = data.Position;
            try
            {
                if (sha256.FastHash != CalcFastSHA256(data))
                {
                    return false;
                }
                data.Position = p;
                return sha256.FullHash == CalcSHA256(data);
            }
            finally
            {
                data.Position = p;
            }
        }
        public virtual bool CompareSHA256(byte[] data, SHA256Tuple sha256, int? offset = null, int? length = null)
        {
            if (sha256.FastHash != CalcFastSHA256(data, offset, length)) return false;
            return sha256.FullHash != CalcSHA256(data, offset, length);
        }
    }
}
