using HKMM.Pack.Metadata;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Pack.Installer
{
    internal class GameInjectInstaller : PackInstaller<GameInjectInstaller>
    {
        public override Task<HKMMPackage> InstallHKPackageUnsafe(CSHollowKnightPackageDef def, 
            Task[] waitTasks)
        {
            throw new NotImplementedException();
        }
    }
}
