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
                    icon: "./MZ_Death_Skull.ico",
                    publish: [ 'github' ]
                },
                extraResources: {
                    from: "./resources",
                    to: "res",
                    filter: [
                        "**/*"
                    ]
                },
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
