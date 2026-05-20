export const FIELD_INDEX = {
  windAvg: 0,
  windDir: 1,
  gust: 2,
  gustDir: 3,
  temp: 4,
  humidity: 5,
  pressure: 6,
  precip: 7,
};

export const TYPHOON_NAME_MAP = {
  // 2024 - 2025
  GAEMI: '凱米',
  'KONG-REY': '康芮',
  KRATHON: '山陀兒',
  DANAS: '丹娜絲',
  PODUL: '百合',
  // 2022 - 2023
  HINNAMNOR: '軒嵐諾',
  MUIFA: '梅花',
  DOKSURI: '杜蘇芮',
  KOINU: '小犬',
  MAWAR: '瑪娃',
  SAOLA: '蘇拉',
  // 2020 - 2021
  CHANTHU: '璨樹',
  'CHOI-WAN': '彩雲',
  'IN-FA': '烟花',
  KOMPASU: '圓規',
  LUPIT: '盧碧',
  ATSANI: '閃電',
  BAVI: '巴威',
  HAGUPIT: '哈格比',
  MEKKHALA: '米克拉',
  VONGFONG: '黃蜂',
  // 2018 - 2019
  BAILU: '白鹿',
  LEKIMA: '利奇馬',
  MITAG: '米塔',
  MANGKHUT: '山竹',
  MARIA: '瑪莉亞',
  // 2016 - 2017
  GUCHOL: '谷超',
  HAITANG: '海棠',
  HATO: '天鴿',
  NESAT: '尼莎',
  TALIM: '泰利',
  MALAKAS: '馬勒卡',
  MEGI: '梅姬',
  MERANTI: '莫蘭蒂',
  NEPARTAK: '尼伯特',
  // 2014 - 2015
  'CHAN-HOM': '昌鴻',
  DUJUAN: '杜鵑',
  GONI: '天鵝',
  LINFA: '蓮花',
  NOUL: '諾盧',
  SOUDELOR: '蘇迪勒',
  HAGIBIS: '哈吉貝',
  MATMO: '麥德姆',
  // 2012 - 2013
  HAIKUI: '海葵',
  JELAWAT: '傑拉華',
  TEMBIN: '天秤',
  FITOW: '菲特',
  SOULIK: '蘇力',
  USAGI: '天兔',
  // 2010 - 2011
  FANAPI: '凡那比',
  LIONROCK: '獅子山',
  NAMTHEUN: '南修',
  SONGDA: '桑達',
  // 2008 - 2009
  'FUNG-WONG': '鳳凰',
  MORAKOT: '莫拉克',
  PARMA: '芭瑪',
  SINLAKU: '辛樂克',
  JANGMI: '薔蜜',
  KALMAEGI: '卡玫基',
  NURI: '鸚鵡',
  MOLAVE: '莫拉菲',
  // 2006 - 2007
  KROSA: '柯羅莎',
  MITAG: '米塔',
  PABUK: '帕布',
  SEPAT: '聖帕',
  WIPHA: '韋帕',
  WUTIP: '蝴蝶',
  CHANCHU: '珍珠',
  EWINIAR: '艾維尼',
  SAOMAI: '桑美',
  SHANSHAN: '珊珊',
  // 2004 - 2005
  AERE: '艾利',
  CONSON: '康森',
  HAIMA: '海馬',
  MEARI: '米雷',
  MINDULLE: '敏督利',
  NANMADOL: '南瑪都',
  'NOCK-TEN': '洛坦',
  RANANIM: '佳葉',
  DAMREY: '達維',
  KHANUN: '卡努',
  LONGWANG: '龍王',
  MATSA: '麥莎',
  SANVU: '珊珊',
  // 2002 - 2003
  NAKRI: '娜克莉',
  RAMMASUN: '威馬遜',
  KROVANH: '科羅旺',
  KUJIRA: '庫佳',
  MELOR: '茉莉',
  NANGKA: '南卡',
  VAMCO: '梵高',
  IMBUDO: '伊布都',
  // 2000 - 2001
  BEBINCA: '貝碧佳',
  BILIS: '碧利斯',
  BOPHA: '寶發',
  'KAI-TAK': '啟德',
  PRAPIROON: '派比安',
  XANGSANE: '象神',
  YAGI: '椰子',
  CHEBI: '奇比',
  CIMARON: '席馬隆',
  HAIYAN: '海燕',
  NARI: '納莉',
  TORAJI: '桃芝',
  TRAMI: '潭美',
  UTOR: '尤特',
  YUTU: '玉兔',
};

const RANKING_CONFIG = {
  avgWind: { label: '平均風', unit: 'm/s', field: 'windAvg', higherIsStronger: true },
  gust: { label: '瞬間風', unit: 'm/s', field: 'gust', higherIsStronger: true },
  rain: { label: '雨量', unit: 'mm', field: 'precip', higherIsStronger: true },
  pressure: { label: '氣壓', unit: 'hPa', field: 'pressure', higherIsStronger: false },
};

export function isValidValue(val) {
  if (val === null || val === undefined || val === '') return false;
  const num = Number(val);
  return Number.isFinite(num) && num > -50 && num < 990;
}

export function normalizeValue(val) {
  return isValidValue(val) ? Number(val) : null;
}

