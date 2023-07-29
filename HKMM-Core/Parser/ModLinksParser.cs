using HKMM.Pack.Metadata.HKMM;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml;

namespace HKMM.Parser
{
    public static class ModLinksParser
    {
        public static List<HKMMHollowKnightPackageDefV1> ParseModLinks(string text)
        {
            var result = new List<HKMMHollowKnightPackageDefV1>();
            var doc = new XmlDocument();
            doc.LoadXml(text);
            var m = doc.DocumentElement ?? throw new InvalidDataException();
            foreach(XmlElement mod in m)
            {
                var pack = new HKMMHollowKnightPackageDefV1()
                {
                    Type = TypeEnum.Mod,
                    Version = mod["Version"]?.InnerText ?? throw new InvalidDataException(),
                    Name = mod["Name"]?.InnerText ?? throw new InvalidDataException(),
                    Description = mod["Description"]?.InnerText ?? throw new InvalidDataException(),
                    Tags = mod["Tags"]?.OfType<XmlElement>()
                        .Select(x => x.InnerText).ToArray() ?? Array.Empty<string>(),
                    Authors = mod["Authors"]?.OfType<XmlElement>()
                        .Select(x => x.InnerText).ToArray() ?? Array.Empty<string>(),
                };
                var repo = mod["Repository"]?.FirstChild;
                if(repo is not null)
                {
                    if(repo is XmlCDataSection cdata)
                    {
                        pack.Repository = cdata.Data;
                    } 
                    else
                    {
                        pack.Repository = repo.InnerText;
                    }
                }
                var dep = mod["Dependencies"];
                if(dep is not null)
                {
                    pack.Dependencies = new()
                    {
                        StringArray = dep.OfType<XmlElement>().Select(x => x.InnerText).ToArray()
                    };
                }
                var link = mod["Link"];
                if(link is not null)
                {
                    pack.ReleaseAssets = new()
                    {
                        String = link.InnerText
                    };
                }
                else
                {
                    link = mod["Links"];
                    if(link is null) throw new InvalidDataException();
                    pack.ReleaseAssets = new()
                    {
                        PlatformAssets = new()
                        {
                            Win32 = link["Windows"]?.InnerText ?? throw new InvalidDataException(),
                            Linux = link["Linux"]?.InnerText ?? throw new InvalidDataException(),
                            Macos = link["Mac"]?.InnerText ?? throw new InvalidDataException()
                        }
                    };
                }
                result.Add(pack);
            }
            return result;
        }
    }
}
