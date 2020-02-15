#!/usr/bin/env node
const sqlQuery = require('./utils/sqlQuery');
const port = require('./utils/flagParams').serverPort();
const app = require('fastify')();

app.post('/', sqlQuery('body')); // parse SQL queries via http POST request

// RUN FIREBIRD SERVER
app.listen(port, () => console.log(`Firebird Server up and running on\nhttp://localhost:${port}`));
