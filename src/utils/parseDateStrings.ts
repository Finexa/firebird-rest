const moment = require('moment');

module.exports = function parseDateStrings(value) {
  if (Array.isArray(value)) {
    return value.map((v) => parseDateString(v))
  } else {
    return parseDateString(value);
  }  
}

function parseDateString(value) {
  let returnValue = value;
  if (typeof value === 'string') {
    const isValidDateTime = moment(value, 'YYYY-MM-DDTHH:mm:ss.sssZ', true).isValid();
    const isValidDate = moment(value,  'YYYY-MM-DD', true).isValid();
      if (isValidDate || isValidDateTime) {
        returnValue = new Date(value);
      }
    }
  
  return returnValue;
}