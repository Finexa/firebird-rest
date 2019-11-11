const Firebird = require('node-firebird-dev');
const Options = require('./flagParams').options();
const convertBufferArray = require('./convertBufferArray');
const convertDate = require('./convertDate');
const Bottleneck = require('bottleneck');

const sqlQuery = param => {
  return (req, res) => {
    const properties = req[param];
    
    Options.database = properties.database || Options.database;
    Options.user = properties.user || Options.user;
    Options.password = properties.password || Options.password;
    Options.role = properties.role || Options.role;

    const sql = properties.sql;
    const params = properties.params;

    if (!sql) {
      return res.send(['No valid SQL query found! Please enter a valid SQL query.']);
    }
    
    queryWithLimiter(sql, params)
      .then((result) => res.send(result))
      .catch((err) => {
        res.status(400); // BAD REQUEST
        res.send(`\n${err.message}\n`);
      });
    
  };
};

const limiter = new Bottleneck({
  maxConcurrent: 20,
});

function queryWithLimiter(sql, params) {
  return limiter.schedule(() => query(sql, params));
}

function query(sql, params) {
  return new Promise((resolve, reject) => {
    Firebird.attach(Options, (err, db) => {
      if (err) {
        db.detach();
        reject(err);
      }

      db.query(sql, params, (err, data) => {
        if (err) {
          db.detach();
          reject(err);
        }
        db.detach();

        if (data) {
          let result = [];

          if (Array.isArray(data)) {
            // CONVERT RAW QUERY RESULT AND RETURN JSON
            data.forEach(row => {
              const newRow = convertRow(row);
              result.push(newRow);
            });
          } else {
            const newRow = convertRow(data);
            result = newRow;
          }

          return resolve(result);
        }
      });
    });
  })
}

function convertRow(row) {
  let newRow = {};
  Object.keys(row).forEach(el => {
    newRow[el] = convertBufferArray(row[el]);
    if (row[el] instanceof Date) {
      newRow[el] = convertDate(row[el]);
    }
  });

  return newRow;
}

module.exports = sqlQuery;
