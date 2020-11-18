const Firebird = require('node-firebird-dev');
const Options = require('./flagParams').options();
const convertDate = require('./convertDate');
const bufferJson = require('buffer-json');
const parseDateStrings = require('./parseDateStrings');

const sqlQuery = param => {
  return (req, res) => {
    let result = [];
    const properties = req[param];
    
    Options.database = properties.database || Options.database;
    Options.user = properties.user || Options.user;
    Options.password = properties.password || Options.password;
    Options.role = properties.role || Options.role;

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


    Firebird.attach(Options, (err, db) => {
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
            return res.send(`\n${err.message}\n`);
          }

          for(const statement of statements) {
            const { params, sql } = statement;
            await executeTransactionQuery(transaction, { params: parseDateStrings(params), sql });
          }

          transaction.commit((err) => {
            if (err) {
              res.status(400);
              res.send(`\n${err.message}\n`);
            } else {
              res.status(200);
              res.send('OK');
            }
          })
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

module.exports = sqlQuery;
