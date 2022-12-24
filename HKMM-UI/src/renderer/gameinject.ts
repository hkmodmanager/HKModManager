import { existsSync, mkdirSync, rmSync, symlinkSync, readJSONSync, outputJSONSync } from "fs-extra";
import { dirname, join } from "path";
import { getAPIPath } from "./apiManager";
import { getModsRoot } from "./modManager";
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
    modsPath: string
}

export function installGameInject() {
    const managed = dirname(getAPIPath());
    const data = dirname(managed);
    const fmod = join(managed, 'Mods', 'hkmm-inject');
    if(!existsSync(fmod)) {
        mkdirSync(fmod, {
            recursive: true 
        });
    }
    const mp = join(fmod, 'GameInject.dll');
    if(existsSync(mp)) {
        rmSync(mp);
    }
    const pd = join(managed, 'GameInject.dll');
    const pdb = join(managed, "GameInject.pdb");
    if (existsSync(pd)) {
        rmSync(pd);
    }
    if (existsSync(pdb)) {
        rmSync(pdb);
    }
    symlinkSync(getGameInjectPath(), pd);
    symlinkSync(join(dirname(getGameInjectPath()), 'GameInject.pdb'), pdb);
    symlinkSync(getGameInjectPath(), mp);

    const config: GameInjectConfig = {
        internalLibPath: getManagedPath(),
        modsPath: getModsRoot()
    };

    outputJSONSync(join(managed, 'hkmm-gameinject.json'), config);

    const scripts = readJSONSync(join(data, 'ScriptingAssemblies.json')) as ScriptingAssembly;
    const init = readJSONSync(join(data, 'RuntimeInitializeOnLoads.json')) as { root: RuntimeInitializeOnLoadsItem[] };
    if(!scripts.names.includes('GameInject.dll')) {
        scripts.names.push('GameInject.dll');
        scripts.types.push(ScriptingAssemblyType.CustomAssembly);
        outputJSONSync(join(data, 'ScriptingAssemblies.json'), scripts);
    }
    if(init.root.findIndex(x => x.assemblyName === 'GameInject') == -1) {
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

