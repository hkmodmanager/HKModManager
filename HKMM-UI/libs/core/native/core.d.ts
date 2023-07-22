// Generated for: core 1.0.0.0
// Generated by: Microsoft.JavaScript.NodeApi.Generator 0.41.0.0
/* eslint-disable */


declare module "core" {

	export enum LogLevel {
		Error = 0,

		Warning = 1,

		Log = 2,

		Fine = 3,
	}

	export function registerLogHandler(
		level: string,
		handler: (arg1: string) => void,
	): void;

	export function getAPIVersion(apiPath: string): number;

	export function getGameVersion(apiPath: string): string;

	export function tryFindGamePath(): string | undefined;

	export function getRootPackageProvider(): PackageProviderProxy;

	export interface TaskPropertyChanged { (
		task: TaskItem,
		propertyName: string | undefined,
	): void; }

	export class TaskLogInfo extends unknown {
		message: string;

		color?: string;
	}

	export class TaskItem extends unknown {
		constructor();

		name: string;

		guid: string;

		progress: number;

		readonly startTime: Date;

		endTime: Date;

		onChanged?: TaskPropertyChanged;

		status: TaskItemStatus;

		readonly isSuccess: boolean;

		readonly isFailed: boolean;

		readonly isRunning: boolean;

		isHidden: boolean;

		readonly logCount: number;

		getLogAt(id: number): TaskLogInfo;

		log(msg: string): void;

		logError(msg: string): void;

		logWarn(msg: string): void;

		print(
			msg: string,
			level: LogLevel,
		): void;

		getRunningTime(): number;
	}

	export enum TaskItemStatus {
		Idle = 0,

		Running = 1,

		Success = 2,

		Fail = 3,
	}

	export class LegacyLocalModInfo extends unknown {
		name: string;

		version: string;

		install: number;

		path: string;

		modinfo: LegacyModInfoFull;
	}

	export class LegacyModCollection extends unknown {
		constructor();

		addMod(mod: LegacyModInfoFull): void;
	}

	export class LegacyModInfoFull extends unknown {
		name: string;

		version: string;

		desc: string;

		displayName?: string;

		link?: string;

		dependencies: string[];

		integrations: string[];

		repository?: string;

		tags: string[];

		authors: string[];

		date?: string;
	}

	export class CustomPackageProviderProxy extends unknown {
		constructor();

		readonly provider: PackageProviderProxy;

		readonly name: string;

		readonly description: string;

		readonly authors?: string[];

		readonly icon?: string;

		readonly repository?: string;

		check(): CustomPackageProviderProxy;
	}

	export function enableWatchDog(enable: boolean): void;

	export function initJSAPI(api: JSAPI): void;

	export function onSettingChanged(path: string): void;

	export function resetWatchDog(): void;

	export class JSAPI extends unknown {
		getModStorePath: () => string;

		parseModLinks: (arg1: string) => Promise<LegacyModCollection>;

		parseAPILink: (arg1: string) => Promise<LegacyModInfoFull>;

		watchDogCheck: () => void;

		gameInjectRoot: string;

		internalLibRoot: string;

		cacheDir: string;

		startArgv: string;

		electronExe: string;
	}

	export class LocalPackageProxy extends unknown {
		constructor();

		readonly info: PackageDisplay;

		readonly installPath: string;

		enabled: boolean;

		readonly installDate: number;

		check(): LocalPackageProxy;

		uninstall(): void;

		static getMod(name: string): LocalPackageProxy | undefined;

		static getAllMods(): Promise<LocalPackageProxy[]>;
	}

	export class NetUtility extends unknown {
		constructor();

		static initUACHelper(
			parentPID: string,
			pipeName: string,
		): void;
	}

	export class PackageDisplay extends unknown {
		constructor();

		readonly isImportant: boolean;

		readonly name: string;

		readonly description: string;

		readonly type: string;

		readonly displayName: string;

		readonly version: string;

		readonly authors: string[];

		readonly tags: string[];

		readonly repository?: string;

		readonly date: number;

		readonly owner: string;

		readonly icon: string;

		readonly dependencies: string[];

		readonly allowToggle: boolean;

		readonly allowInstall: boolean;

		readonly allowUninstall: boolean;

		check(): PackageDisplay;

		install(): Promise<void>;
	}

	export class PackageProviderProxy extends unknown {
		constructor();

		readonly name: string;

		static readonly allInited: boolean;

		static getRoot(): PackageProviderProxy;

		getAllPackages(onlyTop: boolean): PackageDisplay[];

		getPackage(name: string): PackageDisplay | undefined;
	}

	export namespace JSTaskManager {
		export const taskCount: number;

		export function getTaskAt(id: number): TaskItem;

		export function startTask(task: TaskItem): void;

		export function getTask(guid: string): TaskItem | undefined;

		export function getTasksProgress(): number;
	}

	export class Test extends unknown {
		constructor();

		static checkUACHelper(): void;

		static crash(): void;
	}
}
