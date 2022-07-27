const flags = require('flags');

flags.defineNumber('port', '4243', 'Port that app listens to');
flags.defineString('h', 'localhost', 'Firebird Host');
flags.defineNumber('p', '3050', 'Firebird Port');
flags.defineString('db', '/opt/firebird/examples/empbuild/employee.fdb', 'Absolute path to Firebird Database');
flags.defineString('u', 'SYSDBA', 'Firebird User');
flags.defineString('pw', 'masterkey', 'Firebird User Password');
flags.defineString('r', 'level4', 'Firebird User Role');

flags.parse();

const options = () => {
  return {
    host: process.env.FIREBIRD_HOST || flags.get('h'),
    port: process.env.FIREBIRD_PORT || flags.get('p'),
    database: 'inkasso',
    user: 'WEBPORTAL',
    password: process.env.FIREBIRD_PASSWORD || flags.get('pw'),
    role: process.env.FIREBIRD_ROLE || flags.get('r')
  };
};

const serverPort = () => {
  return flags.get('port');
};

module.exports = { options: options, serverPort: serverPort };
