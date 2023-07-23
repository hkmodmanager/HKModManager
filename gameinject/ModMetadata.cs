
namespace GameInject;

public record class InstalledFileInfo(string Path, string RelativePath);

[Serializable]
public class ModMetadata {
    public InstalledFileInfo[] InstalledFiles { get; set; } = Array.Empty<InstalledFileInfo>();
}
