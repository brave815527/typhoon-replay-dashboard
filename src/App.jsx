import React, { useState, useEffect } from 'react';
import StationModal from './StationModal.jsx';
import TopNav from './components/TopNav.jsx';
import TimelineScrubber from './components/TimelineScrubber.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import RankingPanel from './components/RankingPanel.jsx';
import TyphoonMap from './components/TyphoonMap.jsx';

function App() {
  console.log("App component rendering start");
  const [catalogue, setCatalogue] = useState(null);
  const [data, setData] = useState(null);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTyphoon, setSelectedTyphoon] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Load Catalogue
  useEffect(() => {
    fetch('./data/catalogue.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load catalogue');
        return res.json();
      })
      .then(json => {
        setCatalogue(json);
        const latestYear = Object.keys(json).sort().reverse()[0];
        const latestTyphoon = json[latestYear][0];
        setSelectedYear(latestYear);
        setSelectedTyphoon(latestTyphoon);
      })
      .catch(err => {
        console.error(err);
        setError('無法載入颱風目錄資料');
        setIsLoading(false);
      });
  }, []);

  // 2. Load Typhoon Data
  useEffect(() => {
    if (!selectedYear || !selectedTyphoon || !catalogue) return;
    if (!catalogue[selectedYear]?.includes(selectedTyphoon)) return;
    
    setData(null); 
    setCurrentTimeIndex(0);
    setIsPlaying(false);
    setIsLoading(true);
    setError(null);

    fetch(`./data/${selectedYear}/${selectedTyphoon}.json`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load data for ${selectedTyphoon}`);
        return res.json();
      })
      .then(json => {
        setData(json);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Could not load data:", err);
        setError(`無法載入 ${selectedTyphoon} 的資料檔案`);
        setIsLoading(false);
      });
  }, [selectedYear, selectedTyphoon, catalogue]);

  useEffect(() => {
    setSelectedStation(null);
  }, [selectedTyphoon]);

  useEffect(() => {
    if (catalogue && selectedYear && catalogue[selectedYear]) {
      if (!catalogue[selectedYear].includes(selectedTyphoon)) {
        setSelectedTyphoon(catalogue[selectedYear][0]);
      }
    }
  }, [selectedYear, catalogue]);

  // 4. Keyboard / Scroll / Right-drag Interaction
  useEffect(() => {
    if (!data) return;
    const count = Object.keys(data.hourlyData).length;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') setCurrentTimeIndex(p => Math.min(count - 1, p + 1));
      if (e.key === 'ArrowLeft') setCurrentTimeIndex(p => Math.max(0, p - 1));
    };

    const handleWheel = (e) => {
      if (e.deltaY > 0) setCurrentTimeIndex(p => Math.min(count - 1, p + 1));
      if (e.deltaY < 0) setCurrentTimeIndex(p => Math.max(0, p - 1));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel);

    let isDragging = false;
    let startX = 0;
    let startIndex = 0;

    const startDragging = (clientX) => {
      isDragging = true;
      startX = clientX;
      startIndex = currentTimeIndex;
      document.body.style.cursor = 'ew-resize';
    };

    const updateDragging = (clientX) => {
      if (isDragging) {
        const deltaX = clientX - startX;
        const sensitivity = window.innerWidth < 768 ? 5 : 10;
        const indexDelta = Math.floor(deltaX / sensitivity);
        setCurrentTimeIndex(Math.max(0, Math.min(count - 1, startIndex + indexDelta)));
      }
    };

    const stopDragging = () => {
      isDragging = false;
      document.body.style.cursor = 'default';
    };

    const handleMouseDown = (e) => { if (e.button === 2) startDragging(e.clientX); };
    const handleMouseMove = (e) => updateDragging(e.clientX);
    const handleMouseUp = (e) => { if (e.button === 2) stopDragging(); };

    const handleTouchStart = (e) => {
      if (!e.target.closest('.leaflet-container') && !selectedStation) {
        startDragging(e.touches[0].clientX);
      }
    };
    const handleTouchMove = (e) => {
      if (isDragging) {
        updateDragging(e.touches[0].clientX);
        if (e.cancelable) e.preventDefault();
      }
    };
    const handleTouchEnd = () => stopDragging();
    const handleContext = (e) => {
      if (isDragging || e.target.closest('.leaflet-container')) e.preventDefault();
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('contextmenu', handleContext);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('contextmenu', handleContext);
    };
  }, [data, currentTimeIndex, selectedStation]);

  useEffect(() => {
    let interval;
    if (isPlaying && data) {
      interval = setInterval(() => {
        setCurrentTimeIndex(prev => {
          const epList = Object.keys(data.hourlyData).sort((a, b) => Number(a) - Number(b));
          if (prev >= epList.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500 / playbackSpeed); 
    }
    return () => clearInterval(interval);
  }, [isPlaying, data, playbackSpeed]);

  if (error) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-950 text-white">
        <TopNav catalogue={catalogue} selectedYear={selectedYear} setSelectedYear={setSelectedYear} selectedTyphoon={selectedTyphoon} setSelectedTyphoon={setSelectedTyphoon} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <div className="text-red-400 text-xl font-bold flex items-center gap-2">
          <span className="material-symbols-outlined">error</span> {error}
        </div>
      </div>
    );
  }

  if (!data || !data.typhoon || !data.typhoon.track) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          <div className="text-center">
            <h2 className="text-cyan-400 font-bold tracking-[0.2em] text-xl mb-2">INITIALIZING REPLAY SYSTEM</h2>
            <p className="text-slate-500 text-sm animate-pulse">Loading meteorological datasets...</p>
          </div>
        </div>
      </div>
    );
  }

  const hourlyData = data.hourlyData || {};
  const epochs = Object.keys(hourlyData).sort((a, b) => Number(a) - Number(b));
  const track = data.typhoon.track || [];
  const currentEpoch = (track[currentTimeIndex] && track[currentTimeIndex].epoch) || (epochs.length > 0 ? epochs[currentTimeIndex] : null);
  const currentData = currentEpoch ? (hourlyData[currentEpoch] || {}) : {};
  const currentTyphoonPos = track[currentTimeIndex] || track[0] || { lat: 23.5, lon: 121, wind: 0, pressure: 1000 };
  const trackLatLngs = track.map(t => [t.lat || 23.5, t.lon || 121]);

  const topAvgWindStations = (currentData ? Object.keys(currentData) : [])
    .map(stno => ({
      name: (data.stations && data.stations[stno]) ? data.stations[stno].n : stno,
      stno,
      wind: (currentData[stno] && currentData[stno][0] !== -999) ? currentData[stno][0] : 0,
    }))
    .sort((a, b) => (b.wind || 0) - (a.wind || 0))
    .slice(0, 5);

  const topGustWindStations = (currentData ? Object.keys(currentData) : [])
    .map(stno => ({
      name: (data.stations && data.stations[stno]) ? data.stations[stno].n : stno,
      stno,
      wind: (currentData[stno] && currentData[stno][2] !== -999) ? currentData[stno][2] : 0,
    }))
    .sort((a, b) => (b.wind || 0) - (a.wind || 0))
    .filter(st => st.wind > 0)
    .slice(0, 5);

  return (
    <div className="flex flex-col h-screen w-screen bg-surface-dim text-on-surface font-body overflow-hidden">
      <TopNav 
        catalogue={catalogue} 
        selectedYear={selectedYear} 
        setSelectedYear={setSelectedYear} 
        selectedTyphoon={selectedTyphoon} 
        setSelectedTyphoon={setSelectedTyphoon} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
      />

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

      <main className="flex-1 relative w-full h-full pt-16 md:pl-20 pb-20">
        <TyphoonMap 
          data={data} 
          currentData={currentData} 
          currentTyphoonPos={currentTyphoonPos} 
          track={track} 
          trackLatLngs={trackLatLngs} 
          setSelectedStation={setSelectedStation} 
        />
        
        <InfoPanel 
          data={data} 
          currentEpoch={currentEpoch} 
          currentTyphoonPos={currentTyphoonPos} 
          selectedYear={selectedYear} 
          topAvgWindStations={topAvgWindStations} 
          setSelectedStation={setSelectedStation} 
          isSidebarOpen={isSidebarOpen} 
          setIsSidebarOpen={setIsSidebarOpen} 
        />

        <RankingPanel 
          topAvgWindStations={topAvgWindStations} 
          topGustWindStations={topGustWindStations} 
          setSelectedStation={setSelectedStation} 
        />
      </main>

      <TimelineScrubber 
        epochs={epochs} 
        currentTimeIndex={currentTimeIndex} 
        setCurrentTimeIndex={setCurrentTimeIndex} 
        isPlaying={isPlaying} 
        setIsPlaying={setIsPlaying} 
        playbackSpeed={playbackSpeed} 
        setPlaybackSpeed={setPlaybackSpeed} 
      />

      {selectedStation && data && (
        <StationModal 
          stationId={selectedStation} 
          data={data} 
          onClose={() => setSelectedStation(null)} 
        />
      )}
    </div>
  );
}

export default App;
