const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
    transpileDependencies: true,
    runtimeCompiler: false,
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
                        from: "./libs/electron-edge-js-master/lib/native/win32/x64/13.0.0",
                        to: "../edge",
                        filter: [
                            "**/*"
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
