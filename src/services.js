const myCache = require('./cache');
const axios = require('axios');
const moment = require('moment');
const { API_URL, CACHE_TTL } = require('./config');
const PROVINCES_LIST = require('./provinces')

const formatResponse = (jumlah_positif, jumlah_meninggal, jumlah_sembuh, jumlah_dirawat) => ({
  jumlah_positif,
  jumlah_meninggal,
  jumlah_sembuh,
  jumlah_dirawat,
});

exports.updateDataProvince = async () => {
  console.log("Requesting Data Province ...");
  const { data: { list_data, last_date }} = await axios.get(`${API_URL}/prov.json`);
  data_province = list_data.map((prov) => {
    const { penambahan } = prov;
    return {
      date: last_date,
      timestamp: new Date(last_date).getTime(),
      dateISO: new Date(last_date).toISOString(),
      province: prov.key,
      total: formatResponse(prov.jumlah_kasus, prov.jumlah_meninggal, prov.jumlah_sembuh, prov.jumlah_dirawat),
      penambahan: formatResponse(penambahan.positif, penambahan.meninggal, penambahan.sembuh, 0),
    }
  });
  myCache.set('data_province', data_province, CACHE_TTL);
  return data_province;
};

// exports.updateDataAll = async () => {
//   console.log("Requesting Data All ...");
//   const { data: { update } } = await axios.get(`${API_URL}/update.json`);
//   const { total, penambahan } = update;
//   data_all = {
//     last_date: penambahan.tanggal,
//     data: {
//       total: formatResponse(total.jumlah_positif, total.jumlah_meninggal, total.jumlah_sembuh, total.jumlah_dirawat),
//       penambahan: formatResponse(penambahan.jumlah_positif, penambahan.jumlah_meninggal, penambahan.jumlah_sembuh, penambahan.jumlah_dirawat),
//     }
//   }
//   myCache.set('data_all', data_all, CACHE_TTL);
//   return data_all;
// };

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

exports.updateProvinceDaily = async (province) => {
  console.log("Requesting Daily Provinces ...");
  province = province.split(' ').join('_');
  const { data: { kasus_tanpa_tgl, meninggal_tanpa_tgl, sembuh_tanpa_tgl, list_perkembangan, provinsi } } = await axios.get(`${API_URL}/prov_detail_${province}.json`);
  const new_data = {
    without_date: formatResponse(kasus_tanpa_tgl, meninggal_tanpa_tgl, sembuh_tanpa_tgl, 0),
    data: list_perkembangan.map((v) => ({
      date: moment(v.tanggal).format('YYYY-MM-DD'),
      timestamp: v.tanggal,
      dateISO: new Date(v.tanggal).toISOString(),
      total: formatResponse(v.AKUMULASI_KASUS, v.AKUMULASI_MENINGGAL, v.AKUMULASI_SEMBUH, v.AKUMULASI_DIRAWAT_OR_ISOLASI),
      penambahan: formatResponse(v.KASUS, v.MENINGGAL, v.SEMBUH, v.DIRAWAT_OR_ISOLASI),
    }))
  };
  myCache.set(`data_province_daily_${provinsi}`, new_data, CACHE_TTL);
  return new_data;
};

exports.updateDataStats = async () => {
  console.log("Requesting Data Statistic ...");
  const { data } = await axios.get(`${API_URL}/data.json`);
  const statistic = {};
  ['kasus', 'sembuh', 'meninggal', 'perawatan'].forEach((key) => {
    for (let stat in data[key]) {
      if (data[key][stat].current_data) {
        statistic[stat] = {
          current_data: data[key][stat].current_data,
          missing_data: data[key][stat].missing_data,
        }
      }
      statistic[stat][key] = data[key][stat].list_data;
    }
  });
  
  newData = {
    date: data.last_update,
    timestamp: new Date(data.last_update).getTime(),
    dateISO: new Date(data.last_update).toISOString(),
    data: statistic,
  };
  myCache.set('data_statistic', newData)
  return newData
}

exports.updateDailyVaccine = async () => {
  console.log("Requesting Daily Vaccine ...");
  const { data: { pemeriksaan, vaksinasi } } = await axios.get(`${API_URL}/pemeriksaan-vaksinasi.json`);
  const dailyPemeriksaanSpesimen = pemeriksaan.harian.map((v) => ({
    date: v.key_as_string,
    timestamp: v.key,
    dateISO: new Date(v.key).toISOString(),
    total: {
      pcr_tcm: v.jumlah_spesimen_pcr_tcm_kum.value,
      antigen: v.jumlah_spesimen_antigen_kum.value,
    },
    penambahan: {
      pcr_tcm: v.jumlah_spesimen_pcr_tcm.value,
      antigen: v.jumlah_spesimen_antigen.value,
    },
    // orang: {
    //   total: {
    //     pcr_tcm: v.jumlah_orang_pcr_tcm_kum.value,
    //     antigen: v.jumlah_orang_antigen_kum.value,
    //   },
    //   penambahan: {
    //     pcr_tcm: v.jumlah_orang_pcr_tcm.value,
    //     antigen: v.jumlah_orang_antigen.value,
    //   },
    // },
  }));

  const dailyPemeriksaanOrang = pemeriksaan.harian.map((v) => ({
    date: v.key_as_string,
    timestamp: v.key,
    dateISO: new Date(v.key).toISOString(),
    total: {
      pcr_tcm: v.jumlah_orang_pcr_tcm_kum.value,
      antigen: v.jumlah_orang_antigen_kum.value,
    },
    penambahan: {
      pcr_tcm: v.jumlah_orang_pcr_tcm.value,
      antigen: v.jumlah_orang_antigen.value,
    },
  }));

  const dailyVaksinasi = vaksinasi.harian.map((v) => ({
    date: v.key_as_string,
    timestamp: v.key,
    dateISO: new Date(v.key).toISOString(),
    total: {
      vaksinasi_1: v.jumlah_jumlah_vaksinasi_1_kum.value,
      vaksinasi_2: v.jumlah_jumlah_vaksinasi_2_kum.value,
    },
    penambahan: {
      vaksinasi_1: v.jumlah_vaksinasi_1.value,
      vaksinasi_2: v.jumlah_vaksinasi_2.value,
    },
  }));

  const newData = {
    pemeriksaan_spesimen: dailyPemeriksaanSpesimen,
    pemeriksaan_orang: dailyPemeriksaanOrang,
    vaksinasi: dailyVaksinasi,
  };

  // myCache.set('data_vaksinasi_daily', newData);
  return newData
}