const Firebird = require('node-firebird');
const Options = require('./flagParams').options();
const convertDate = require('./convertDate');
const bufferJson = require('buffer-json');
const parseDateStrings = require('./parseDateStrings');
const exitHook = require('exit-hook');

const Pool = Firebird.pool(50, Options);

const sqlQuery = param => {
  return (req, res) => {
    let result = [];
    const properties = req[param];

    if (properties.sharedKey !== process.env['FIREBIRD_SHARED_KEY']) {
      res.status(403);
      res.send('Invalid shared credentials');
    }

    const isTransaction = properties.isTransaction;
    const statements = properties.statements;

    if (isTransaction) {
      if (!statements || !statements.length) {
        return res.send(['No valid SQL statements found! Please enter valid SQL statements.']);
      }
    } else {
      if (!properties.sql) {
        return res.send(['No valid SQL query found! Please enter a valid SQL query.']);
      }
    }


    Pool.get(function(err, db) {
      if (err) {
        console.error(err);
        if (db) {
          db.detach()
        }
        res.status(400); // BAD REQUEST
        return res.send(`\n${err.message}\n`);
      }

      if (isTransaction) {
        db.transaction(Firebird.ISOLATION_REPEATABLE_READ, async (err, transaction) => {
          if (err) {
            db.detach();
            res.status(400); // BAD REQUEST
            return res.send(err.message);
          }

          for(const statement of statements) {
            const { params, sql } = statement;
            try {
              await executeTransactionQuery(transaction, { params: parseDateStrings(params), sql });
            } catch(err) {
              res.status(400);
              res.send(err.message);

              db.detach();
              return;
            }
          }

          transaction.commit((err) => {
            if (err) {
              res.status(400);
              res.send(err.message);

              transaction.rollback(() => {
                db.detach();
              });
            } else {
              res.status(200);
              res.send('OK');

              db.detach();
            }
          });
        })
      } else {
        const params = parseDateStrings(properties.params);
        const sql = properties.sql;
        db.query(sql, params, (err, data) => {
          if (err) {
            db.detach();
            res.status(400); // BAD REQUEST
            return res.send(`\n${err.message}\n`);
          }
          db.detach();

          if (data) {
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
          }

          const jsonString = bufferJson.stringify(result);

          return res.send(JSON.parse(jsonString));
        });
      }
    });
  };
};

function executeTransactionQuery(transaction, statement) {
  const { sql, params } = statement;
  return new Promise((resolve, reject) => {
    transaction.query(sql, params, (err, result) => {
      if (err) {
        transaction.rollback();
        reject(err);
      } else {
        resolve(result);
      }
    })
  });
}

function convertRow(row) {
  let newRow = {};
  Object.keys(row).forEach(el => {
    newRow[el] = row[el];
    if (row[el] instanceof Date) {
      newRow[el] = convertDate(row[el]);
    }
  });

  return newRow;
}


exitHook(() => {
  Pool.destroy();
})

module.exports = sqlQuery;
