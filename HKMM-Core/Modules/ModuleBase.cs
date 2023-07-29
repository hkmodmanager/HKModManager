using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Modules
{
    public abstract class ModuleBase<T> where T : ModuleBase<T>, new()
    {
        public static T Instance { get; set; } = new T();
    }
}
