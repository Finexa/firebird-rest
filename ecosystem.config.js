module.exports = {
    apps: [
      {
        name: "firebird-rest",
        script: "src/main.js",
        autorestart: true,
        max_memory_restart: "1G",
        env: {
          PORT: 4243,
        },
        time: true,
      }
    ]
  }