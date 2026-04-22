import React, { useState, useEffect, useMemo } from 'react';
import StationModal from './StationModal.jsx';
import TopNav from './components/TopNav.jsx';
import TimelineScrubber from './components/TimelineScrubber.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import RankingPanel from './components/RankingPanel.jsx';
import TyphoonMap from './components/TyphoonMap.jsx';

function App() {
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

  // 1. Initial Catalogue Load
  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL;
    fetch(`${baseUrl}data/catalogue.json`)
      .then(res => res.json())
      .then(json => {
        setCatalogue(json);
        const years = Object.keys(json).sort().reverse();
        if (years.length > 0) {
          const y = years[0];
          setSelectedYear(y);
          if (json[y] && json[y].length > 0) {
            setSelectedTyphoon(json[y][0]);
          }
        }
      })
      .catch(err => {
        console.error("Catalogue load error:", err);
        setError("無法載入颱風目錄");
      });
  }, []);

  // 2. Typhoon Data Load
  useEffect(() => {
    if (!selectedYear || !selectedTyphoon) return;
    
    setIsLoading(true);
    setData(null);
    setCurrentTimeIndex(0);
    setIsPlaying(false);

    const baseUrl = import.meta.env.BASE_URL;
    fetch(`${baseUrl}data/${selectedYear}/${selectedTyphoon}.json`)
      .then(res => {
        if (!res.ok) throw new Error("Data not found");
        return res.json();
      })
      .then(json => {
        setData(json);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Data load error:", err);
        setError(`無法載入 ${selectedTyphoon} 資料`);
        setIsLoading(false);
      });
  }, [selectedYear, selectedTyphoon]);

  // 3. Derived Data
  const track = useMemo(() => data?.typhoon?.track || [], [data]);
  const hourlyData = useMemo(() => data?.hourlyData || {}, [data]);
  const stations = useMemo(() => data?.stations || {}, [data]);
  const epochs = useMemo(() => Object.keys(hourlyData).sort((a, b) => Number(a) - Number(b)), [hourlyData]);

  // Master time source should be epochs
  const currentEpoch = useMemo(() => {
    return epochs.length > 0 ? epochs[currentTimeIndex] : null;
  }, [epochs, currentTimeIndex]);

  const currentData = useMemo(() => {
    return currentEpoch ? (hourlyData[currentEpoch] || {}) : {};
  }, [currentEpoch, hourlyData]);

  // Find the closest track point for the current epoch
  const currentTyphoonPos = useMemo(() => {
    if (!currentEpoch || track.length === 0) return { lat: 23.5, lon: 121, wind: 0, pressure: 1000 };
    
    const target = Number(currentEpoch);
    // Find exact match or the last point before this time
    let bestPoint = track[0];
    for (const point of track) {
      if (point.epoch <= target) {
        bestPoint = point;
      } else {
        break;
      }
    }
    return bestPoint;
  }, [currentEpoch, track]);

  const trackLatLngs = useMemo(() => track.map(t => [t.lat || 23.5, t.lon || 121]), [track]);

  const topAvgWindStations = useMemo(() => {
    return Object.keys(currentData)
      .map(stno => ({
        stno,
        name: stations[stno]?.n || stno,
        wind: (currentData[stno] && currentData[stno][0] !== -999) ? currentData[stno][0] : 0
      }))
      .sort((a, b) => b.wind - a.wind)
      .slice(0, 5);
  }, [currentData, stations]);

  const topGustWindStations = useMemo(() => {
    return Object.keys(currentData)
      .map(stno => ({
        stno,
        name: stations[stno]?.n || stno,
        wind: (currentData[stno] && currentData[stno][2] !== -999) ? currentData[stno][2] : 0
      }))
      .sort((a, b) => b.wind - a.wind)
      .filter(s => s.wind > 0)
      .slice(0, 5);
  }, [currentData, stations]);

  // 4. Playback logic
  useEffect(() => {
    let interval;
    if (isPlaying && epochs.length > 0) {
      interval = setInterval(() => {
        setCurrentTimeIndex(prev => {
          if (prev >= epochs.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, epochs, playbackSpeed]);

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-red-400 p-10 text-center font-bold">
        Error: {error}
      </div>
    );
  }

  if (!data || isLoading) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-slate-950 text-white">
        <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-6"></div>
        <div className="text-cyan-400 font-bold tracking-[0.2em] uppercase">Initializing Replay System...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <TopNav 
        catalogue={catalogue} 
        selectedYear={selectedYear} 
        setSelectedYear={setSelectedYear} 
        selectedTyphoon={selectedTyphoon} 
        setSelectedTyphoon={setSelectedTyphoon} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
      />

      <main className="flex-1 relative w-full h-full pt-16 pb-20">
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

      {selectedStation && (
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
