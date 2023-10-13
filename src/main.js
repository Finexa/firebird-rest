#!/usr/bin/env node
require('dotenv').config();

const sqlQuery = require('./utils/sqlQuery');
const port = require('./utils/flagParams').serverPort();
const app = require('fastify')();
const bufferJson = require('buffer-json');

app.addContentTypeParser('application/json', { parseAs: 'string' }, async (req, body) => {
  return bufferJson.parse(body);
});

app.post('/', sqlQuery('body')); // parse SQL queries via http POST request

app.get('/', (req, res) => {
  res.status(200);
  res.send('Up and running');
});

app.get('/health', sqlQuery('health'));    

// RUN FIREBIRD SERVER
app.listen(port, '0.0.0.0', () => console.log(`Firebird Server up and running on\nhttp://localhost:${port}`));
