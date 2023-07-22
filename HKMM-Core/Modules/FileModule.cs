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

namespace HKMM.Modules
{
    public class FileModule : ModuleBase<FileModule>
    {

        public virtual async Task<byte[]> ReadBytesAsync(string path)
        {
            try
            {
                return await File.ReadAllBytesAsync(path);
            }
            catch (UnauthorizedAccessException)
            {
                return await UACHelperServer.ReadFileAsync(path);
            }
        }
        public virtual byte[] ReadBytes(string path)
        {
            try
            {
                return File.ReadAllBytes(path);
            }
            catch (UnauthorizedAccessException)
            {
                return UACHelperServer.ReadFile(path);
            }
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
            catch (UnauthorizedAccessException)
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
            catch (UnauthorizedAccessException)
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
        public virtual void CreateDirectory(string path)
        {
            if (Directory.Exists(path)) return;
            try
            {
                Directory.CreateDirectory(path);
            }
            catch (UnauthorizedAccessException)
            {
                UACHelperServer.CreateDirectory(path);
            }
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
            catch (UnauthorizedAccessException)
            {
                UACHelperServer.Delete(path);
            }
        }
        public virtual void Copy(string src, string dest)
        {
            try
            {
                File.Copy(src, dest, true);
            } catch (UnauthorizedAccessException)
            {
                UACHelperServer.CopyFile(src, dest);
            }
        }
    }
}
