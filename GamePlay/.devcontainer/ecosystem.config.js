module.exports = {
    apps: [
        {
            name: "SpaceWar-server",
            script: "npm",
            args: "run start:dev -w space-war-server",
            watch: ["projects/server/src"],
            ignore_watch: ["node_modules", "dist"],
            env: {
                NODE_ENV: "development",
                HOST: "0.0.0.0",
                PORT: 8081,
            },
        },
        {
            name: "SpaceWar-client",
            script: "npm",
            args: "run start:dev -w space-war-client",
            watch: ["projects/client/src"],
            ignore_watch: ["node_modules", "dist"],
            env: {
                NODE_ENV: "development",
                HOST: "0.0.0.0",
                PORT: 4500,
            },
        },
    ],
};
