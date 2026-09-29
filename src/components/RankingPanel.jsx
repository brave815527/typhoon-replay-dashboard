import React from 'react';
import { formatExtremeTime, getBeaufortLabel, getMetricConfig } from '../dataAdapter.js';

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

function RankingRow({ station, metric, setSelectedStation, viewMode = 'replay', index }) {
  const isWind = metric === 'avgWind' || metric === 'gust';
  const width = metric === 'pressure'
    ? Math.max(8, Math.min(((1010 - station.value) / 120) * 100, 100))
    : Math.min((station.value / (metric === 'rain' ? 100 : 45)) * 100, 100);

  const windLabel = isWind
    ? (viewMode === 'summary'
        ? (station.scaleNumber ? `${station.scaleNumber} · ` : '')
        : `${getBeaufortLabel(station.value)} `)
    : '';

  const rankBadgeClass =
    index === 0 ? 'bg-amber-400 text-slate-950 font-black shadow' :
    index === 1 ? 'bg-slate-200 text-slate-950 font-black shadow' :
    index === 2 ? 'bg-amber-600 text-white font-black shadow' :
    'bg-white/10 text-slate-400 font-bold';

  return (
    <button
      type="button"
      className="group flex w-full items-start gap-2.5 rounded-xl p-2 text-left transition hover:bg-white/5"
      onClick={() => setSelectedStation(station.stationId)}
    >
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] ${rankBadgeClass}`}>
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex justify-between gap-2 text-sm font-bold text-white">
          <span className="truncate group-hover:text-cyan-300 transition-colors">{station.name}</span>
          <span className="shrink-0 text-cyan-300 font-display">
            {windLabel}{station.value} {station.unit}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded bg-white/10">
          <div className="h-full rounded bg-cyan-400 transition-all duration-300" style={{ width: `${width}%` }} />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <span>{station.type === 'manual' ? '署屬站' : '自動站'} · {station.stationId}</span>
          {station.time && <span className="text-slate-400 font-normal">{formatExtremeTime(station.time)}</span>}
        </div>
      </div>
    </button>
  );
}

const RankingPanel = ({
  rankings,
  metric,
  setMetric,
  stationType,
  setStationType,
  setSelectedStation,
  viewMode = 'replay',
}) => {
  const rows = rankings?.[metric] || [];
  const config = getMetricConfig(metric);

  return (
    <aside className="absolute right-8 top-20 z-10 hidden max-h-[calc(100vh-8.5rem)] w-[21rem] flex-col gap-3 rounded-2xl border border-white/10 bg-[#030712]/85 p-4 shadow-2xl backdrop-blur-xl md:flex">
      {/* 頂部控制列（固定不隨列表滾動） */}
      <div className="shrink-0 space-y-3">
        <h2 className="flex items-center justify-between text-base font-black text-white">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-fixed text-lg">leaderboard</span>
            測站排行
          </div>
          <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-black text-cyan-200">
            {viewMode === 'summary' ? `全事件極值 · 前 ${rows.length} 名` : '即時觀測'}
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {metricOptions.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${metric === value ? 'bg-cyan-400 text-slate-950 shadow' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
              onClick={() => setMetric(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {stationTypeOptions.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`flex-1 rounded-full px-3 py-1 text-[11px] font-bold transition ${stationType === value ? 'bg-white text-slate-950 shadow' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
              onClick={() => setStationType(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 排行列表區域（滾輪平滑瀏覽） */}
      <div className="flex min-h-0 flex-1 flex-col border-t border-white/10 pt-2">
        <div className="mb-2 flex shrink-0 items-end justify-between px-1">
          <h3 className="text-xs font-black tracking-widest text-slate-300 uppercase">
            {config.label} {viewMode === 'summary' ? `(共 ${rows.length} 站)` : ''}
          </h3>
          <span className="text-[11px] font-bold text-slate-400">{config.unit}</span>
        </div>
        <div className="ranking-scroll flex-1 overflow-y-auto pr-1 space-y-1">
          {rows.map((station, index) => (
            <RankingRow
              key={station.stationId}
              station={station}
              metric={metric}
              setSelectedStation={setSelectedStation}
              viewMode={viewMode}
              index={index}
            />
          ))}
          {rows.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400 text-center">
              此條件下沒有符合條件的測站資料。
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default RankingPanel;

