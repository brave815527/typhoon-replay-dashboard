import React, { useState, useEffect, useMemo } from 'react';
import StationModal from './StationModal.jsx';
import TopNav from './components/TopNav.jsx';
import TimelineScrubber from './components/TimelineScrubber.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import RankingPanel from './components/RankingPanel.jsx';
import TyphoonMap from './components/TyphoonMap.jsx';
import { isValidValue } from './utils';

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

  // 2. Auto-update typhoon when year changes
  useEffect(() => {
    if (catalogue && selectedYear && catalogue[selectedYear]) {
      const typhoons = catalogue[selectedYear];
      if (typhoons.length > 0 && !typhoons.includes(selectedTyphoon)) {
        setSelectedTyphoon(typhoons[0]);
      }
    }
  }, [selectedYear, catalogue]);

  // 3. Typhoon Data Load
  useEffect(() => {
    if (!selectedYear || !selectedTyphoon || !catalogue) return;
    
    // Strict Validation: Only fetch if the combination is explicitly valid in the catalogue
    const typhoonsInYear = catalogue[selectedYear];
    if (!typhoonsInYear || !typhoonsInYear.includes(selectedTyphoon)) {
      console.log(`Waiting for selection sync: ${selectedYear}/${selectedTyphoon}`);
      return;
    }

    setIsLoading(true);
    setError(null); 
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
    if (!currentData || !stations) return [];
    return Object.keys(currentData)
      .map(stno => {
        const val = currentData[stno] ? currentData[stno][0] : -999;
        return {
          stno,
          name: stations[stno]?.n || stno,
          wind: isValidValue(val) ? val : -999
        };
      })
      .filter(s => isValidValue(s.wind))
      .sort((a, b) => b.wind - a.wind)
      .slice(0, 5);
  }, [currentData, stations]);

  const topGustWindStations = useMemo(() => {
    if (!currentData || !stations) return [];
    return Object.keys(currentData)
      .map(stno => {
        const val = currentData[stno] ? currentData[stno][2] : -999;
        return {
          stno,
          name: stations[stno]?.n || stno,
          wind: isValidValue(val) ? val : -999
        };
      })
      .filter(s => isValidValue(s.wind))
      .sort((a, b) => b.wind - a.wind)
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
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white p-4 text-center">
        <div className="max-w-md w-full bg-slate-900 p-10 rounded-3xl border border-red-500/30 shadow-2xl">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/50">
            <span className="material-symbols-outlined text-red-500 text-4xl">warning</span>
          </div>
          <h2 className="text-3xl font-black mb-4 tracking-tighter">發生錯誤</h2>
          <p className="text-slate-400 mb-8 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-red-600 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-[0.98]"
          >
            重新載入頁面
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 font-sans text-slate-200">
      <TopNav 
        catalogue={catalogue} 
        selectedYear={selectedYear} 
        setSelectedYear={setSelectedYear}
        selectedTyphoon={selectedTyphoon}
        setSelectedTyphoon={setSelectedTyphoon}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {(!data || isLoading) ? (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-md">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-cyan-400/20 border-b-cyan-400 rounded-full animate-spin-reverse"></div>
            </div>
          </div>
          <p className="mt-8 text-blue-200 font-black tracking-[0.3em] uppercase text-xs animate-pulse">正在加載颱風大數據...</p>
        </div>
      ) : (
        <>
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

          <TimelineScrubber 
            epochs={epochs}
            currentTimeIndex={currentTimeIndex}
            setCurrentTimeIndex={setCurrentTimeIndex}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            playbackSpeed={playbackSpeed}
            setPlaybackSpeed={setPlaybackSpeed}
          />
        </>
      )}

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
