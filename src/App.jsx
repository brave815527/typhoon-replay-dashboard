import React, { Suspense, lazy, useEffect, useMemo, useReducer } from 'react';
import TopNav from './components/TopNav.jsx';
import TimelineScrubber from './components/TimelineScrubber.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import RankingPanel from './components/RankingPanel.jsx';
import {
  DEFAULT_LAYERS,
  buildQueryString,
  nearestEpochIndex,
  parseQueryState,
  resolveInitialSelection,
} from './urlState.js';
import {
  getCurrentData,
  getCurrentTyphoonPosition,
  normalizeTyphoonEvent,
  rankStations,
} from './dataAdapter.js';

const StationModal = lazy(() => import('./StationModal.jsx'));
const TyphoonMap = lazy(() => import('./components/TyphoonMap.jsx'));

const initialQuery = parseQueryState(typeof window !== 'undefined' ? window.location.search : '');

const initialState = {
  catalogue: null,
  event: null,
  selectedYear: '',
  selectedTyphoon: '',
  currentTimeIndex: 0,
  isPlaying: false,
  playbackSpeed: 1,
  selectedStation: initialQuery.station || null,
  pendingQueryTime: initialQuery.time || '',
  isSidebarOpen: false,
  activeMobilePanel: 'summary',
  rankingMetric: 'avgWind',
  stationType: 'all',
  layers: initialQuery.layers.length ? initialQuery.layers : DEFAULT_LAYERS,
  isLoading: true,
  error: null,
  notice: '',
};

function reducer(state, action) {
  switch (action.type) {
    case 'CATALOGUE_SUCCESS': {
      const selection = resolveInitialSelection(action.catalogue, initialQuery);
      return {
        ...state,
        catalogue: action.catalogue,
        selectedYear: selection.year,
        selectedTyphoon: selection.typhoon,
        notice: selection.usedFallback ? '網址參數無效，已載入最新可用颱風。' : '',
      };
    }
    case 'CATALOGUE_ERROR':
      return { ...state, isLoading: false, error: '無法載入颱風目錄，請稍後再試。' };
    case 'SELECT_YEAR': {
      const typhoons = state.catalogue?.[action.year] || [];
      return {
        ...state,
        selectedYear: action.year,
        selectedTyphoon: typhoons.includes(state.selectedTyphoon) ? state.selectedTyphoon : typhoons[0] || '',
        currentTimeIndex: 0,
        selectedStation: null,
        pendingQueryTime: '',
        isPlaying: false,
      };
    }
    case 'SELECT_TYPHOON':
      return {
        ...state,
        selectedTyphoon: action.typhoon,
        currentTimeIndex: 0,
        selectedStation: null,
        pendingQueryTime: '',
        isPlaying: false,
      };
    case 'DATA_LOADING':
      return { ...state, isLoading: true, error: null, event: null, isPlaying: false };
    case 'DATA_SUCCESS': {
      const event = normalizeTyphoonEvent(action.data, { year: state.selectedYear, typhoon: state.selectedTyphoon });
      return {
        ...state,
        event,
        isLoading: false,
        error: event.epochs.length ? null : '此颱風沒有可用的逐時觀測資料。',
        currentTimeIndex: nearestEpochIndex(event.epochs, state.pendingQueryTime),
        pendingQueryTime: '',
      };
    }
    case 'DATA_ERROR':
      return { ...state, isLoading: false, error: `無法載入 ${state.selectedYear} ${state.selectedTyphoon} 的資料。` };
    case 'SET_TIME_INDEX':
      return { ...state, currentTimeIndex: action.index };
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.isPlaying };
    case 'SET_SPEED':
      return { ...state, playbackSpeed: action.speed };
    case 'SET_STATION':
      return { ...state, selectedStation: action.stationId };
    case 'SET_SIDEBAR_OPEN':
      return { ...state, isSidebarOpen: action.isOpen };
    case 'SET_MOBILE_PANEL':
      return { ...state, activeMobilePanel: action.panel, isSidebarOpen: true };
    case 'SET_RANKING_METRIC':
      return { ...state, rankingMetric: action.metric };
    case 'SET_STATION_TYPE':
      return { ...state, stationType: action.stationType };
    case 'TOGGLE_LAYER': {
      const layers = state.layers.includes(action.layer)
        ? state.layers.filter((layer) => layer !== action.layer)
        : [...state.layers, action.layer];
      return { ...state, layers };
    }
    case 'SET_NOTICE':
      return { ...state, notice: action.notice };
    default:
      return state;
  }
}

