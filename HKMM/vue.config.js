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
                extraResources: {
                    from: "./resources",
                    to: "res",
                    filter: [
                        "**/*"
                    ]
                }
            }
        }
    }
})
