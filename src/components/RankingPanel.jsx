import React from 'react';
import { getBeaufortLabel, getMetricConfig } from '../dataAdapter.js';

const metricOptions = [
  ['avgWind', '平均風'],
  ['gust', '瞬間風'],
  ['rain', '雨量'],
  ['pressure', '最低氣壓'],
];

const stationTypeOptions = [
  ['all', '全部'],
  ['manual', '署屬站'],
  ['automatic', '自動站'],
];

function RankingRow({ station, metric, setSelectedStation }) {
  const isWind = metric === 'avgWind' || metric === 'gust';
  const width = metric === 'pressure'
    ? Math.max(8, Math.min(((1010 - station.value) / 120) * 100, 100))
    : Math.min((station.value / (metric === 'rain' ? 100 : 45)) * 100, 100);

  return (
    <button
      type="button"
      className="w-full rounded-lg p-2 text-left transition hover:bg-white/5"
      onClick={() => setSelectedStation(station.stationId)}
    >
      <div className="mb-1 flex justify-between gap-3 text-sm font-bold text-white">
        <span className="truncate">{station.name}</span>
        <span className="shrink-0 text-secondary-fixed">
          {isWind ? `${getBeaufortLabel(station.value)} ` : ''}{station.value} {station.unit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded bg-white/10">
        <div className="h-full rounded bg-secondary-fixed" style={{ width: `${width}%` }} />
      </div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {station.type === 'manual' ? '署屬站' : '自動站'} · {station.stationId}
      </div>
    </button>
  );
}

const RankingPanel = ({ rankings, metric, setMetric, stationType, setStationType, setSelectedStation }) => {
  const rows = rankings?.[metric] || [];
  const config = getMetricConfig(metric);

  return (
    <aside className="absolute right-8 top-20 z-10 hidden max-h-[calc(100vh-9rem)] w-[21rem] flex-col gap-5 overflow-y-auto rounded-2xl border border-white/5 bg-[#030712]/80 p-5 shadow-2xl backdrop-blur-xl md:flex">
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-base font-black text-white">
          <span className="material-symbols-outlined text-secondary-fixed text-lg">leaderboard</span>
          測站排行
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {metricOptions.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${metric === value ? 'bg-cyan-400 text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
              onClick={() => setMetric(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          {stationTypeOptions.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`flex-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${stationType === value ? 'bg-white text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
              onClick={() => setStationType(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-end justify-between">
          <h3 className="text-sm font-black tracking-widest text-white">{config.label}</h3>
          <span className="text-[11px] font-bold text-slate-400">{config.unit}</span>
        </div>
        <div className="space-y-2">
          {rows.map((station) => (
            <RankingRow
              key={station.stationId}
              station={station}
              metric={metric}
              setSelectedStation={setSelectedStation}
            />
          ))}
          {rows.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
              此時間點沒有符合條件的測站資料。
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default RankingPanel;