function ErrorState({ message }) {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-950 p-4 text-center text-white">
      <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-slate-900 p-8 shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/50 bg-red-500/20">
          <span className="material-symbols-outlined text-3xl text-red-300">warning</span>
        </div>
        <h1 className="mb-3 text-2xl font-black">資料載入失敗</h1>
        <p className="mb-6 text-sm text-slate-300">{message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-500"
        >
          重新載入
        </button>
      </div>
    </div>
  );
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL;
    fetch(`${baseUrl}data/catalogue.json`)
      .then((res) => {
        if (!res.ok) throw new Error('catalogue not found');
        return res.json();
      })
      .then((catalogue) => dispatch({ type: 'CATALOGUE_SUCCESS', catalogue }))
      .catch(() => dispatch({ type: 'CATALOGUE_ERROR' }));
  }, []);

  useEffect(() => {
    if (!state.catalogue || !state.selectedYear || !state.selectedTyphoon) return;
    const typhoons = state.catalogue[state.selectedYear] || [];
    if (!typhoons.includes(state.selectedTyphoon)) return;

    const controller = new AbortController();
    dispatch({ type: 'DATA_LOADING' });
    const baseUrl = import.meta.env.BASE_URL;
    fetch(`${baseUrl}data/${state.selectedYear}/${state.selectedTyphoon}.json`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('event not found');
        return res.json();
      })
      .then((data) => dispatch({ type: 'DATA_SUCCESS', data }))
      .catch((error) => {
        if (error.name !== 'AbortError') dispatch({ type: 'DATA_ERROR' });
      });

    return () => controller.abort();
  }, [state.catalogue, state.selectedYear, state.selectedTyphoon]);

  const epochs = state.event?.epochs || [];
  const currentEpoch = epochs[state.currentTimeIndex] || null;
  const currentData = useMemo(() => getCurrentData(state.event, currentEpoch), [state.event, currentEpoch]);
  const currentTyphoonPos = useMemo(
    () => getCurrentTyphoonPosition(state.event?.track || [], currentEpoch),
    [state.event, currentEpoch]
  );
  const rankings = useMemo(() => ({
    avgWind: rankStations(state.event, currentEpoch, 'avgWind', { stationType: state.stationType }),
    gust: rankStations(state.event, currentEpoch, 'gust', { stationType: state.stationType }),
    rain: rankStations(state.event, currentEpoch, 'rain', { stationType: state.stationType }),
    pressure: rankStations(state.event, currentEpoch, 'pressure', { stationType: state.stationType }),
  }), [state.event, currentEpoch, state.stationType]);

  useEffect(() => {
    if (state.isPlaying && epochs.length > 0) {
      const interval = setInterval(() => {
        dispatch({
          type: 'SET_TIME_INDEX',
          index: Math.min(state.currentTimeIndex + 1, epochs.length - 1),
        });
        if (state.currentTimeIndex >= epochs.length - 2) {
          dispatch({ type: 'SET_PLAYING', isPlaying: false });
        }
      }, 500 / state.playbackSpeed);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [state.isPlaying, state.currentTimeIndex, epochs.length, state.playbackSpeed]);

  useEffect(() => {
    if (!state.selectedYear || !state.selectedTyphoon) return;
    const query = buildQueryString({
      year: state.selectedYear,
      typhoon: state.selectedTyphoon,
      time: currentEpoch,
      station: state.selectedStation,
      layers: state.layers,
    });
    window.history.replaceState(null, '', `${window.location.pathname}${query}`);
  }, [state.selectedYear, state.selectedTyphoon, currentEpoch, state.selectedStation, state.layers]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target.tagName === 'SELECT' || state.selectedStation) return;
      if (event.code === 'Space') {
        event.preventDefault();
        dispatch({ type: 'SET_PLAYING', isPlaying: !state.isPlaying });
      } else if (event.code === 'ArrowRight') {
        dispatch({ type: 'SET_TIME_INDEX', index: Math.min(state.currentTimeIndex + 1, epochs.length - 1) });
      } else if (event.code === 'ArrowLeft') {
        dispatch({ type: 'SET_TIME_INDEX', index: Math.max(state.currentTimeIndex - 1, 0) });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isPlaying, state.currentTimeIndex, state.selectedStation, epochs.length]);

  const setCurrentTimeIndex = (updater) => {
    const nextIndex = typeof updater === 'function' ? updater(state.currentTimeIndex) : updater;
    dispatch({ type: 'SET_TIME_INDEX', index: Math.max(0, Math.min(nextIndex, epochs.length - 1)) });
  };

  const jumpToPeak = () => {
    let peakIndex = 0;
    let peakWind = -Infinity;
    epochs.forEach((epoch, index) => {
      const point = getCurrentTyphoonPosition(state.event?.track || [], epoch);
      const wind = Number(point.wind || 0);
      if (wind > peakWind) {
        peakWind = wind;
        peakIndex = index;
      }
    });
    dispatch({ type: 'SET_TIME_INDEX', index: peakIndex });
  };

  if (state.error && !state.isLoading) {
    return <ErrorState message={state.error} />;
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-950 font-sans text-slate-200">
      <TopNav
        catalogue={state.catalogue}
        selectedYear={state.selectedYear}
        setSelectedYear={(year) => dispatch({ type: 'SELECT_YEAR', year })}
        selectedTyphoon={state.selectedTyphoon}
        setSelectedTyphoon={(typhoon) => dispatch({ type: 'SELECT_TYPHOON', typhoon })}
        isSidebarOpen={state.isSidebarOpen}
        setIsSidebarOpen={(isOpen) => dispatch({ type: 'SET_SIDEBAR_OPEN', isOpen })}
      />

      {state.notice && (
        <div className="fixed left-1/2 top-20 z-[80] -translate-x-1/2 rounded-full border border-cyan-400/30 bg-slate-950/90 px-4 py-2 text-xs font-bold text-cyan-100 shadow-2xl">
          {state.notice}
        </div>
      )}

      {(!state.event || state.isLoading) ? (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-md">
          <div className="h-20 w-20 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-400" />
          <p className="mt-8 text-xs font-black uppercase tracking-[0.3em] text-blue-200">載入颱風資料中</p>
        </div>
      ) : (
        <>
          <Suspense fallback={<div className="absolute inset-0 bg-slate-900" />}>
            <TyphoonMap
              event={state.event}
              currentData={currentData}
              currentTyphoonPos={currentTyphoonPos}
              layers={state.layers}
              toggleLayer={(layer) => dispatch({ type: 'TOGGLE_LAYER', layer })}
              setSelectedStation={(stationId) => dispatch({ type: 'SET_STATION', stationId })}
            />
          </Suspense>

          <InfoPanel
            event={state.event}
            currentEpoch={currentEpoch}
            currentTyphoonPos={currentTyphoonPos}
            currentTimeIndex={state.currentTimeIndex}
            selectedYear={state.selectedYear}
            rankings={rankings}
            rankingMetric={state.rankingMetric}
            setRankingMetric={(metric) => dispatch({ type: 'SET_RANKING_METRIC', metric })}
            stationType={state.stationType}
            setStationType={(stationType) => dispatch({ type: 'SET_STATION_TYPE', stationType })}
            activeMobilePanel={state.activeMobilePanel}
            setActiveMobilePanel={(panel) => dispatch({ type: 'SET_MOBILE_PANEL', panel })}
            setSelectedStation={(stationId) => dispatch({ type: 'SET_STATION', stationId })}
            isSidebarOpen={state.isSidebarOpen}
            setIsSidebarOpen={(isOpen) => dispatch({ type: 'SET_SIDEBAR_OPEN', isOpen })}
          />

          <RankingPanel
            rankings={rankings}
            metric={state.rankingMetric}
            setMetric={(metric) => dispatch({ type: 'SET_RANKING_METRIC', metric })}
            stationType={state.stationType}
            setStationType={(stationType) => dispatch({ type: 'SET_STATION_TYPE', stationType })}
            setSelectedStation={(stationId) => dispatch({ type: 'SET_STATION', stationId })}
          />

          <TimelineScrubber
            epochs={epochs}
            currentTimeIndex={state.currentTimeIndex}
            setCurrentTimeIndex={setCurrentTimeIndex}
            isPlaying={state.isPlaying}
            setIsPlaying={(isPlaying) => dispatch({ type: 'SET_PLAYING', isPlaying })}
            playbackSpeed={state.playbackSpeed}
            setPlaybackSpeed={(speed) => dispatch({ type: 'SET_SPEED', speed })}
            jumpToPeak={jumpToPeak}
          />
        </>
      )}

      {state.selectedStation && state.event && (
        <Suspense fallback={<div className="fixed inset-0 z-[2000] bg-black/70" />}>
          <StationModal
            stationId={state.selectedStation}
            event={state.event}
            currentEpoch={currentEpoch}
            onClose={() => dispatch({ type: 'SET_STATION', stationId: null })}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
