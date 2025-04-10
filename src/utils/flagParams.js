const flags = require('flags');

flags.defineNumber('port', process.env.PORT || '4243', 'Port that app listens to');
flags.defineString('h', '10.180.2.4', 'Firebird Host');
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
    database: process.env.FIREBIRD_DATABASE || flags.get('db'),
    user: process.env.FIREBIRD_USER || flags.get('u'),
    password: process.env.FIREBIRD_PASSWORD || flags.get('pw'),
    role: process.env.FIREBIRD_ROLE || flags.get('r')
  };
};

const serverPort = () => {
  return flags.get('port');
};

module.exports = { options: options, serverPort: serverPort };
