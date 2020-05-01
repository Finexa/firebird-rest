#!/usr/bin/env node
const sqlQuery = require('./utils/sqlQuery');
const port = require('./utils/flagParams').serverPort();
const app = require('fastify')();
const bufferJson = require('buffer-json');

app.addContentTypeParser('application/json', { parseAs: 'string' }, async (req, body) => {
  return bufferJson.parse(body);
});

app.post('/', sqlQuery('body')); // parse SQL queries via http POST request

// RUN FIREBIRD SERVER
app.listen(port, () => console.log(`Firebird Server up and running on\nhttp://localhost:${port}`));
