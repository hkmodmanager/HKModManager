using HKMM.Pack.Metadata;
using HKMM.Pack.Provider;
using HKMM.Tasks;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Pack
{
    public class PackContext
    {
        public readonly static PackContext customProviders = new();
        public readonly static PackContext rootContext = new()
        {
            fallback =
            {
#if BUILD_NODE_NATIVE
                ModLinksPackagesProvider.instance,
                ApiLinksPackageProvider.instance,
#endif
                customProviders
            }
        };
        public bool IsHidden = false;
        public readonly PackCollection packages = new();
        public readonly List<PackContext> fallback = new();

        private bool _inited = false;
        public virtual string Name => "Default";

        public PackContext()
        {
            packages = new();
            Init();
        }
        public PackContext(PackCollection packages)
        {
            this.packages = packages;
        }
        public virtual IEnumerable<PackageBase> GetAllPackages()
        {
            foreach (var v in packages) yield return v.Value;
            foreach (var fb in fallback)
            {
                foreach (var v in fb.GetAllPackages()) yield return v;
            }
        }
        public virtual List<PackageBase> GetAllPackages(List<PackageBase> list)
        {
            list.AddRange(packages.Values);
            foreach(var fb in fallback)
            {
                fb.GetAllPackages(list);
            }
            return list;
        }
        public virtual PackageBase? FindPack(string name)
        {
            Init().Wait();
            if (packages.TryGetValue(name, out var pack)) return pack;
            foreach(var v in fallback)
            {
                var p = v.FindPack(name);
                if(p != null) return p;
            }
            return null;
        }
        private Task Init()
        {
            return SingleTask(async () =>
            {
                if (_inited) return;
                try
                {
                    _inited = await TryInit();
                }
                catch (Exception)
                {
                    _inited = false;
                }
            }, GetType().FullName ?? Name);
        }
        protected virtual Task<bool> TryInit()
        {
            return Task.FromResult(true);
        }
    }
}
