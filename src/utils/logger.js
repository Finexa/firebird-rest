const appInsights = require("applicationinsights");
const dayjs = require("dayjs");
const path = require("path");
const fs = require("fs");

appInsights.setup().start();

const client = appInsights.defaultClient;
const EXCEPTION_FILE_DUMP_PATH = path.join(__dirname, "exception.json");

process.on("uncaughtException", (err) => {
  fs.writeFileSync(
    EXCEPTION_FILE_DUMP_PATH,
    JSON.stringify({
      name: err.name,
      message: err.message,
      stacktrace: err.stack,
    })
  );
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.log([reason , promise])
  if (reason instanceof Error) {
    fs.writeFileSync(
      EXCEPTION_FILE_DUMP_PATH,
      JSON.stringify({
        name: reason.name,
        message: reason.message,
        stacktrace: reason.stack,
      })
    );
  } else {
    fs.writeFileSync(
      EXCEPTION_FILE_DUMP_PATH,
      JSON.stringify({
        name: "unhandledRejection",
        message: reason,
        stacktrace: "",
      })
    );
  }
  process.exit(1);
});

function logPoolActivity(Pool) {
  setInterval(() => {
    client.trackMetric({
      name: "active connections",
      value: Pool.dbinuse,
      namespace: "firebird-rest",
    });
  }, 10_000);
}

if (fs.existsSync(EXCEPTION_FILE_DUMP_PATH)) {
  const error = JSON.parse(fs.readFileSync(EXCEPTION_FILE_DUMP_PATH));
  const errorObj = new Error();
  Object.assign(errorObj, error);

  client.trackException({ exception: errorObj });
  client.flush({
    isAppCrashing: false,
    callback: () => {
      if (fs.existsSync(EXCEPTION_FILE_DUMP_PATH)) {
        fs.unlinkSync(EXCEPTION_FILE_DUMP_PATH);
      }
    },
  });
}

module.exports = {
  logPoolActivity,
};
