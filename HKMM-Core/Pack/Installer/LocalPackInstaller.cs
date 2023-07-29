using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Pack.Installer
{
    public class LocalPackInstaller : PackInstaller<LocalPackInstaller>
    {
        public override bool IsEnabled(HKMMPackage pack)
        {
            return true;
        }
    }
}
