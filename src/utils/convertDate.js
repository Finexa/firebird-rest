const dayjs = require('dayjs');

const convertDate = (date) => {
  const beginningOfDay = dayjs(date).format('HH:mm:ss SSS') === '00:00:00 000';
  

  if(beginningOfDay) {
    return dayjs(date).format('YYYY-MM-DD');
  } else {
    return date;
  }
}

module.exports = convertDate;