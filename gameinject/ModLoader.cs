
namespace GameInject;

public class HKMMLoader : Mod {
    public HKMMLoader() : base("Hollow Knight Mod Manager") {
        
    }
    public override int LoadPriority() => -10000;
    public override string GetVersion()
    {
        return typeof(HKMMLoader).Assembly.GetName().Version.ToString();
    }
}
