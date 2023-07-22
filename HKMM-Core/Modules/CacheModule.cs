using HKMM.Interop;
using HKMM.Utils;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HKMM.Modules
{
    public class CacheModule : ModuleBase<CacheModule>
    {
        protected virtual string GetCachePath(string key)
        {
            return Path.Combine(JS.Api.CacheDir, key + ".cache");
        }
        public virtual string? GetString(string key)
        {
            var p = GetCachePath(key);
            FileModule.Instance.CreateDirectory(Path.GetDirectoryName(p)!);
            if(!File.Exists(p)) return null;
            return File.ReadAllText(p);
        }
        public virtual void SetString(string key, string value)
        {
            var p = GetCachePath(key);
            FileModule.Instance.CreateDirectory(Path.GetDirectoryName(p)!);
            FileModule.Instance.WriteText(p, value);
        }
        public virtual string? GetString(string key, string subKey)
        {
            return GetString(key + Path.DirectorySeparatorChar + subKey);
        }
        public virtual void SetString(string key, string subKey, string value)
        {
            SetString(key + Path.DirectorySeparatorChar + subKey, value);
        }

        public T GetObject<T>(string key)
        {
            var r = GetString(key);
            if (r == null) return default!;
            return JsonUtils.ToObject<T>(r);
        }
        public void SetObject<T>(string key, T value)
        {
            SetString(key, JsonUtils.ToJSON(value));
        }
        public T GetObject<T>(string key, string subKey)
        {
            var r = GetString(key, subKey);
            if (r == null) return default!;
            return JsonUtils.ToObject<T>(r);
        }
        public void SetObject<T>(string key, string subKey, T value)
        {
            SetString(key, subKey, JsonUtils.ToJSON(value));
        }
    }
}
