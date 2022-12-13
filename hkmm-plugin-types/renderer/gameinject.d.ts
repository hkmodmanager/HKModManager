export declare enum RuntimeInitializeLoadType {
    AfterSceneLoad = 0,
    BeforeSceneLoad = 1,
    AfterAssembliesLoaded = 2,
    BeforeSplashScreen = 3,
    SubsystemRegistration = 4
}
export declare class RuntimeInitializeOnLoadsItem {
    assemblyName: string;
    nameSpace: string;
    className: string;
    methodName: string;
    loadTypes: RuntimeInitializeLoadType;
    isUnityClass: boolean;
}
export declare enum ScriptingAssemblyType {
    UnityLibrary = 2,
    CustomAssembly = 16
}
export declare class ScriptingAssembly {
    names: string[];
    types: ScriptingAssemblyType[];
}
export declare function getGameInjectPath(): string;
export declare function getManagedPath(): string;
export interface GameInjectConfig {
    internalLibPath: string;
    modsPath: string;
}
export declare function installGameInject(): void;
