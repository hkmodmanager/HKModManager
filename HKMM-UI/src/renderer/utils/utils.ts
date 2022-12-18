
export function ConvertSize(bytes: number) {
    if (!bytes) return "0 KB";
    if (bytes > 1024 * 1024 * 1024) return `${Math.round(bytes / 1024 / 1024 / 1024)} G`;
    if (bytes > 1024 * 1024) return `${Math.round(bytes / 1024 / 1024)} MB`;
    if (bytes > 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
}
