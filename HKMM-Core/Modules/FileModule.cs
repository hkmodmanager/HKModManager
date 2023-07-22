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
                if (Directory.Exists(path))
                {
                    throw new InvalidOperationException("Target path is a folder");
                }
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
                if (Directory.Exists(path))
                {
                    throw new InvalidOperationException("Target path is a folder");
                }
                return UACHelperServer.ReadFile(path);
            }
        }
        public virtual string ReadText(string path)
        {
            return File.ReadAllText(path);
        }
        public virtual async Task WriteBytesAsync(string path, byte[] data)
        {
            CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);
            try
            {
                await File.WriteAllBytesAsync(path, data);
            }
            catch (UnauthorizedAccessException)
            {
                if(Directory.Exists(path))
                {
                    Delete(path);
                    await WriteBytesAsync(path, data);
                    return;
                }
                await UACHelperServer.WriteFileAsync(path, data);
            }
        }
        public virtual void WriteBytes(string path, byte[] data)
        {
            CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);
            try
            {
                File.WriteAllBytesAsync(path, data);
            }
            catch (UnauthorizedAccessException)
            {
                if (Directory.Exists(path))
                {
                    Delete(path);
                    WriteBytes(path, data);
                    return;
                }
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
                if (Directory.Exists(src))
                {
                    throw new InvalidOperationException("Target path is a folder");
                }
                UACHelperServer.CopyFile(src, dest);
            }
        }
    }
}
