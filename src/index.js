const express = require('express');
const cors = require('cors');
const moment = require('moment');
const myCache = require('./cache');
const morgan = require('morgan')

// initialize app express
const app = express();
app.use(morgan('dev'));

// get config
const {
  PORT,
  ALLOWED_ORIGIN,
} = require('./config');

// initialize cron
require('./cron');

// middlewares
app.use(cors({
  // origin: ALLOWED_ORIGIN,
}));
app.use(express.urlencoded({ extended: true })); 
app.use(express.json());

const {
  updateDataProvince,
  updateDataDaily,
  updateProvinceDaily,
  updateDataStats,
  updateDailyVaccine,
} = require('./services');

const sleep = (seconds) => new Promise((resolve, reject) => setTimeout(resolve, seconds));

app.get('/summary', async (req, res, next) => {
  try {
    let data_daily = myCache.get('data_daily');
    if (!data_daily) {
      data_daily = await updateDataDaily();
    }
    const last_data = data_daily[data_daily.length - 1];
    last_data.province = 'ALL';

    let data_province = myCache.get('data_province');
    if (!data_province) {
      data_province = await updateDataProvince();
    }

    res.json([
      last_data,
      ...data_province,
    ]);
  } catch (error) {
    next(error)
  }
});

app.get('/daily', async (req, res, next) => {
  try {
    let { province, start_date, end_date } = req.query;
    if (start_date && moment(start_date, 'YYYY-MM-DD', true).isValid() === false) {
      throw new Error("Invalid start_date");
    }
    if (end_date && moment(end_date, 'YYYY-MM-DD', true).isValid() === false) {
      throw new Error("Invalid end_date");
    }

    let data_daily, without_date
    if (province) {
      let province_daily = myCache.get(`data_province_daily_${province}`);
      if (!province_daily) {
        province_daily = await updateProvinceDaily(province);
      }
      data_daily = province_daily.data;
      without_date = province_daily.without_date;
    } else {
      data_daily = myCache.get('data_daily');
      if (!data_daily) {
        data_daily = await updateDataDaily();
      }
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
      province: province || 'ALL',
      without_date: without_date || {},
      data: data_daily,
    });
  } catch (error) {
    next(error);
  }
});

app.get('/statistic', async (req, res, next) => {
  try {
    let data_stats = myCache.get('data_statistic');
    if (!data_stats) {
      data_stats = await updateDataStats();
    }

    res.json(data_stats);
  } catch (error) {
    next(error)
  }
});

app.get('/daily_vaccine', async (req, res, next) => {
  try {
    let { start_date, end_date } = req.query;
    if (start_date && moment(start_date, 'YYYY-MM-DD', true).isValid() === false) {
      throw new Error("Invalid start_date");
    }
    if (end_date && moment(end_date, 'YYYY-MM-DD', true).isValid() === false) {
      throw new Error("Invalid end_date");
    }

    let data_daily = myCache.get('data_vaksinasi_daily');
    if (!data_daily) {
      data_daily = await updateDailyVaccine();
    }

    const result = {}
    for (let key in data_daily) {
      if (start_date && end_date) {
        data_daily[key] = data_daily[key].filter((v) => v.date >= start_date && v.date <= end_date);
      } else if (start_date) {
        data_daily[key] = data_daily[key].filter((v) => v.date >= start_date);
      } else if (end_date) {
        data_daily[key] = data_daily[key].filter((v) => v.date <= end_date);
      }

      result[key] = {
        start_date: data_daily[key][0].date, 
        end_date: data_daily[key][data_daily[key].length - 1].date,
        data: data_daily[key],
      };
    }

    res.json(result);
  } catch (error) {
    next(error)
  }
});

app.get('/provinces', async (req, res, next) => {
  try {
    res.json(require('./provinces'));
  } catch (error) {
    next(error);
  }
});

app.get('/cache', async (req, res, next) => {
  try {
    res.json(myCache.keys())
  } catch (error) {
    next(error);
  }
});

app.get('/cache/get', async (req, res, next) => {
  try {
    const { name } = req.query;
    const data = {};
    for (let key of myCache.keys()) {
      data[key] = {
        val: myCache.get(key),
        ttl: myCache.getTtl(key),
      };
    }
    res.json(name ? data[name] : data)
  } catch (error) {
    next(error);
  }
});

// not found handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' })
});

// error handler
app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' })
});

app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
