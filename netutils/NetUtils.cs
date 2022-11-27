
global using System.IO;
global using System.Linq;
global using System.Threading.Tasks;
global using Mono.Cecil;

namespace HKMM;

public class NetUtils {
    public async Task<object> GetAPIVersion(dynamic input) {
        var apiPath = (string)input.apiPath;
        if(!File.Exists(apiPath)) return -1;
        using(var asm = AssemblyDefinition.ReadAssembly(apiPath)) {
            var t_modhooks = asm.MainModule.GetType("Modding.ModHooks");
            if(t_modhooks is null) return -1;
            var ver = t_modhooks.Fields.FirstOrDefault(x => x.Name == "_modVersion");
            if(ver is null || !ver.IsLiteral) return -2;
            return ver.Constant;
        }
    }
}
