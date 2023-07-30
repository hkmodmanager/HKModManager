
const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
    transpileDependencies: true,
    runtimeCompiler: true,
    configureWebpack: (config) => {
        config.target = "electron-renderer";
        config.plugins = config.plugins.filter(x => x.constructor.name != 'CaseSensitivePathsPlugin');
    },
    chainWebpack: config => {
        config.module
            .rule('node')
            .test(/\.node$/)
            .use('node-loader')
    },
    pluginOptions: {
        electronBuilder: {
            builderOptions: {
                productName: "HKModManager",
                fileAssociations: [
                    {
                        ext: "hkmg",
                        name: "Hollow Knight Mods Group",
                        icon: "./logo.ico"
                    }
                ],
                win: {
                    icon: "./logo.ico"
                },
                extraResources: [
                    {
                        from: "./libs/core/native",
                        to: "../native",
                        filter: [
                            "**/*.node",
                            "**/*.pdb"
                        ]
                    },
                    {
                        from: "./temp/app.ext.asar",
                        to: "app.ext.asar"
                    },
                    {
                        from: "../gameinject/Output",
                        to: "../managed",
                        filter: [
                            "**/*.dll",
							"**/*.pdb"
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
                        from: "./public/logo.ico",
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
