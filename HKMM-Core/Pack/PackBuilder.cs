using HKMM.Pack.Metadata;
using HKMM.Pack.Metadata.HKMM;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Pack
{
    public class PackBuilder
    {
        public string Name { get; set; } = "";
        public string Version { get; set; } = "";
        public string Description { get; set; } = "";
        public List<string> Tags { get; set; } = new();
        public string Repo { get; set; } = "";
        public List<string> Authors { get; set; } = new();
        public Dictionary<string, ReferenceVersion> DependenciesDict = new();
        public List<string> Dependencies { get; set; } = new();
        public ReleaseAssets? ReleaseAssets { get; set; }
        public List<AdditionalAsset> AdditionalAsset { get; set; } = new();
        public void AddDependency(HKMMHollowKnightPackageDefV1 pack)
        {
            if(pack.Type == TypeEnum.Mod)
            {
                if(!Dependencies.Contains(pack.Name)) Dependencies.Add(pack.Name);
            }
            else
            {
                foreach(var p in pack.GetAllDependencies(false).Select(PackContext.rootContext.FindPack))
                {
                    AddDependency(p!.ToHKMMPackageDef());
                }
                if (pack.AdditionalAssets != null)
                {
                    foreach (var asset in pack.AdditionalAssets)
                    {
                        AdditionalAsset.Add(asset);
                    }
                }
            }
        }

        public HKMMHollowKnightPackageDefV1 Build()
        {
            References? dep = new References
            {
                AnythingMap = DependenciesDict.Count > 0 ? DependenciesDict : null!,
                StringArray = Dependencies.Count > 0 ? Dependencies.ToArray() : null!
            };
            if(dep.Value.AnythingMap == null && dep.Value.StringArray == null)
            {
                dep = null;
            }
            else
            {
                if(dep.Value.AnythingMap != null && dep.Value.StringArray != null)
                {
                    var d = dep.Value;
                    foreach(var v in d.StringArray)
                    {
                        d.AnythingMap[v] = new()
                        {
                            String = "@modlinks"
                        };
                    }
                    d.StringArray = null!;
                    dep = d;
                }
            }

            return new()
            {
                Name = Name,
                DisplayName = Name,
                Authors = Authors.ToArray(),
                Tags = Tags.ToArray(),
                Repository = Repo,
                Description = Description,
                Type = TypeEnum.ModPack,
                AdditionalAssets = AdditionalAsset.ToArray(),
                Dependencies = dep
            };
        }
    }
}
