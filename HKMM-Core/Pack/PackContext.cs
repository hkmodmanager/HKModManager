using HKMM.Pack.Metadata;
using HKMM.Pack.Provider;
using HKMM.Tasks;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading;
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
                InternalPackageProvider.instance,
#endif
                customProviders
            }
        };
        public bool IsHidden = false;
        public readonly PackCollection packages = new();
        public readonly List<PackContext> fallback = new();

        public static int _initCount = 0;
        public static int InitCount => _initCount;

        private bool _inited = false;
        public virtual string Name => "Default";

        public PackContext()
        {
            packages = new();
            MakeSureInit(1);
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
            MakeSureInit().Wait();
            if (packages.TryGetValue(name, out var pack)) return pack;
            foreach(var v in fallback)
            {
                var p = v.FindPack(name);
                if(p != null) return p;
            }
            return null;
        }
        public Task MakeSureInit(int delay = 0)
        {
            if (Name != "Default" && !_inited)
            {
                return SingleTask(() => TaskManager.StartTask("Initialize " + Name,
                    async () =>
                {
                    if (_inited) return;
                    if (delay > 0) await Task.Delay(delay);
                    try
                    {
                        Interlocked.Add(ref _initCount, 1);
                        _inited = await TryInit();
                    }
                    catch (Exception ex)
                    {
                        Logger.LogError(ex.ToString());
                        TaskManager.CurrentTask!.Status = TaskItemStatus.Fail;
                        _inited = false;
                    }
                    Interlocked.Add(ref _initCount, -1);
                }), GetType().FullName ?? Name);
            }
            else
            {
                return Task.CompletedTask;
            }
        }
        protected virtual Task<bool> TryInit()
        {
            return Task.FromResult(true);
        }
    }
}
