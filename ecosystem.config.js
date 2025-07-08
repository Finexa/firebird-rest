module.exports = {
    apps: [
      {
        name: "firebird-rest-01",
        script: "src/main.ts",
        autorestart: true,
        max_memory_restart: "2G",
        env: {
          PORT: 4243,
          PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}`,
          INSTANCE_ID: "01",
        },
        time: true,
        interpreter: "bun",
      },
      {
        name: "firebird-rest-02",
        script: "src/main.ts",
        autorestart: true,
        max_memory_restart: "2G",
        env: {
          PORT: 4244,
          PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}`,
          INSTANCE_ID: "02",
        },
        time: true,
        interpreter: "bun",
      }
    ]
  }
