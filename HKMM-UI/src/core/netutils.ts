
import { join } from "path";
import { appDir, isPackaged, srcRoot } from "./remoteCache";
import { node_import } from "./updater";

export interface NetUtils {

	getAPIVersion(apiPath: string): number;

	getGameVersion(apiPath: string): string;

	tryFindGamePath(): string | undefined;
}


const rootPath = !isPackaged ? (
    join(srcRoot, "native")
) : (
    join(appDir, "native")
);

export default node_import<NetUtils>(join(rootPath, "core.node"));
