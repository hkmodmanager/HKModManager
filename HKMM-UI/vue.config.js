const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
    transpileDependencies: true,
    runtimeCompiler: true,
    configureWebpack: {
        target: "electron-renderer"
    },
    pluginOptions: {
        electronBuilder: {
            builderOptions: {
                productName: "HKModManager",
                fileAssociations: [
                    {
                        ext: "hkmg",
                        name: "Hollow Knight Mods Group",
                        icon: "./MZ_Death_Skull.ico"
                    }
                ],
                win: {
                    icon: "./MZ_Death_Skull.ico"
                },
                extraResources: [
                    {
                        from: "../netutils/bin/Debug",
                        to: "../managed",
                        filter: [
                            "**/*"
                        ]
                    },
                    {
                        from: "./libs/EdgeJS/lib/native/win32/x64/22.0.0",
                        to: "../edge",
                        filter: [
                            "**/*"
                        ]
                    },
                    {
                        from: "./libs/EdgeJS/lib/native/win32/x640.0",
                        to: "../edge",
                        filter: [
                            "*.dll"
                        ]
                    },
                    {
                        from: "../gameinject/Output",
                        to: "../managed",
                        filter: [
                            "**/*"
                        ]
                    },
                    {
                        from: "./managed",
                        to: "../managed",
                        filter: [
                            "**/*"
                        ]
                    },
                    {
                        from: "./langs",
                        to: "../langs",
                        filter: [
                            "**/*"
                        ]
                    },
                    {
                        from: "../updater/bin/Debug/updater.exe",
                        to: "../updater/updater.exe"
                    },
                    {
                        from: "../updater/bin/Debug/rcedit.exe",
                        to: "../updater/rcedit.exe"
                    },
                    {
                        from: "./public/MZ_Death_Skull.ico",
                        to: "../updater/appicon.ico"
                    }
                ]
                ,
                nsis: {
                    oneClick: false,
                    allowToChangeInstallationDirectory: true,
                    createStartMenuShortcut: true,
                    shortcutName: "HKMM",
                    artifactName: "${productName}-${version}-Setup.${ext}"
                }
            }
        }
    }
})
