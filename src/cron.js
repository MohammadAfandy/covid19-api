const cron = require('node-cron');
const moment = require('moment');
const myCache = require('./cache');

const {
  updateDataProvince,
  updateDataAll,
  updateDataDaily,
  updateDataListProvinces,
} = require('./services');

cron.schedule('0 18 * * *', async () => {
  console.log('----- CRON UPDATE DATA ----');
  console.log('---- Start Running on ' + moment().format('YYYY-MM-DD HH:mm:ss') + ' -----');

  // await updateDataProvince();
  // await updateDataAll();
  // await updateDataDaily();
  // await updateDataListProvinces();

  myCache.flushAll();

  console.log('---- End Running on ' + moment().format('YYYY-MM-DD HH:mm:ss') + ' -----');
});
