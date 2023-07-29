
namespace GameInject;

[Serializable]
public class Config {
    public string internalLibPath { get; set; } = "";
    public string modsPath { get; set; } = "";
    public bool outputLog { get; set; } = false;
    [Obsolete]
    public List<string> loadedMods { get; set; } = new();
}
