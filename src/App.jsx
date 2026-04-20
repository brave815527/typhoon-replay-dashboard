import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import { createWindBarbIcon } from './WindBarb.js';

function getBeaufortLabel(speed) {
  if (speed < 0.3) return 0;
  if (speed < 1.6) return 1;
  if (speed < 3.4) return 2;
  if (speed < 5.5) return 3;
  if (speed < 8.0) return 4;
  if (speed < 10.8) return 5;
  if (speed < 13.9) return 6;
  if (speed < 17.2) return 7;
  if (speed < 20.8) return 8;
  if (speed < 24.5) return 9;
  if (speed < 28.5) return 10;
  if (speed < 32.7) return 11;
  if (speed < 37.0) return 12;
  if (speed < 41.5) return 13;
  if (speed < 46.2) return 14;
  if (speed < 51.0) return 15;
  if (speed < 56.1) return 16;
  return 17;
}

const TYPHOON_NAME_MAP = {
  'DANAS': '丹娜絲',
  'PODUL': '百合',
  'GAEMI': '凱米',
  'KONG-REY': '康芮',
  'KRATHON': '山陀兒'
};

function App() {
  const [catalogue, setCatalogue] = useState(null);
  const [data, setData] = useState(null);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTyphoon, setSelectedTyphoon] = useState('');

  // 1. Load Catalogue
  useEffect(() => {
    fetch('./data/catalogue.json')
      .then(res => res.json())
      .then(json => {
        setCatalogue(json);
        const latestYear = Object.keys(json).sort().reverse()[0];
        const latestTyphoon = json[latestYear][0];
        setSelectedYear(latestYear);
        setSelectedTyphoon(latestTyphoon);
      });
  }, []);

  // 2. Load Typhoon Data
  useEffect(() => {
    if (!selectedYear || !selectedTyphoon) return;
    
    setData(null); 
    setCurrentTimeIndex(0);
    setIsPlaying(false);

    fetch(`./data/${selectedYear}/${selectedTyphoon}.json`)
      .then(res => res.json())
      .then(json => {
        setData(json);
      })
      .catch(err => console.error("Could not load data:", err));
  }, [selectedYear, selectedTyphoon]);

  useEffect(() => {
    let interval;
    if (isPlaying && data) {
      interval = setInterval(() => {
        setCurrentTimeIndex(prev => {
          const epochs = Object.keys(data.hourlyData).sort((a, b) => Number(a) - Number(b));
          if (prev >= epochs.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500); // 500ms per frame
    }
    return () => clearInterval(interval);
  }, [isPlaying, data]);

  if (!data) return <div className="flex h-screen items-center justify-center text-white">Loading Dataset...</div>;

  const epochs = Object.keys(data.hourlyData).sort((a, b) => Number(a) - Number(b));
  const currentEpoch = epochs[currentTimeIndex];
  const currentData = data.hourlyData[currentEpoch];

  // Find current typhoon position. Track times might not match exactly with hourly stations.
  // We find the closest track point before or equal to current epoch
  const track = data.typhoon.track;
  let currentTyphoonPos = track[0];
  for (let i = 0; i < track.length; i++) {
    if (track[i].epoch <= Number(currentEpoch)) {
      currentTyphoonPos = track[i];
    }
  }

  // Pre-calculate track path for map
  const trackLatLngs = track.map(t => [t.lat, t.lon]);

  // Aggregate station data to find highest wind
  const topAvgWindStations = Object.keys(currentData)
    .map(stno => ({
      name: data.stations[stno]?.n,
      stno,
      wind: currentData[stno][0] !== -999 ? currentData[stno][0] : 0,
    }))
    .sort((a, b) => b.wind - a.wind)
    .slice(0, 5);

  // Aggregate station data to find highest gusts
  const topGustWindStations = Object.keys(currentData)
    .map(stno => ({
      name: data.stations[stno]?.n,
      stno,
      wind: currentData[stno][2] !== -999 ? currentData[stno][2] : 0,
    }))
    .sort((a, b) => b.wind - a.wind)
    .filter(st => st.wind > 0)
    .slice(0, 5);

  return (
    <div className="flex flex-col h-screen w-screen bg-surface-dim text-on-surface font-body overflow-hidden">
      {/* Top AppBar */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-slate-950/70 backdrop-blur-xl border-b border-white/5 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-8">
          <div className="text-xl font-bold tracking-tighter text-blue-200 font-headline">
            侵台颱風歷史資料庫
          </div>
          <div className="hidden md:flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">年份</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-blue-200 outline-none focus:border-cyan-500/50 cursor-pointer"
              >
                {catalogue && Object.keys(catalogue).sort().reverse().map(y => (
                  <option key={y} value={y} className="bg-slate-900">{y}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">颱風</span>
              <select
                value={selectedTyphoon}
                onChange={(e) => setSelectedTyphoon(e.target.value)}
                className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-blue-200 outline-none focus:border-cyan-500/50 cursor-pointer"
              >
                {catalogue && selectedYear && catalogue[selectedYear].map(t => (
                  <option key={t} value={t} className="bg-slate-900">{t} {TYPHOON_NAME_MAP[t] ? `(${TYPHOON_NAME_MAP[t]})` : ''}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </nav>

      {/* Left Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-4rem)] flex-col items-center py-8 z-40 bg-slate-900/80 backdrop-blur-2xl w-20 border-r border-white/5">
        <div className="flex flex-col gap-8 w-full">
          <button className="w-full py-4 flex flex-col items-center gap-2 bg-blue-500/10 text-cyan-400 border-r-2 border-cyan-400 hover:bg-white/5">
            <span className="material-symbols-outlined">radar</span>
            <span className="font-['Inter'] font-medium text-xs uppercase tracking-widest">颱風路徑</span>
          </button>
          <button className="w-full py-4 flex flex-col items-center gap-2 text-slate-500 hover:text-slate-300 hover:bg-white/5">
            <span className="material-symbols-outlined">history</span>
            <span className="font-['Inter'] font-medium text-xs uppercase tracking-widest">觀測紀錄</span>
          </button>
        </div>
      </aside>

      {/* Main Map Content */}
      <main className="flex-1 relative w-full h-full pt-16 md:pl-20 pb-20">
        <div className="absolute inset-0 z-0 bg-slate-900">
          <MapContainer center={[23.5, 121]} zoom={7} className="w-full h-full" zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">Carto</a>'
            />
            <Polyline positions={trackLatLngs} color="#ff5451" weight={4} dashArray="10, 10" opacity={0.6} />

            {/* Typhoon markers */}
            {track.map((t, idx) => (
              <CircleMarker center={[t.lat, t.lon]} radius={3} color="#ff5451" fillOpacity={1} key={idx} />
            ))}
            {/* 7-level and 10-level storm radii */}
            {currentTyphoonPos.r7 > 0 && (
              <Circle
                center={[currentTyphoonPos.lat, currentTyphoonPos.lon]}
                radius={currentTyphoonPos.r7 * 1000}
                color="#facc15"
                weight={2}
                fillOpacity={0.15}
                dashArray="5, 10"
              />
            )}
            {currentTyphoonPos.r10 > 0 && (
              <Circle
                center={[currentTyphoonPos.lat, currentTyphoonPos.lon]}
                radius={currentTyphoonPos.r10 * 1000}
                color="#ef4444"
                weight={2}
                fillOpacity={0.25}
                dashArray="5, 10"
              />
            )}

            {/* Current typhoon glowing marker */}
            <CircleMarker center={[currentTyphoonPos.lat, currentTyphoonPos.lon]} radius={8} color="#ff5451" fillColor="#ff5451" className="animate-pulse" />

            {/* Stations Wind Barbs */}
            {Object.keys(currentData).map(stno => {
              const st = data.stations[stno];
              if (!st) return null;
              let wind = currentData[stno][0];
              let dir = currentData[stno][1];

              // Fallback if Average Wind is missing but Gust exists
              if (wind === -999) {
                wind = currentData[stno][2];
                dir = currentData[stno][3];
              }

              if (wind === -999 || dir === -999) return null;
              const color = wind > 17.2 ? '#ef4444' : (wind > 10.8 ? '#facc15' : '#62fae3');
              return (
                <Marker
                  key={stno}
                  position={[st.la, st.lo]}
                  icon={createWindBarbIcon(wind, dir, color)}
                />
              );
            })}
          </MapContainer>
        </div>

        {/* Left Info Panel */}
        <div className="absolute left-4 md:left-28 top-24 z-10 w-80 bg-surface-container/70 backdrop-blur-[20px] rounded p-6 shadow-2xl border border-outline-variant/30">
          <h2 className="font-headline text-2xl font-bold text-white mb-6 flex justify-between items-center">
            {TYPHOON_NAME_MAP[data.typhoon.name] || data.typhoon.name} ({data.typhoon.name})
            <span className="material-symbols-outlined text-tertiary-container">storm</span>
          </h2>
          <div className="space-y-6">
            <div className="bg-surface-container-lowest p-4 rounded border border-outline-variant/15">
              <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-1">時間</p>
              <p className="font-headline text-lg font-bold text-primary-fixed">
                {new Date(Number(currentEpoch) * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
              </p>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded border border-outline-variant/15 flex gap-4">
              <div className="flex-1">
                <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-1">緯度</p>
                <p className="font-headline text-lg font-bold text-primary-fixed">{currentTyphoonPos.lat}° N</p>
              </div>
              <div className="flex-1">
                <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-1">經度</p>
                <p className="font-headline text-lg font-bold text-primary-fixed">{currentTyphoonPos.lon}° E</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded border border-outline-variant/15">
              <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-xs">compress</span>中心最低氣壓</p>
              <div className="flex items-baseline gap-2 mb-3">
                <p className="font-headline text-2xl font-bold text-secondary-fixed">{currentTyphoonPos.pressure}</p>
                <p className="font-label text-sm text-on-surface-variant">hPa</p>
              </div>
              <div className="border-t border-outline-variant/15 pt-3 flex justify-between">
                <div>
                  <p className="font-label text-xs text-on-surface-variant mb-1 tracking-wider uppercase">七級暴風圈</p>
                  <p className="font-headline text-sm font-bold text-white">{currentTyphoonPos.r7 > 0 ? `${currentTyphoonPos.r7} km` : '-'}</p>
                </div>
                <div>
                  <p className="font-label text-xs text-on-surface-variant mb-1 tracking-wider uppercase">十級暴風圈</p>
                  <p className="font-headline text-sm font-bold text-white">{currentTyphoonPos.r10 > 0 ? `${currentTyphoonPos.r10} km` : '-'}</p>
                </div>
              </div>
            </div>

            {/* Warning level */}
            <div className="bg-surface-container-lowest p-4 py-3 rounded border border-outline-variant/15 flex items-center justify-between">
              <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-xs">warning</span>警報等級</p>
              <div className={`font-label text-xs font-bold px-2 py-1 rounded ${currentTyphoonPos.warn === 2 ? 'bg-error text-error-container' :
                currentTyphoonPos.warn === 1 ? 'bg-primary text-on-primary' :
                  'bg-white/10 text-white'
                }`}>
                {currentTyphoonPos.warn === 2 ? '海上陸上颱風警報' :
                  currentTyphoonPos.warn === 1 ? '海上颱風警報' : '未發布颱風警報'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel (Ranking) */}
        <div className="absolute right-4 top-24 z-10 w-80 bg-surface-container-high/80 backdrop-blur-[20px] rounded p-6 shadow-2xl border border-outline-variant/30 hidden md:flex flex-col gap-6 max-h-[80vh] overflow-y-auto">

          <div>
            <h3 className="font-headline text-md font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-fixed text-sm">air</span>
              最大平均風速 (含自動站)
            </h3>
            <div className="space-y-3">
              {topAvgWindStations.map((st, i) => (
                <div key={st.stno}>
                  <div className="flex justify-between font-label text-sm mb-1 text-white">
                    <span>{st.name || st.stno}</span>
                    <span className="text-secondary-fixed">{getBeaufortLabel(st.wind)}級 ({st.wind} m/s)</span>
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
            <div className="space-y-3">
              {topGustWindStations.map((st, i) => (
                <div key={st.stno}>
                  <div className="flex justify-between font-label text-sm mb-1 text-white">
                    <span>{st.name || st.stno}</span>
                    <span className="text-error">{getBeaufortLabel(st.wind)}級 ({st.wind} m/s)</span>
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
      </main>

      {/* Bottom Timeline Scrubber */}
      <div className="fixed bottom-0 w-full z-50 flex justify-center items-center gap-4 md:gap-12 px-4 md:px-12 h-20 bg-slate-950/90 backdrop-blur-md border-t border-cyan-500/20">
        <div className="absolute -top-6 left-0 w-full px-6 md:px-24">
          <div className="relative w-full h-6 flex items-center cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            setCurrentTimeIndex(Math.floor(ratio * epochs.length));
          }}>
            <div className="absolute w-full h-1 bg-outline-variant/40 rounded"></div>
            <div className="absolute h-1 bg-secondary rounded" style={{ width: `${(currentTimeIndex / Math.max(1, epochs.length - 1)) * 100}%` }}></div>
            <div className="absolute w-3 h-6 bg-secondary rounded -ml-1.5 shadow-[0_0_8px_rgba(68,226,205,0.5)] cursor-grab" style={{ left: `${(currentTimeIndex / Math.max(1, epochs.length - 1)) * 100}%` }}></div>
          </div>
        </div>

        <button className="flex flex-col items-center justify-center text-slate-400 hover:text-white" onClick={() => setCurrentTimeIndex(0)}>
          <span className="material-symbols-outlined mb-1">fast_rewind</span>
        </button>
        <button
          className="flex flex-col items-center justify-center text-cyan-400 drop-shadow-[0_0_8px_rgba(68,226,205,0.5)] hover:scale-110 active:scale-95 transition-all w-16 h-16"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          <span className="material-symbols-outlined mb-1 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>{isPlaying ? 'pause' : 'play_arrow'}</span>
        </button>
        <button className="flex flex-col items-center justify-center text-slate-400 hover:text-white" onClick={() => setCurrentTimeIndex(epochs.length - 1)}>
          <span className="material-symbols-outlined mb-1">fast_forward</span>
        </button>
      </div>

    </div>
  );
}

export default App;
