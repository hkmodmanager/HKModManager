
export const I18nLanguages = {
    zh: {
        error: {
            missingView: "页面丢失",
            hkcheck: {
                no_hk: "选中的游戏不是空洞骑士",
                broken: "游戏文件已损坏",
                hk_out_of_date: "游戏版本过旧"
            }
        },
        tabs: {
            allmods: "下载Mods",
            localmods: "本地Mods",
            requireUpdateMods: "更新Mods",
            settings: "设置",
            modgroups: "Mods分组",
            api: "MAPI管理",
            tasks: {
                title: "任务",
                all: "全部",
                failed: "已失败",
                done: "已完成",
                running: "进行中"
            }
        },
        groups: {
            current: "当前",
            create: "创建",
            newtitle: "创建新的组",
            name: "组名",
            use: "使用当前组",
            remove: "删除组",
            deleteMsg: "你确定要删除这个组吗？这不可恢复",
            rename: "重命名组",
            download: "补充缺失的Mods",
            ready: "已准备好",
            unready: "未准备好",
            copyShareMsg: "复制分享链接",
            packShareMsg: "导出一键包",
            export: "导出一键包",
            exportOptions: {
                always_full_path: "总是使用完整路径",
                include_api: "包含Modding API",
                only_mod_files: "不包含额外的文件"
            }
        },
        mods: {
            authors: "贡献者",
            repo: "代码仓库",
            version: "版本",
            dep: "依赖Mods",
            size: "大小",
            depInstall: "已安装",
            enabled: "已启用",
            disabled: "未启用",
            install: "安装",
            uninstall: "卸载",
            requireUpdate: "有更新",
            update: "更新",
            use: "启用",
            unuse: "禁用",
            desc: "描述",
            missingDep: "未安装",
            depOnThis: "以下Mods依赖于该Mod",
            tags: {
                Gameplay: "Gameplay",
                Boss: "Boss",
                Cosmetic: "Cosmetic",
                Expansion: "Expansion",
                Library: "Library",
                Utility: "Utility"
            }
        },
        settings: {
            mirror: {
                githubmirror: "Github 镜像"
            },
            exp: {
                title: "实验性功能",
                enable: "启用实验性功能",
                warning: "注意： 实验性功能不稳定且可能在未来版本中被移除",
                applyOnRestart: "对该选项的更改会在重新启动程序后生效",
                restartNow: "现在重新启动"
            },
            cache: {
                title: "缓存管理",
                clearModLinks: "清除ModLinks缓存"
            },
            gamepath:  {
                title: "游戏目录",
                hkexe: "hollow_knight.exe"
            },
            modsavepath: {
                title: "Mods储存目录",
                appdir: "应用程序目录",
                userdir: "用户目录",
                custom: "自定义"
            }
        },
        api: {
            notfound: "未安装API",
            found: "已安装API",
            download: "下载API",
            enable: "启用API",
            disable: "禁用API",
            notfit: "没有合适版本的API",
            uninstall: "卸载API",
            install: "安装API",
            noBackup: "未找到备份文件或备份文件已被污染",
            isLatestVer: "最新版本",
            hasLatestVer: "有更新",
            update: "更新API",
            uninstallMsg: "你确定要卸载API吗？"
        },
        tasks: {
            failed: "失败",
            done: "已完成",
            notification: {
                failed: "任务 {taskName} 失败",
                done: "已完成任务 {taskName} "
            }
        }
    },
    en: {
        error: {
            missingView: "Missing View"
        },
        tabs: {
            allmods: "All Mods",
            localmods: "Local Mods",
            settings: "Settings"
        }
    }
};
