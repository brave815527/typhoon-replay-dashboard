
export function isValidValue(val) {
  if (val === null || val === undefined || val === '') return false;
  const num = Number(val);
  // CWA common null/special values: -999, -999.7, -99, 999, 999.9, etc.
  // We exclude anything less than -50 or greater than/equal to 990
  if (isNaN(num) || num < -50 || num >= 990) return false;
  return true;
}

export function getBeaufortLabel(speed) {
  if (!isValidValue(speed)) return '缺測';
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
  if (!isValidValue(speed)) return { label: '資料不足', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
  if (speed < 17.2) return { label: '熱帶性低氣壓', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  if (speed < 32.7) return { label: '輕度颱風', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
  if (speed < 51.0) return { label: '中度颱風', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
  return { label: '強烈颱風', color: 'bg-red-500/20 text-red-500 border-red-500/40 animate-pulse' };
}

export const TYPHOON_NAME_MAP = {
  // 2020-2025
  'GAEMI': '凱米', 'KONG-REY': '康芮', 'KRATHON': '山陀兒', 'DANAS': '丹娜絲', 'PODUL': '百合',
  'HINNAMNOR': '軒嵐諾', 'MUIFA': '梅花', 'CHANTHU': '璨樹', 'CHOI-WAN': '彩雲', 'IN-FA': '煙花',
  'KOMPASU': '圓規', 'LUPIT': '盧碧', 'ATSANI': '艾莎尼', 'BAVI': '巴威', 'HAGUPIT': '哈格比',
  'MEKKHALA': '米克拉', 'VONGFONG': '黃蜂',
  // 2010-2019
  'BAILU': '白鹿', 'LEKIMA': '利奇馬', 'MITAG': '米塔', 'MANGKHUT': '山竹', 'MARIA': '瑪莉亞',
  'GUCHOL': '谷超', 'HAITANG': '海棠', 'HATO': '天鴿', 'NESAT': '尼莎', 'TALIM': '泰利',
  'MALAKAS': '馬勒卡', 'MEGI': '梅姬', 'MERANTI': '莫蘭蒂', 'NEPARTAK': '尼伯特',
  'CHAN-HOM': '昌鴻', 'DUJUAN': '杜鵑', 'GONI': '天鵝', 'LINFA': '蓮花', 'NOUL': '紅霞', 'SOUDELOR': '蘇迪勒',
  'HAGIBIS': '哈吉貝', 'MATMO': '麥德姆', 'FITOW': '菲特', 'SOULIK': '蘇力', 'USAGI': '天兔',
  'HAIKUI': '海葵', 'JELAWAT': '杰拉華', 'TEMBIN': '天秤', 'SAOLA': '蘇拉', 'DOKSURI': '杜蘇芮',
  'MUIFA': '梅花', 'SONGDA': '桑達', 'FANAPI': '凡那比', 'LIONROCK': '獅子山', 'NAMTHEUN': '南修',
  // 2000-2009
  'PARMA': '芭瑪', 'MORAKOT': '莫拉克', 'MOLAVE': '莫拉菲', 'JANGMI': '薔薇', 'KALMAEGI': '卡玫基',
  'NURI': '鸚鵡', 'SINLAKU': '森拉克', 'KROSA': '柯羅莎', 'PABUK': '帕布', 'SEPAT': '聖帕',
  'WIPHA': '韋帕', 'WUTIP': '蝴蝶', 'CHANCHU': '珍珠', 'EWINIAR': '艾維尼', 'SAOMAI': '桑美',
  'SHANSHAN': '珊珊', 'BILIS': '碧利斯', 'BOPHA': '波發', 'KHANUN': '卡努', 'LONGWANG': '龍王',
  'MATSA': '馬莎', 'SANVU': '珊瑚', 'AERE': '艾利', 'CONSON': '康森', 'HAIMA': '海馬',
  'MEARI': '米雷', 'MINDULLE': '敏督利', 'NANMADOL': '南瑪都', 'NOCK-TEN': '洛坦', 'RANANIM': '蘭寧',
  'IMBUDO': '伊布都', 'KROVANH': '柯羅旺', 'KUJIRA': '鯨魚', 'MELOR': '梅羅', 'NANGKA': '南卡',
  'VAMCO': '梵高', 'NAKRI': '娜克莉', 'RAMMASUN': '威馬遜', 'CHEBI': '奇比', 'CIMARON': '西馬隆',
  'HAIYAN': '海燕', 'NARI': '納莉', 'TORAJI': '桃芝', 'TRAMI': '潭美', 'UTOR': '尤特',
  'YUTU': '玉兔', 'BEBINCA': '比賓卡', 'KAI-TAK': '啟德', 'PRAPIROON': '派比安', 'XANGSANE': '象神',
  'YAGI': '摩羯', 'FUNG-WONG': '鳳凰'
};
