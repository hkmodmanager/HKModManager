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
    public static class ApiLinksParser
    {
        public static HKMMHollowKnightPackageDefV1 ParseApiLinks(string text)
        {
            
            var doc = new XmlDocument();
            doc.LoadXml(text);
            var root = doc.LastChild?.FirstChild ?? throw new InvalidDataException();
            var links = root["Links"] ?? throw new InvalidDataException();
            var result = new HKMMHollowKnightPackageDefV1()
            {
                Name = "ModdingAPI",
                Type = TypeEnum.Mod,
                Version = $"{root["Version"]!.InnerText}.0.0.0",
                ReleaseAssets = new()
                {
                    PlatformAssets = new()
                    {
                        Win32 = ((XmlCDataSection)links["Windows"]!.FirstChild!).Data,
                        Linux = ((XmlCDataSection)links["Linux"]!.FirstChild!).Data,
                        Macos = ((XmlCDataSection)links["Mac"]!.FirstChild!).Data,
                    }
                }
            };

            return result;
        }
    }
}
