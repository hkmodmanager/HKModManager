using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Modules.Upload
{
    public abstract class UploadModuleBase<T> : ModuleBase<T> where T : UploadModuleBase<T>, new()
    {
        public abstract Task<string> Upload(string? name, byte[] data);
        public virtual Task<string> Upload(string? name, string data)
        {
            return Upload(name, Encoding.UTF8.GetBytes(data));
        }
    }
}
