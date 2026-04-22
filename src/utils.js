export function getBeaufortLabel(speed) {
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
  if (speed < 17.2) return { label: '熱帶性低氣壓', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  if (speed < 32.7) return { label: '輕度颱風', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
  if (speed < 51.0) return { label: '中度颱風', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
  return { label: '強烈颱風', color: 'bg-red-500/20 text-red-500 border-red-500/40 animate-pulse' };
}

export const TYPHOON_NAME_MAP = {
  'DANAS': '丹娜絲',
  'PODUL': '百合',
  'GAEMI': '凱米',
  'KONG-REY': '康芮',
  'KRATHON': '山陀兒',
  'DOKSURI': '杜蘇芮',
  'KOINU': '小犬',
  'MAWAR': '瑪娃',
  'SAOLA': '蘇拉'
};
