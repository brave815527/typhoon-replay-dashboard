import React from 'react';
import { getBeaufortLabel } from '../utils';

const RankingPanel = ({ topAvgWindStations, topGustWindStations, setSelectedStation }) => {
  if (!topAvgWindStations || !topGustWindStations) return null;
  return (
    <div className="absolute right-4 top-24 z-10 w-80 bg-surface-container-high/80 backdrop-blur-[20px] rounded p-6 shadow-2xl border border-outline-variant/30 hidden md:flex flex-col gap-6 max-h-[80vh] overflow-y-auto">
      <div>
        <h3 className="font-headline text-md font-bold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary-fixed text-sm">air</span>
          最大平均風速 (含自動站)
        </h3>
        <div className="space-y-4">
          {topAvgWindStations.map((st) => (
            <div key={st.stno} 
                 className="cursor-pointer hover:bg-white/5 p-2 rounded -mx-2 transition-colors"
                 onClick={() => setSelectedStation(st.stno)}>
              <div className="flex justify-between font-label text-sm mb-1 text-white">
                <span>{st.name || st.stno}</span>
                <span className="text-secondary-fixed">{getBeaufortLabel(st.wind)} ({st.wind} m/s)</span>
              </div>
              <div className="w-full bg-surface-container-lowest h-1.5 rounded overflow-hidden">
                <div className="bg-secondary-fixed h-full" style={{ width: `${Math.min((st.wind / 40) * 100, 100)}%` }}></div>
              </div>
            </div>
          ))}
          {topAvgWindStations.length === 0 && (
            <div className="text-outline text-sm">暫無資料</div>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-headline text-md font-bold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-error text-sm">storm</span>
          最大瞬間風速 (僅署屬站)
        </h3>
        <div className="space-y-4">
          {topGustWindStations.map((st) => (
            <div key={st.stno}
                 className="cursor-pointer hover:bg-white/5 p-2 rounded -mx-2 transition-colors"
                 onClick={() => setSelectedStation(st.stno)}>
              <div className="flex justify-between font-label text-sm mb-1 text-white">
                <span>{st.name || st.stno}</span>
                <span className="text-error">{getBeaufortLabel(st.wind)} ({st.wind} m/s)</span>
              </div>
              <div className="w-full bg-surface-container-lowest h-1.5 rounded overflow-hidden">
                <div className="bg-error h-full" style={{ width: `${Math.min((st.wind / 60) * 100, 100)}%` }}></div>
              </div>
            </div>
          ))}
          {topGustWindStations.length === 0 && (
            <div className="text-outline text-sm">暫無資料</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RankingPanel;
