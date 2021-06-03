const myCache = require('./cache');
const axios = require('axios');
const moment = require('moment');
const { API_URL, CACHE_TTL } = require('./config');

const formatResponse = (jumlah_positif, jumlah_meninggal, jumlah_sembuh, jumlah_dirawat) => ({
  jumlah_positif,
  jumlah_meninggal,
  jumlah_sembuh,
  jumlah_dirawat,
});

exports.updateDataProvince = async () => {
  console.log("Requesting Data Province ...");
  const { data: { list_data, last_date }} = await axios.get(`${API_URL}/prov.json`);
  data_province = {
    last_date,
    data: list_data.map((prov) => {
      const { penambahan } = prov;
      return {
        province: prov.key,
        total: formatResponse(prov.jumlah_kasus, prov.jumlah_meninggal, prov.jumlah_sembuh, prov.jumlah_dirawat),
        penambahan: formatResponse(penambahan.positif, penambahan.meninggal, penambahan.sembuh, 0),
      }
    }),
  };
  myCache.set('data_province', data_province, CACHE_TTL);
  return data_province;
};

exports.updateDataAll = async () => {
  console.log("Requesting Data All ...");
  const { data: { update } } = await axios.get(`${API_URL}/update.json`);
  const { total, penambahan } = update;
  data_all = {
    last_date: penambahan.tanggal,
    data: {
      total: formatResponse(total.jumlah_positif, total.jumlah_meninggal, total.jumlah_sembuh, total.jumlah_dirawat),
      penambahan: formatResponse(penambahan.jumlah_positif, penambahan.jumlah_meninggal, penambahan.jumlah_sembuh, penambahan.jumlah_dirawat),
    }
  }
  myCache.set('data_all', data_all, CACHE_TTL);
  return data_all;
};

exports.updateDataDaily = async () => {
  console.log("Requesting Data Daily ...");
  const { data: { update } } = await axios.get(`${API_URL}/update.json`);
  const { harian } = update;

  data_daily = harian
    .map((v) => ({
      date: moment(v.key_as_string).format('YYYY-MM-DD'),
      timestamp: v.key,
      dateISO: v.key_as_string,
      total: formatResponse(v.jumlah_positif_kum.value, v.jumlah_meninggal_kum.value, v.jumlah_sembuh_kum.value, v.jumlah_dirawat_kum.value),
      penambahan: formatResponse(v.jumlah_positif.value, v.jumlah_meninggal.value, v.jumlah_sembuh.value, v.jumlah_dirawat.value),
    }));
  
  myCache.set('data_daily', data_daily, CACHE_TTL);
  return data_daily;
};

exports.updateDataListProvinces = async () => {
  console.log("Requesting List Provinces ...");
  const { data: { list_data } } = await axios.get(`${API_URL}/prov.json`);
  provinces = list_data.map((v) => v.key).sort();
  myCache.set('provinces', provinces, CACHE_TTL);
  return provinces;
};
