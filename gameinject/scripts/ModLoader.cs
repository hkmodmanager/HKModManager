
namespace GameInject;

public class HKMMLoader : Mod {
    public HKMMLoader() : base("Hollow Knight Mod Manager") {
        
    }
    public override int LoadPriority() => -10000;
    public override string GetVersion()
    {
        return "1.2.0";
    }
}
