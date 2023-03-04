import { copyFileSync } from "fs";
import { existsSync, rmSync, readJSONSync, outputJSONSync } from "fs-extra";
import { dirname, join } from "path";
import { getAPIPath } from "./apiManager";
import { getCacheModsPath } from "./modManager";
import { appDir, isPackaged, srcRoot } from "./remoteCache";


export enum RuntimeInitializeLoadType {
    AfterSceneLoad = 0,
    BeforeSceneLoad = 1,
    AfterAssembliesLoaded = 2,
    BeforeSplashScreen = 3,
    SubsystemRegistration = 4
}

export class RuntimeInitializeOnLoadsItem {
    public assemblyName = "";
    public nameSpace = "";
    public className = "";
    public methodName = "";
    public loadTypes = RuntimeInitializeLoadType.AfterAssembliesLoaded;
    public isUnityClass = false;
}

export enum ScriptingAssemblyType {
    UnityLibrary = 2,
    CustomAssembly = 16
}

export class ScriptingAssembly {
    public names: string[] = [];
    public types: ScriptingAssemblyType[] = [];
}

export function getGameInjectPath() {

    return !isPackaged ? (
        join(srcRoot, "..", "gameinject", "Output", "GameInject.dll") //Debug
    ) : (
        join(appDir, "managed", "GameInject.dll")
    );
}

export function getManagedPath() {
    return !isPackaged ? (
        join(srcRoot, "managed") //Debug
    ) : (
        join(appDir, "managed")
    );
}

export interface GameInjectConfig {
    internalLibPath: string;
    modsPath: string;
    /**
     * e.g. 'HKTool|1.0.0.0|x:/xxx/xxx/xxx/HKTool/1.0.0.0'
     * */
    loadedMods: string[];
}

let configPath: string;

export let config: GameInjectConfig;

export function loadConfig() {
    if (!configPath) configPath = join(dirname(getAPIPath()), 'hkmm-gameinject.json');
    if (!config) {
        config = existsSync(configPath) ? readJSONSync(configPath) : {};
        if (!config.loadedMods) config.loadedMods = [];
        config.internalLibPath = getManagedPath();
        config.modsPath = getCacheModsPath();
    }
}



export function saveConfig() {
    loadConfig();
    config.loadedMods = config.loadedMods.filter(x => x);
    outputJSONSync(configPath, config);
}

export function installGameInject() {
    const managed = dirname(getAPIPath());
    const data = dirname(managed);

    const pd = join(managed, 'GameInject.dll');
    const pdb = join(managed, "GameInject.pdb");
    if (existsSync(pd)) {
        rmSync(pd);
    }
    if (existsSync(pdb)) {
        rmSync(pdb);
    }
    copyFileSync(getGameInjectPath(), pd);
    copyFileSync(join(dirname(getGameInjectPath()), 'GameInject.pdb'), pdb);

    saveConfig();

    const scripts = readJSONSync(join(data, 'ScriptingAssemblies.json')) as ScriptingAssembly;
    const init = readJSONSync(join(data, 'RuntimeInitializeOnLoads.json')) as { root: RuntimeInitializeOnLoadsItem[] };
    if (!scripts.names.includes('GameInject.dll')) {
        scripts.names.push('GameInject.dll');
        scripts.types.push(ScriptingAssemblyType.CustomAssembly);
        outputJSONSync(join(data, 'ScriptingAssemblies.json'), scripts);
    }
    if (init.root.findIndex(x => x.assemblyName === 'GameInject') == -1) {
        init.root.push({
            assemblyName: 'GameInject',
            nameSpace: 'GameInject',
            loadTypes: RuntimeInitializeLoadType.AfterAssembliesLoaded,
            className: 'Main',
            methodName: 'Init',
            isUnityClass: false
        });
        outputJSONSync(join(data, 'RuntimeInitializeOnLoads.json'), init);
    }
}

