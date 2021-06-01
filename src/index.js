const express = require('express');
const cors = require('cors');
const moment = require('moment');
const myCache = require('./cache');

// initialize app express
const app = express();

// get config
const {
  PORT,
  ALLOWED_ORIGIN,
} = require('./config');

// initialize cron
require('./cron');

// middlewares
app.use(cors({
  origin: ALLOWED_ORIGIN,
}));
app.use(express.urlencoded({ extended: true })); 
app.use(express.json());

const {
  updateDataProvince,
  updateDataAll,
  updateDataDaily,
  updateDataListProvinces,
} = require('./services');

app.get('/total', async (req, res, next) => {
  try {
    const { province } = req.query;
    let responseData = {};
    if (province) {
      let data_province = myCache.get('data_province');
      if (!data_province) {
        data_province = await updateDataProvince();
      }
      let data = data_province.data.find((v) => v.province.toLowerCase() === province.toLowerCase());
      if (!data) throw new Error("Invalid Province");
      responseData = {
        province: data.province,
        last_date: data_province.last_date,
        total: data.total,
        penambahan: data.penambahan,
      }
    } else {
      let data_all = myCache.get('data_all');
      if (!data_all) {
        data_all = await updateDataAll();
      }
      responseData = {
        province: 'ALL',
        last_date: data_all.last_date,
        total: data_all.data.total,
        penambahan: data_all.data.penambahan,
      };
    }
    res.json(responseData);
  } catch (error) {
    next(error);
  }
});

app.get('/daily', async (req, res, next) => {
  try {
    let { start_date, end_date } = req.query;
    if (start_date && moment(start_date, 'YYYY-MM-DD', true).isValid() === false) {
      throw new Error("Invalid start_date");
    }
    if (end_date && moment(end_date, 'YYYY-MM-DD', true).isValid() === false) {
      throw new Error("Invalid end_date");
    }

    let data_daily = myCache.get('data_daily');
    if (!data_daily) {
      data_daily = await updateDataDaily();
    }

    if (start_date && end_date) {
      data_daily = data_daily.filter((v) => v.date >= start_date && v.date <= end_date);
    } else if (start_date) {
      data_daily = data_daily.filter((v) => v.date >= start_date);
    } else if (end_date) {
      data_daily = data_daily.filter((v) => v.date <= end_date);
    }

    res.json({
      start_date: data_daily[0].date, 
      end_date: data_daily[data_daily.length - 1].date,
      data: data_daily,
    });
  } catch (error) {
    next(error);
  }
});

app.get('/provinces', async (req, res, next) => {
  try {
    let provinces = myCache.get('provinces');
    if (!provinces) {
      provinces = await updateDataListProvinces();
    }
    res.json(provinces);
  } catch (error) {
    next(error);
  }
});

app.get('/cache', async (req, res, next) => {
  try {
    let provinces = myCache.get('provinces');
    let data_all = myCache.get('data_all');
    let data_province = myCache.get('data_province');
    let data_daily = myCache.get('data_daily');
    res.json({
      provinces,
      data_all,
      data_province,
      data_daily,
    });
  } catch (error) {
    next(error);
  }
});

// not found handler
app.use((req, res, next) => {
  res.status(404).send('Not Found')
});

// error handler
app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).send(err.message || 'Internal Server Error')
});

app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
