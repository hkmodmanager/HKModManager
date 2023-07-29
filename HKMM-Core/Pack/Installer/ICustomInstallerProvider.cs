using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Pack.Installer
{
    public interface ICustomInstallerProvider
    {
        PackInstaller? Installer { get; }
    }
}
