export enum ModSavePathMode {
    AppDir,
    UserDir,
    Custom,
    Gamepath
}

export class MirrorItem {
    public target: string = "";
}

export class MirrorGroup {
    public items: MirrorItem[] = []
}

export type SettingOptions = 'SHOW_DELETED_MODS';

export class HKMMSettings {
    public mirror_github = new MirrorGroup();
    public mirror_githubapi = new MirrorGroup();
    public enabled_exp_mode = false;
    public gamepath: string = "";
    public modsavepath: string = "";
    public modsavepathMode: ModSavePathMode = ModSavePathMode.UserDir;
    public inStore: boolean = false;
    public modgroups: string[] = [];
    public current_modgroup: string = 'default';
    public language?: string = '#';
    public options: SettingOptions[] = [];
}
