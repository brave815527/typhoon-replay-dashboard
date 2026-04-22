import React from 'react';
import { getBeaufortLabel, getTyphoonIntensity, TYPHOON_NAME_MAP } from '../utils';

const InfoPanel = ({ 
  data, 
  currentEpoch, 
  currentTyphoonPos, 
  selectedYear, 
  topAvgWindStations, 
  setSelectedStation, 
  isSidebarOpen, 
  setIsSidebarOpen 
}) => {
  const intensity = getTyphoonIntensity(currentTyphoonPos?.wind || 0);

  return (
    <div className={`
      absolute z-20 w-full md:w-80 
      transition-all duration-300 ease-in-out
      ${isSidebarOpen ? 'top-20 opacity-100 translate-y-0' : '-top-full opacity-0 -translate-y-10'}
      md:top-20 md:opacity-100 md:translate-y-0
      left-0 md:left-28 px-4 md:px-0 py-4 md:py-0
    `}>
      <div className="bg-slate-900/95 md:bg-surface-container/70 backdrop-blur-[20px] rounded-xl p-6 shadow-2xl border border-outline-variant/30 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="font-headline text-2xl font-bold text-white leading-tight">
            {TYPHOON_NAME_MAP[data.typhoon.name] || data.typhoon.name}
            <br/>
            <span className="text-sm font-normal text-slate-400">({data.typhoon.name} {selectedYear})</span>
          </h2>
          <div className={`px-3 py-1 rounded border text-[10px] font-bold whitespace-nowrap ${intensity.color}`}>
            {intensity.label}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-surface-container-lowest p-3 rounded border border-outline-variant/15 flex justify-between items-center">
            <span className="font-label text-xs uppercase tracking-wider text-on-surface-variant">當前時間</span>
            <p className="font-headline text-sm font-bold text-primary-fixed">
              {new Date(Number(currentEpoch) * 1000).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
            </p>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded border border-outline-variant/15">
            <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-xs">air</span> 中心風力觀測</p>
            
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="font-label text-[9px] text-on-surface-variant uppercase tracking-wider">近中心最大風速</p>
                <p className="font-headline text-md font-bold text-white">{currentTyphoonPos.wind} <span className="text-xs font-normal text-outline">m/s</span></p>
                <p className="text-[10px] text-secondary-fixed">{getBeaufortLabel(currentTyphoonPos.wind)}</p>
              </div>
              <div className="border-l border-outline-variant/15 pl-4">
                <p className="font-label text-[9px] text-on-surface-variant uppercase tracking-wider">瞬間最大陣風</p>
                <p className="font-headline text-md font-bold text-white">{currentTyphoonPos.gust} <span className="text-xs font-normal text-outline">m/s</span></p>
                <p className="text-[10px] text-error">{getBeaufortLabel(currentTyphoonPos.gust)}</p>
              </div>
            </div>

            <div className="border-t border-outline-variant/15 mt-3 pt-3 flex justify-between items-center">
               <div>
                 <p className="font-label text-[9px] text-on-surface-variant mb-1 tracking-wider uppercase">中心氣壓</p>
                 <p className="font-headline text-sm font-bold text-primary-fixed">{currentTyphoonPos.pressure} hPa</p>
               </div>
               <div className={`text-[10px] font-bold px-2 py-0.5 rounded leading-tight ${currentTyphoonPos.warn === 2 ? 'bg-error text-error-container' : currentTyphoonPos.warn === 1 ? 'bg-primary text-on-primary' : 'bg-white/10 text-white'}`}>
                {currentTyphoonPos.warn === 2 ? '海陸警' : currentTyphoonPos.warn === 1 ? '海警' : '無警報'}
               </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-3 rounded border border-outline-variant/15 flex justify-between">
              <div className="text-center flex-1">
                <p className="font-label text-[9px] text-on-surface-variant mb-1 tracking-wider uppercase">七級暴風圈</p>
                <p className="font-headline text-sm font-bold text-white">{currentTyphoonPos.r7 > 0 ? `${currentTyphoonPos.r7}km` : '-'}</p>
              </div>
              <div className="border-l border-outline-variant/15 text-center flex-1">
                <p className="font-label text-[9px] text-on-surface-variant mb-1 tracking-wider uppercase">十級暴風圈</p>
                <p className="font-headline text-sm font-bold text-white">{currentTyphoonPos.r10 > 0 ? `${currentTyphoonPos.r10}km` : '-'}</p>
              </div>
          </div>

          {/* Mobile-only Leaderboard */}
          <div className="md:hidden space-y-4 pt-4 border-t border-outline-variant/15">
            <div>
              <h3 className="font-headline text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-fixed text-sm">air</span>
                測站風速排行
              </h3>
              <div className="space-y-3">
                {topAvgWindStations.map((st) => (
                  <div key={st.stno} 
                       className="cursor-pointer bg-white/5 hover:bg-white/10 p-2 rounded transition-colors"
                       onClick={() => {
                         setSelectedStation(st.stno);
                         setIsSidebarOpen(false);
                       }}>
                    <div className="flex justify-between font-label text-xs mb-1 text-white">
                      <span>{st.name || st.stno}</span>
                      <span className="text-secondary-fixed">{getBeaufortLabel(st.wind)} ({st.wind} m/s)</span>
                    </div>
                    <div className="w-full bg-surface-container-lowest h-1 rounded overflow-hidden">
                      <div className="bg-secondary-fixed h-full" style={{ width: `${Math.min((st.wind / 40) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Close Button Mobile only */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden w-full py-3 mt-4 bg-white/10 hover:bg-white/20 transition-colors rounded-xl text-white font-bold text-sm"
          >
            收起資訊
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;
