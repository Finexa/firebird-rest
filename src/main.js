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
app.listen(port, '0.0.0.0', () => console.log(`Firebird Server up and running on\nhttp://localhost:${port}`));

const proxy = require('redbird')({
  port: 80,
  xfwd: false,
  letsencrypt: {
    path: "certs",
    port: 3000
  },
  ssl: {
    port: 443
  }
});

proxy.register('firebird.finexa.no', `http://127.0.0.1:${port}`, {
  ssl: {
    letsencrypt: {
      email: 'felix@finexa.no',
      production: true,
    },
  },
});