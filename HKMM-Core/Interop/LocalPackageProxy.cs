using HKMM.Pack;
using Microsoft.JavaScript.NodeApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Interop
{
    [JSExport]
    public class LocalPackageProxy
    {
        public HKMMPackage package = null!;
        public LocalPackageProxy Check()
        {
            if(package == null)
            {
                throw new NotSupportedException();
            }
            return this;
        }
        private PackageDisplay? display;
        public PackageDisplay Info => display ??= new()
        {
            package = package.Info
        };
        public string InstallPath => package.InstallPath;
        public bool Enabled => package.Enabled;
        public double InstallDate => package.InstallDateJS;
    }
}
