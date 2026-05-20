import React from 'react';
import { formatEpoch, getBeaufortLabel, getTyphoonIntensity } from '../dataAdapter.js';

const warnText = {
  0: '無警報',
  1: '海上警報',
  2: '海陸警報',
  3: '解除警報',
};

function ValueRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
      <span className="text-[11px] font-bold tracking-wider text-on-surface-variant">{label}</span>
      <span className="text-right text-sm font-black text-primary-fixed">{value}</span>
    </div>
  );
}

function MiniRanking({ title, rows, setSelectedStation }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-black tracking-widest text-white/80">{title}</h3>
      <div className="space-y-2">
        {rows.map((station) => (
          <button
            key={station.stationId}
            type="button"
            className="w-full rounded-lg bg-white/5 p-2 text-left transition hover:bg-white/10"
            onClick={() => setSelectedStation(station.stationId)}
          >
            <div className="flex justify-between gap-3 text-xs font-bold text-white">
              <span className="truncate">{station.name}</span>
              <span className="shrink-0 text-secondary-fixed">{station.value} {station.unit}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const InfoPanel = ({
  event,
  currentEpoch,
  currentTyphoonPos,
  currentTimeIndex,
  rankings,
  rankingMetric,
  setRankingMetric,
  stationType,
  setStationType,
  activeMobilePanel,
  setActiveMobilePanel,
  setSelectedStation,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  if (!event) return null;

  const intensity = getTyphoonIntensity(currentTyphoonPos?.wind);
  const progress = event.epochs.length > 1
    ? Math.round((currentTimeIndex / (event.epochs.length - 1)) * 100)
    : 0;

  return (
    <>
      <div className={`
        absolute left-0 z-20 w-full px-4 py-4 transition-all duration-300 md:left-8 md:top-20 md:w-[340px] md:px-0 md:py-0
        ${isSidebarOpen ? 'bottom-[6.5rem] opacity-100' : '-bottom-full opacity-0'}
        md:bottom-auto md:opacity-100
      `}>
        <div className="max-h-[calc(100vh-11rem)] overflow-y-auto rounded-2xl border border-white/5 bg-[#030712]/85 p-5 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 flex gap-2 md:hidden">
            {[
              ['summary', '概況'],
              ['ranking', '排行'],
            ].map(([panel, label]) => (
              <button
                key={panel}
                type="button"
                className={`flex-1 rounded-full px-3 py-2 text-xs font-bold ${activeMobilePanel === panel ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20' : 'bg-white/10 text-slate-200'}`}
                onClick={() => setActiveMobilePanel(panel)}
              >
                {label}
              </button>
            ))}
          </div>

          {(activeMobilePanel === 'summary' || window.innerWidth >= 768) && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-headline text-2xl font-bold leading-tight text-white">
                  {event.metadata.localName}
                  <br />
                  <span className="text-sm font-normal text-slate-400">({event.metadata.name} {event.metadata.year})</span>
                </h2>
                <div className={`rounded border px-3 py-1 text-[10px] font-bold ${intensity.color}`}>
                  {intensity.label}
                </div>
              </div>

              <ValueRow label="當前時間" value={formatEpoch(currentEpoch)} />
              <ValueRow label="資料範圍" value={`${formatEpoch(event.timeRange.startEpoch, { hour: undefined, minute: undefined })} - ${formatEpoch(event.timeRange.endEpoch, { hour: undefined, minute: undefined })}`} />
              <ValueRow label="回放進度" value={`${progress}%`} />

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-black tracking-widest text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">air</span>
                  中心風力觀測
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-on-surface-variant">近中心最大風速</div>
                    <div className="text-xl font-black text-white">{currentTyphoonPos.wind ?? '-'} <span className="text-xs font-normal text-outline">m/s</span></div>
                    <div className="text-[11px] font-bold text-secondary-fixed">{getBeaufortLabel(currentTyphoonPos.wind)}</div>
                  </div>
                  <div className="border-l border-outline-variant/20 pl-4">
                    <div className="text-[10px] text-on-surface-variant">瞬間最大陣風</div>
                    <div className="text-xl font-black text-white">{currentTyphoonPos.gust ?? '-'} <span className="text-xs font-normal text-outline">m/s</span></div>
                    <div className="text-[11px] font-bold text-error">{getBeaufortLabel(currentTyphoonPos.gust)}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-white/5 pt-4">
                  {/* Card 1: 中心氣壓 */}
                  <div className="group rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-slate-400">
                      <span className="material-symbols-outlined text-xs text-sky-400 group-hover:animate-pulse">compress</span>
                      中心氣壓
                    </div>
                    <div className="mt-2 flex items-baseline">
                      <span className="font-display text-lg font-black text-white">
                        {currentTyphoonPos.pressure ?? '-'}
                      </span>
                      {currentTyphoonPos.pressure && (
                        <span className="ml-1 text-[10px] font-normal text-slate-400">hPa</span>
                      )}
                    </div>
                  </div>

                  {/* Card 2: 警報狀態 */}
                  <div className="group rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-slate-400">
                      <span className="material-symbols-outlined text-xs text-amber-400 group-hover:animate-bounce">warning</span>
                      警報狀態
                    </div>
                    <div className="mt-2 text-sm font-black">
                      {(() => {
                        const warnVal = currentTyphoonPos.warn;
                        const label = warnText[warnVal] || '無資料';
                        let colorClass = 'text-slate-400';
                        if (warnVal === 1) colorClass = 'text-amber-400';
                        if (warnVal === 2) colorClass = 'text-rose-400';
                        if (warnVal === 3) colorClass = 'text-emerald-400';
                        return (
                          <span className={`inline-flex items-center gap-1 ${colorClass}`}>
                            {(warnVal === 1 || warnVal === 2) && (
                              <span className="relative flex h-1.5 w-1.5">
                                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${warnVal === 2 ? 'bg-rose-400' : 'bg-amber-400'}`}></span>
                                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${warnVal === 2 ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                              </span>
                            )}
                            {label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Card 3: 中心位置 */}
                  <div className="group rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-slate-400">
                      <span className="material-symbols-outlined text-xs text-indigo-400 group-hover:rotate-12 transition-transform duration-300">explore</span>
                      中心位置
                    </div>
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-1 gap-y-0.5 text-xs font-black text-white font-display">
                      {currentTyphoonPos.lat !== undefined ? (
                        <>
                          <span>{currentTyphoonPos.lat.toFixed(1)}°N</span>
                          <span className="text-[10px] font-normal text-slate-500">,</span>
                          <span>{currentTyphoonPos.lon?.toFixed(1)}°E</span>
                        </>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                  </div>

                  {/* Card 4: 暴風半徑 */}
                  <div className="group rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-slate-400">
                      <span className="material-symbols-outlined text-xs text-emerald-400 group-hover:scale-110 transition-transform duration-300">radar</span>
                      暴風半徑
                    </div>
                    <div className="mt-1.5 flex flex-col gap-0.5">
                      <div className="flex justify-between items-baseline text-xs font-medium text-slate-300">
                        <span className="text-[11px] font-black text-slate-300 tracking-wide">7級</span>
                        <span className="font-bold text-white font-display text-xs">
                          {currentTyphoonPos.r7 ? (
                            <>
                              {currentTyphoonPos.r7}
                              <span className="ml-0.5 text-[10px] font-normal text-slate-400">km</span>
                            </>
                          ) : (
                            '-'
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline text-xs font-medium text-slate-300">
                        <span className="text-[11px] font-black text-slate-300 tracking-wide">10級</span>
                        <span className="font-bold text-white font-display text-xs">
                          {currentTyphoonPos.r10 ? (
                            <>
                              {currentTyphoonPos.r10}
                              <span className="ml-0.5 text-[10px] font-normal text-slate-400">km</span>
                            </>
                          ) : (
                            '-'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(activeMobilePanel === 'ranking') && (
            <div className="mt-5 space-y-4 border-t border-white/10 pt-5 md:hidden">
              {/* Metric Select Grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['avgWind', '平均風'],
                  ['gust', '瞬間風'],
                  ['rain', '雨量'],
                  ['pressure', '最低氣壓'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`rounded-xl py-2 text-xs font-bold transition-all ${rankingMetric === value ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20' : 'bg-white/5 text-slate-300'}`}
                    onClick={() => setRankingMetric(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Station Type Select Segmented Control */}
              <div className="flex gap-2 rounded-xl bg-white/5 p-1">
                {[
                  ['all', '全部'],
                  ['manual', '署屬站'],
                  ['automatic', '自動站'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`flex-1 rounded-lg py-1 text-[11px] font-bold transition-all ${stationType === value ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'}`}
                    onClick={() => setStationType(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Ranking Rows with visual progress bars */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {(rankings?.[rankingMetric] || []).map((station) => {
                  const isWind = rankingMetric === 'avgWind' || rankingMetric === 'gust';
                  const width = rankingMetric === 'pressure'
                    ? Math.max(8, Math.min(((1010 - station.value) / 120) * 100, 100))
                    : Math.min((station.value / (rankingMetric === 'rain' ? 100 : 45)) * 100, 100);

                  return (
                    <button
                      key={station.stationId}
                      type="button"
                      className="w-full rounded-xl bg-white/[0.02] border border-white/5 p-2.5 text-left transition hover:bg-white/10"
                      onClick={() => setSelectedStation(station.stationId)}
                    >
                      <div className="mb-1 flex justify-between gap-3 text-xs font-bold text-white">
                        <span className="truncate">{station.name}</span>
                        <span className="shrink-0 text-cyan-300 font-bold">
                          {isWind ? `${getBeaufortLabel(station.value)} ` : ''}{station.value} {station.unit}
                        </span>
                      </div>
                      <div className="h-1 overflow-hidden rounded bg-white/10">
                        <div className="h-full rounded bg-cyan-400" style={{ width: `${width}%` }} />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[9px] font-medium text-slate-500">
                        <span>{station.type === 'manual' ? '署屬站' : '自動站'}</span>
                        <span>{station.stationId}</span>
                      </div>
                    </button>
                  );
                })}
                {(!rankings?.[rankingMetric] || rankings[rankingMetric].length === 0) && (
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center text-xs text-slate-400">
                    此時間點沒有符合條件的測站資料。
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="mt-5 w-full rounded-xl bg-white/10 py-3 text-sm font-bold text-white md:hidden"
          >
            收合面板
          </button>
        </div>
      </div>
    </>
  );
};

export default InfoPanel;
