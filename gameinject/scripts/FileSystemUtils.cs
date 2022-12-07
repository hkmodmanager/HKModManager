
namespace GameInject;
using static PathInternal;

public static class FileSystemUtils
{
    [DllImport("kernel32.dll", BestFitMapping = false, CharSet = CharSet.Unicode, EntryPoint = "CreateSymbolicLinkW", ExactSpelling = true, 
    SetLastError = true)]
    [return: MarshalAs(UnmanagedType.U1)]
    private static extern bool CreateSymbolicLinkPrivate(string lpSymlinkFileName, string lpTargetFileName, int dwFlags);
    public static void CreateSymbolicLink(string symlinkFileName, string targetFileName, bool isDirectory)
    {
        string path = symlinkFileName;
        symlinkFileName = EnsureExtendedPrefixIfNeeded(symlinkFileName);
        targetFileName = EnsureExtendedPrefixIfNeeded(targetFileName);
        int num = 0;
        Version version = Environment.OSVersion.Version;
        bool flag = version.Major >= 11 || (version.Major == 10 && version.Build >= 14972);
        if (flag)
        {
            num = 2;
        }
        if (isDirectory)
        {
            num |= 1;
        }
        if (!CreateSymbolicLinkPrivate(symlinkFileName, targetFileName, num))
        {
            Marshal.ThrowExceptionForHR(Marshal.GetHRForLastWin32Error());
        }
    }
}
