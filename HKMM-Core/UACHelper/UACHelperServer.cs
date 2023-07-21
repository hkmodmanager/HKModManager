using HKMM.Interop;
using PInvoke;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.MemoryMappedFiles;
using System.IO.Pipes;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace HKMM.UACHelper
{
    internal static class UACHelperServer
    {
        public static readonly string PIPE_NAME = Guid.NewGuid().ToString();
        private readonly static NamedPipeServerStream pipeServerIn = new(PIPE_NAME, PipeDirection.InOut);
        private static Process? uacProcess;

        internal static void CheckUACProcess()
        {
            
            UACHelperSyncContext.instance.Send(_ =>
            {
                if (uacProcess != null)
                {
                    if (!uacProcess.HasExited && pipeServerIn.IsConnected) return;
                }
                if (User32.MessageBox(nint.Zero, 
                    "HKMM requires administrator privileges for the next step.",
                    "Request admin access",
                    User32.MessageBoxOptions.MB_YESNO)
                != User32.MessageBoxResult.IDYES)
                {
                    throw new OperationCanceledException();
                }
                if (pipeServerIn.IsConnected)
                {
                    pipeServerIn.Disconnect();
                }
                var cmd = $"{JS.Api.GetStartArgs()} --netutility initUACHelper " +
                    $"\"['{Environment.ProcessId}', '{PIPE_NAME}']\"";
                uacProcess = Process.Start(new ProcessStartInfo()
                {
                    Verb = "runas",
                    Arguments = cmd,
                    FileName = Environment.ProcessPath ?? JS.Api.GetElectronExe(),
                    UseShellExecute = true
                });
                try
                {
                    pipeServerIn.WaitForConnectionAsync().Wait(1000);
                }
                catch (TimeoutException)
                {
                    uacProcess?.Kill();
                    uacProcess = null;
                    throw;
                }
            }, null);
        }

        private static byte[] ReadBytes(int len)
        {
            var buffer = new byte[len];
            for(int i = 0; i < len;)
            {
                i += pipeServerIn.Read(buffer, i, len - i);
            }
            return buffer;
        }
        private static void WriteBytes(byte[] buffer)
        {
            pipeServerIn.Write(buffer);
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
        public static void WriteFile(string path, byte[] data)
        {
            CheckUACProcess();
            UACHelperSyncContext.instance.Send(_ =>
            {
                var mapName = Guid.NewGuid().ToString();
                using var mm = MemoryMappedFile.CreateNew(mapName, data.Length + 64,
                    MemoryMappedFileAccess.ReadWrite);
                using var accessor = mm.CreateViewAccessor();

                accessor.Write(0, (uint)data.Length);
                accessor.WriteArray(4, data, 0, data.Length);
                accessor.Flush();

                WriteString("WRITE_FILE");
                WriteString(path);
                WriteString(mapName);
                while (true)
                {
                    Thread.Yield();
                    var result = accessor.ReadInt32(0);
                    if (result == 0)
                    {
                        break;
                    }
                    if (result < 0)
                    {
                        var len = accessor.ReadInt32(4);
                        var buffer = new byte[len];
                        accessor.ReadArray(8, buffer, 0, len);
                        throw new Exception(Encoding.UTF8.GetString(buffer));
                    }
                }
            }, null);
        }
        public static Task WriteFileAsync(string path, byte[] data)
        {
            return Task.Run(() =>
            {
                WriteFile(path, data);
            });
        }
        public static void Delete(string path)
        {
            CheckUACProcess();
            UACHelperSyncContext.instance.Send(_ =>
            {
                WriteString("DELETE");
                WriteString(path);
            }, null);
        }
    }
}
