using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microsoft.JavaScript.NodeApi
{
#if !BUILD_NODE_NATIVE
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Property | AttributeTargets.Method
                | AttributeTargets.Struct | AttributeTargets.Enum | AttributeTargets.Interface 
                | AttributeTargets.Delegate)]
    internal class JSExportAttribute : Attribute
    {
    }
#endif
}
