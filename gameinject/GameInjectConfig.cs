
namespace GameInject;

[Serializable]
public class Config {
    public string internalLibPath { get; set; } = "";
    public string modsPath { get; set; } = "";
    public List<string> loadedMods { get; set; } = new();
}