export function getStationReading(raw = []) {
  return {
    windAvg: normalizeValue(raw[FIELD_INDEX.windAvg]),
    windDir: normalizeValue(raw[FIELD_INDEX.windDir]),
    gust: normalizeValue(raw[FIELD_INDEX.gust]),
    gustDir: normalizeValue(raw[FIELD_INDEX.gustDir]),
    temp: normalizeValue(raw[FIELD_INDEX.temp]),
    humidity: normalizeValue(raw[FIELD_INDEX.humidity]),
    pressure: normalizeValue(raw[FIELD_INDEX.pressure]),
    precip: normalizeValue(raw[FIELD_INDEX.precip]),
  };
}

export function getStationType(stationId) {
  return /^\d/.test(String(stationId)) ? 'manual' : 'automatic';
}

export function normalizeTyphoonEvent(raw, { year, typhoon } = {}) {
  const name = typhoon || raw?.typhoon?.name || '';
  const hourlyByEpoch = raw?.hourlyData || {};
  const epochs = Object.keys(hourlyByEpoch).sort((a, b) => Number(a) - Number(b));
  const track = (raw?.typhoon?.track || []).map((point) => ({
    ...point,
    lat: normalizeValue(point.lat) ?? 23.5,
    lon: normalizeValue(point.lon) ?? 121,
    wind: normalizeValue(point.wind),
    gust: normalizeValue(point.gust),
    pressure: normalizeValue(point.pressure),
    r7: normalizeValue(point.r7),
    r10: normalizeValue(point.r10),
    warn: Number(point.warn || 0),
  }));
  const stations = Object.fromEntries(Object.entries(raw?.stations || {}).map(([stationId, station]) => [
    stationId,
    {
      id: stationId,
      name: station.n || stationId,
      lat: station.la,
      lon: station.lo,
      type: getStationType(stationId),
      extremes: station.extremes || {},
    },
  ]));

  return {
    metadata: {
      year,
      name,
      localName: TYPHOON_NAME_MAP[name] || name,
      source: 'CWA historical typhoon and station observations',
      updatedAt: new Date().toISOString(),
    },
    typhoon: { ...(raw?.typhoon || {}), name },
    track,
    trackLatLngs: track.map((point) => [point.lat, point.lon]),
    stations,
    hourlyByEpoch,
    epochs,
    timeRange: {
      startEpoch: epochs.length ? Number(epochs[0]) : null,
      endEpoch: epochs.length ? Number(epochs[epochs.length - 1]) : null,
    },
  };
}

export function getCurrentTyphoonPosition(track = [], epoch) {
  if (!track.length) return { lat: 23.5, lon: 121, wind: null, pressure: null, r7: null, r10: null, warn: 0 };
  const target = Number(epoch);
  let bestPoint = track[0];
  for (const point of track) {
    if (Number(point.epoch) <= target) bestPoint = point;
    else break;
  }
  return bestPoint;
}

export function getCurrentData(event, epoch) {
  return epoch ? event?.hourlyByEpoch?.[String(epoch)] || {} : {};
}

export function rankStations(event, epoch, metric = 'avgWind', options = {}) {
  const config = RANKING_CONFIG[metric] || RANKING_CONFIG.avgWind;
  const currentData = getCurrentData(event, epoch);
  const stationType = options.stationType || 'all';

  return Object.entries(currentData)
    .map(([stationId, raw]) => {
      const station = event?.stations?.[stationId];
      if (!station || (stationType !== 'all' && station.type !== stationType)) return null;
      const reading = getStationReading(raw);
      const value = reading[config.field];
      if (value === null) return null;
      return {
        stationId,
        name: station.name,
        type: station.type,
        value,
        unit: config.unit,
        reading,
        sortValue: config.higherIsStronger ? value : -value,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.sortValue - a.sortValue)
    .slice(0, options.limit || 5);
}

export function getBeaufortLabel(speed) {
  if (!isValidValue(speed)) return '無資料';
  if (speed < 0.3) return '0級';
  if (speed < 1.6) return '1級';
  if (speed < 3.4) return '2級';
  if (speed < 5.5) return '3級';
  if (speed < 8.0) return '4級';
  if (speed < 10.8) return '5級';
  if (speed < 13.9) return '6級';
  if (speed < 17.2) return '7級';
  if (speed < 20.8) return '8級';
  if (speed < 24.5) return '9級';
  if (speed < 28.5) return '10級';
  if (speed < 32.7) return '11級';
  if (speed < 37.0) return '12級';
  if (speed < 41.5) return '13級';
  if (speed < 46.2) return '14級';
  if (speed < 51.0) return '15級';
  if (speed < 56.1) return '16級';
  if (speed < 61.3) return '17級';
  return '17級以上';
}

export function getTyphoonIntensity(speed) {
  if (!isValidValue(speed)) return { label: '資料不足', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
  if (speed < 17.2) return { label: '熱帶性低氣壓', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  if (speed < 32.7) return { label: '輕度颱風', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
  if (speed < 51.0) return { label: '中度颱風', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
  return { label: '強烈颱風', color: 'bg-red-500/20 text-red-300 border-red-500/40' };
}

export function formatEpoch(epoch, options = {}) {
  if (!epoch) return '無資料';
  return new Date(Number(epoch) * 1000).toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options,
  });
}

export function getMetricConfig(metric) {
  return RANKING_CONFIG[metric] || RANKING_CONFIG.avgWind;
}
