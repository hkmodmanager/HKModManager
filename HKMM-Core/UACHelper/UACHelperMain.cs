using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.MemoryMappedFiles;
using System.IO.Pipes;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace HKMM.UACHelper
{
    internal static class UACHelperMain
    {
        private static NamedPipeClientStream pipe = null!;

        private static byte[] ReadBytes(int len)
        {
            var buffer = new byte[len];
            for (int i = 0; i < len;)
            {
                i += pipe.Read(buffer, i, len - i);
            }
            return buffer;
        }
        private static void WriteBytes(byte[] buffer)
        {
            pipe.Write(buffer);
        }
        private static void WriteString(string str)
        {
            var b = Encoding.UTF8.GetBytes(str);
            WriteBytes(BitConverter.GetBytes(b.Length));
            WriteBytes(b);
        }
        private static string ReadString()
        {
            int len = BitConverter.ToInt32(ReadBytes(4));
            var b = ReadBytes(len);
            return Encoding.UTF8.GetString(b);
        }

        public static void Init(Process parent, string pipeName)
        {
            if (parent.HasExited) return;
            new Thread(() =>
            {
                parent.WaitForExit();
                Environment.Exit(0);
            })
            {
                IsBackground = true
            }.Start();

            pipe = new(".", pipeName, PipeDirection.InOut);
            pipe.Connect();

            while(pipe.IsConnected)
            {
                var cmd = ReadString();
                if(cmd == "WRITE_FILE")
                {
                    var path = ReadString();
                    var mmName = ReadString();
                    using var mm = MemoryMappedFile.OpenExisting(mmName, MemoryMappedFileRights.ReadWrite);
                    using var s = mm.CreateViewStream();
                    try
                    {
                        using var br = new BinaryReader(s);
                        using var dest = File.OpenWrite(path);
                        var len = br.ReadUInt32();
                        var buffer = new byte[8192];
                        for (int i = 0; i < len;)
                        {
                            var l = (int)Math.Min(len - i, 8192);
                            l = br.Read(buffer, 0, l);
                            i += l;
                            dest.Write(buffer, 0, l);
                        }
                        s.Position = 0;
                        s.Write(BitConverter.GetBytes(0), 0, 4);
                        s.Flush();
                    } catch(Exception ex)
                    {
                        s.Position = 0;
                        var bytes = Encoding.UTF8.GetBytes(ex.ToString());
                        s.Write(BitConverter.GetBytes(-1), 0, 4);
                        s.Write(BitConverter.GetBytes(bytes.Length), 0, 4);
                        s.Write(bytes);
                        s.Flush();
                    }
                }
                else if(cmd == "DELETE")
                {
                    var path = ReadString();
                    try
                    {
                        if(File.Exists(path))
                        {
                            File.Delete(path);
                        } else if(Directory.Exists(path))
                        {
                            Directory.Delete(path, true);
                        }
                    }
                    catch(Exception)
                    {

                    }
                }
                Thread.Yield();
            }
        }
    }
}
