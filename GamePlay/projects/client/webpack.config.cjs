const ModuleFederationPlugin =
    require("webpack").container.ModuleFederationPlugin;
const deps = require("./package.json").dependencies;

module.exports = {
    output: {
        uniqueName: "SpaceWar",
        publicPath: "auto",
    },
    optimization: {
        runtimeChunk: false,
    },
    experiments: {
        outputModule: true,
    },
    plugins: [
        new ModuleFederationPlugin({
            library: { type: "module" },

            // For remotes (please adjust)
            name: "SpaceWar",
            filename: "remoteEntry.js",
            exposes: {
                "./Module": "./src/app/space-war/space-war.module.ts",
                "./loadRemote": "./src/loadRemote.ts",
            },
            shared: {
                "@angular/core": { requiredVersion: "^20.3.0" },
                "@angular/common": { requiredVersion: "^20.3.0" },
                "@angular/common/http": { requiredVersion: "^20.3.0" },
                "@angular/router": { requiredVersion: "^20.3.0" },
                bootstrap: { requiredVersion: "^5.0.0" },
            },
        }),
    ],
};
