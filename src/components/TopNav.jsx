import React from 'react';
import { TYPHOON_NAME_MAP } from '../dataAdapter.js';

const TopNav = ({
  catalogue,
  selectedYear,
  setSelectedYear,
  selectedTyphoon,
  setSelectedTyphoon,
  isSidebarOpen,
  setIsSidebarOpen,
}) => (
  <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/5 bg-[#030712]/80 px-4 shadow-2xl backdrop-blur-xl md:px-6">
    <div className="flex min-w-0 items-center gap-3 md:gap-8">
      <div className="min-w-[128px] truncate font-headline text-base font-bold tracking-tight text-blue-100 md:text-xl">
        侵台颱風資料庫
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <span className="hidden sm:inline">年</span>
          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-blue-100 outline-none transition focus:border-cyan-400/70 md:text-sm"
            aria-label="選擇年份"
          >
            {catalogue && Object.keys(catalogue).sort().reverse().map((year) => (
              <option key={year} value={year} className="bg-slate-900">{year}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <span className="hidden sm:inline">颱風</span>
          <select
            value={selectedTyphoon}
            onChange={(event) => setSelectedTyphoon(event.target.value)}
            className="max-w-[132px] rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-blue-100 outline-none transition focus:border-cyan-400/70 md:max-w-none md:text-sm"
            aria-label="選擇颱風"
          >
            {catalogue && selectedYear && catalogue[selectedYear].map((name) => (
              <option key={name} value={name} className="bg-slate-900">
                {name}{TYPHOON_NAME_MAP[name] ? ` (${TYPHOON_NAME_MAP[name]})` : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>

    <button
      type="button"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-200 md:hidden"
      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      aria-label={isSidebarOpen ? '關閉資訊面板' : '開啟資訊面板'}
      title={isSidebarOpen ? '關閉資訊面板' : '開啟資訊面板'}
    >
      <span className="material-symbols-outlined">{isSidebarOpen ? 'close' : 'info'}</span>
    </button>
  </nav>
);

export default TopNav;
