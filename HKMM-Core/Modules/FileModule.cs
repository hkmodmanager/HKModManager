using HKMM.Interop;
using HKMM.UACHelper;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Security;
using System.Text;
using System.Threading.Tasks;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace HKMM.Modules
{
    public class FileModule : ModuleBase<FileModule>
    {

        public virtual Task<byte[]> ReadBytesUAC(string path)
        {
            UACHelperServer.CheckUACProcess();
            throw new NotImplementedException();
        }
        public virtual Task WriteBytesUAC(string path)
        {
            UACHelperServer.CheckUACProcess();
            throw new NotImplementedException();
        }
        public virtual async Task<byte[]> ReadBytesAsync(string path)
        {
            try
            {
                return await File.ReadAllBytesAsync(path);
            }
            catch (SecurityException)
            {
                return await ReadBytesUAC(path);
            }
        }
        public virtual byte[] ReadBytes(string path)
        {
            return File.ReadAllBytes(path);
        }
        public virtual string ReadText(string path)
        {
            return File.ReadAllText(path);
        }
        public virtual async Task WriteBytesAsync(string path, byte[] data)
        {
            try
            {
                await File.WriteAllBytesAsync(path, data);
            }
            catch (SecurityException)
            {
                await UACHelperServer.WriteFileAsync(path, data);
            }
        }
        public virtual void WriteBytes(string path, byte[] data)
        {
            try
            {
                File.WriteAllBytesAsync(path, data);
            }
            catch (SecurityException)
            {
                UACHelperServer.WriteFile(path, data);
            }
        }
        public virtual Task WriteTextAsync(string path, string text)
        {
            return WriteBytesAsync(path, Encoding.UTF8.GetBytes(text));
        }
        public virtual void WriteText(string path, string text)
        {
            WriteBytes(path, Encoding.UTF8.GetBytes(text));
        }

        public virtual void Delete(string path)
        {
            try
            {
                if (File.Exists(path))
                {
                    File.Delete(path);
                }
                else if (Directory.Exists(path))
                {
                    Directory.Delete(path, true);
                }
            }
            catch (SecurityException)
            {
                UACHelperServer.Delete(path);
            }
        }
    }
}
