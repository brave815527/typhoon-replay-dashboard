import React from 'react';
import { TYPHOON_NAME_MAP } from '../utils';

const TopNav = ({ 
  catalogue, 
  selectedYear, 
  setSelectedYear, 
  selectedTyphoon, 
  setSelectedTyphoon, 
  isSidebarOpen, 
  setIsSidebarOpen 
}) => {
  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-6 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
      <div className="flex items-center gap-3 md:gap-8 overflow-hidden">
        <div className="text-sm md:text-xl font-bold tracking-tighter text-blue-200 font-headline truncate min-w-[120px]">
          侵台颱風資料庫
        </div>
        <div className="flex gap-2 md:gap-4 items-center">
          <div className="flex items-center gap-1 md:gap-2">
            <span className="hidden sm:inline text-[9px] md:text-[10px] text-slate-500 uppercase tracking-widest font-bold">年</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-1.5 md:px-2 py-1 text-xs md:text-sm text-blue-200 outline-none focus:border-cyan-500/50 cursor-pointer"
            >
              {catalogue && Object.keys(catalogue).sort().reverse().map(y => (
                <option key={y} value={y} className="bg-slate-900">{y}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <span className="hidden sm:inline text-[9px] md:text-[10px] text-slate-500 uppercase tracking-widest font-bold">颱</span>
            <select
              value={selectedTyphoon}
              onChange={(e) => setSelectedTyphoon(e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-1.5 md:px-2 py-1 text-xs md:text-sm text-blue-200 outline-none focus:border-cyan-500/50 cursor-pointer max-w-[100px] md:max-w-none"
            >
              {catalogue && selectedYear && catalogue[selectedYear].map(t => (
                <option key={t} value={t} className="bg-slate-900">{t} {TYPHOON_NAME_MAP[t] ? `(${TYPHOON_NAME_MAP[t]})` : ''}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Mobile Stats Toggle */}
      <button 
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 text-blue-300"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <span className="material-symbols-outlined">{isSidebarOpen ? 'close' : 'info'}</span>
      </button>
    </nav>
  );
};

export default TopNav;
