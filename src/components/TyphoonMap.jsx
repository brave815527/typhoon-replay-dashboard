import React, { memo, useMemo } from 'react';
import { Circle, CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip } from 'react-leaflet';
import { createBeaufortBadgeIcon, createWindBarbIcon, getWindBarbColor } from '../WindBarb.js';
import {
  formatExtremeTime,
  getBeaufortLabel,
  getBeaufortScale,
  getEventMaxGustSummary,
  getStationReading,
  isValidValue,
  windDirectionText,
} from '../dataAdapter.js';

const layerOptions = [
  ['wind', '風標'],
  ['track', '路徑'],
  ['r7', '七級圈'],
  ['r10', '十級圈'],
  ['rain', '雨量'],
];

function LayerControl({
  layers,
  toggleLayer,
  basemap,
  setBasemap,
  viewMode,
  setViewMode,
  windDisplayMode,
  setWindDisplayMode,
}) {
  return (
    <div className="absolute left-4 top-20 z-[500] flex flex-wrap items-center gap-2 md:left-auto md:right-[23rem]">
      {/* 模式切換：逐時回放 vs 最大陣風總結 */}
      {setViewMode && (
        <div className="flex rounded-full border border-white/10 bg-slate-950/70 p-0.5 shadow-xl backdrop-blur-md">
          <button
            type="button"
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${viewMode === 'replay' ? 'bg-cyan-400 text-slate-950 shadow' : 'text-slate-300 hover:text-white'}`}
            onClick={() => setViewMode('replay')}
            title="逐時回放模式"
          >
            回放
          </button>
          <button
            type="button"
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${viewMode === 'summary' ? 'bg-cyan-400 text-slate-950 shadow' : 'text-slate-300 hover:text-white'}`}
            onClick={() => setViewMode('summary')}
            title="最大陣風總結圖"
          >
            陣風總結
          </button>
        </div>
      )}

      {/* 風速樣式切換 */}
      {setWindDisplayMode && layers.includes('wind') && (
        <div className="flex rounded-full border border-white/10 bg-slate-950/70 p-0.5 shadow-xl backdrop-blur-md">
          {viewMode === 'summary' ? (
            <>
              <button
                type="button"
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${windDisplayMode !== 'speed' ? 'bg-cyan-400 text-slate-950 shadow' : 'text-slate-300 hover:text-white'}`}
                onClick={() => setWindDisplayMode('scale')}
                title="以數字顯示風級 (0~17+)"
              >
                風級數字
              </button>
              <button
                type="button"
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${windDisplayMode === 'speed' ? 'bg-cyan-400 text-slate-950 shadow' : 'text-slate-300 hover:text-white'}`}
                onClick={() => setWindDisplayMode('speed')}
                title="以數字顯示最大陣風 (m/s)"
              >
                陣風 m/s
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${windDisplayMode === 'barb' ? 'bg-cyan-400 text-slate-950 shadow' : 'text-slate-300 hover:text-white'}`}
                onClick={() => setWindDisplayMode('barb')}
                title="顯示為風向風標"
              >
                風標
              </button>
              <button
                type="button"
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${windDisplayMode === 'scale' ? 'bg-cyan-400 text-slate-950 shadow' : 'text-slate-300 hover:text-white'}`}
                onClick={() => setWindDisplayMode('scale')}
                title="以數字顯示風級"
              >
                風級
              </button>
            </>
          )}
        </div>
      )}

      {/* 底圖切換：深色 vs 衛星 */}
      <div className="flex rounded-full border border-white/10 bg-slate-950/70 p-0.5 shadow-xl backdrop-blur-md">
        <button
          type="button"
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${basemap === 'dark' ? 'bg-cyan-400 text-slate-950 shadow' : 'text-slate-300 hover:text-white'}`}
          onClick={() => setBasemap('dark')}
          title="深色地圖"
        >
          深色
        </button>
        <button
          type="button"
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${basemap === 'satellite' ? 'bg-cyan-400 text-slate-950 shadow' : 'text-slate-300 hover:text-white'}`}
          onClick={() => setBasemap('satellite')}
          title="衛星地圖"
        >
          衛星
        </button>
      </div>

      <div className="hidden h-4 w-[1px] bg-white/20 sm:block" />

      {/* 圖層開關 */}
      {layerOptions.map(([layer, label]) => {
        if (viewMode === 'summary' && ['r7', 'r10', 'rain'].includes(layer)) return null;
        let displayLabel = label;
        if (layer === 'wind') {
          if (viewMode === 'summary') {
            displayLabel = windDisplayMode === 'speed' ? '陣風值' : '風級數';
          } else {
            displayLabel = windDisplayMode === 'scale' ? '風級' : '風標';
          }
        }
        return (
          <button
            key={layer}
            type="button"
            className={`rounded-full border px-3 py-1.5 text-[11px] font-bold shadow-xl backdrop-blur-md transition ${layers.includes(layer) ? 'border-cyan-300/50 bg-cyan-400 text-slate-950' : 'border-white/10 bg-slate-950/70 text-slate-200 hover:bg-white/10'}`}
            onClick={() => toggleLayer(layer)}
            aria-pressed={layers.includes(layer)}
            title={`切換${displayLabel}`}
          >
            {displayLabel}
          </button>
        );
      })}
    </div>
  );
}

const TyphoonMap = ({
  event,
  currentData,
  currentTyphoonPos,
  layers,
  toggleLayer,
  setSelectedStation,
  viewMode = 'replay',
  setViewMode,
  windDisplayMode = 'barb',
  setWindDisplayMode,
}) => {
  const [basemap, setBasemap] = React.useState('dark');

  const maxGustSummary = useMemo(() => {
    if (viewMode !== 'summary' || !event) return {};
    return getEventMaxGustSummary(event);
  }, [viewMode, event]);

  const summaryStations = useMemo(() => Object.values(maxGustSummary), [maxGustSummary]);
  const topGustStation = useMemo(() => {
    if (!summaryStations.length) return null;
    return [...summaryStations].sort((a, b) => b.maxGust - a.maxGust)[0];
  }, [summaryStations]);

  if (!event || !event.stations) return null;

  return (
    <div className="absolute inset-0 z-0 bg-slate-900">
      <LayerControl
        layers={layers}
        toggleLayer={toggleLayer}
        basemap={basemap}
        setBasemap={setBasemap}
        viewMode={viewMode}
        setViewMode={setViewMode}
        windDisplayMode={windDisplayMode}
        setWindDisplayMode={setWindDisplayMode}
      />

      {/* 最大陣風總結模式下的左上方統計卡片 */}
      {viewMode === 'summary' && topGustStation && (
        <div className="absolute left-4 top-20 z-[450] flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-[#030712]/90 p-4 shadow-2xl backdrop-blur-xl md:left-8 md:top-20 md:w-80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">
                <span className="material-symbols-outlined text-sm">air</span>
              </span>
              <span className="text-sm font-black text-white">{event.metadata.localName} 最大陣風總結</span>
            </div>
            <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-black text-cyan-200">
              全事件極值
            </span>
          </div>
          <div className="text-xs text-slate-300">
            全台最大陣風：<strong className="text-amber-300">{topGustStation.name}</strong>{' '}
            <span className="rounded bg-rose-500/30 px-1 py-0.5 font-black text-rose-200">{topGustStation.scaleNumber}</span>{' '}
            ({topGustStation.maxGust.toFixed(1)} m/s)
            {topGustStation.timeStr && (
              <span className="block text-[10px] text-slate-400 mt-0.5">時間：{formatExtremeTime(topGustStation.timeStr)}</span>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-2 text-[11px] text-slate-400">
            <span>觀測測站數：{summaryStations.length} 站</span>
            {setViewMode && (
              <button
                type="button"
                onClick={() => setViewMode('replay')}
                className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 font-bold text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
              >
                返回逐時回放
              </button>
            )}
          </div>
        </div>
      )}

      <MapContainer
        center={[23.5, 121]}
        zoom={window.innerWidth < 768 ? 6 : 7}
        className="h-full w-full"
        zoomControl={false}
        scrollWheelZoom
      >
        {basemap === 'satellite' ? (
          <>
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              maxZoom={18}
            />
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          </>
        ) : import.meta.env.VITE_CARTO_API_KEY ? (
          <TileLayer
            url={`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${import.meta.env.VITE_CARTO_API_KEY}`}
            attribution='&copy; <a href="https://carto.com/">Carto</a>'
            maxZoom={19}
          />
        ) : (
          <>
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
              maxZoom={16}
            />
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              maxZoom={16}
            />
          </>
        )}

        {/* 颱風路徑線條 */}
        {layers.includes('track') && (
          <>
            {event.track.slice(0, -1).map((point, index) => {
              const nextPoint = event.track[index + 1];
              const speed = point.wind;
              let color = '#64748b';
              if (speed !== null && speed !== undefined && speed >= 0) {
                if (speed < 17.2) color = '#10b981';
                else if (speed < 32.7) color = '#06b6d4';
                else if (speed < 51.0) color = '#fb923c';
                else color = '#ef4444';
              }
              return (
                <Polyline
                  key={`segment-${point.epoch}`}
                  positions={[[point.lat, point.lon], [nextPoint.lat, nextPoint.lon]]}
                  color={color}
                  weight={4}
                  opacity={0.8}
                />
              );
            })}
            {event.track.map((point) => {
              const speed = point.wind;
              let color = '#64748b';
              if (speed !== null && speed !== undefined && speed >= 0) {
                if (speed < 17.2) color = '#10b981';
                else if (speed < 32.7) color = '#06b6d4';
                else if (speed < 51.0) color = '#fb923c';
                else color = '#ef4444';
              }
              return (
                <CircleMarker
                  key={`marker-${point.epoch}`}
                  center={[point.lat, point.lon]}
                  radius={3}
                  color={color}
                  fillColor={color}
                  fillOpacity={1}
                  weight={1}
                />
              );
            })}
          </>
        )}

        {/* 逐時回放模式下的七級與十級風暴風圈 */}
        {viewMode === 'replay' && layers.includes('r7') && currentTyphoonPos.r7 > 0 && (
          <Circle
            center={[currentTyphoonPos.lat, currentTyphoonPos.lon]}
            radius={currentTyphoonPos.r7 * 1000}
            color="#facc15"
            weight={2}
            fillOpacity={0.12}
            dashArray="5, 10"
          />
        )}
        {viewMode === 'replay' && layers.includes('r10') && currentTyphoonPos.r10 > 0 && (
          <Circle
            center={[currentTyphoonPos.lat, currentTyphoonPos.lon]}
            radius={currentTyphoonPos.r10 * 1000}
            color="#ef4444"
            weight={2}
            fillOpacity={0.22}
            dashArray="5, 10"
          />
        )}

        {/* 逐時回放模式下的颱風中心動畫點 */}
        {viewMode === 'replay' && (
          <CircleMarker
            center={[currentTyphoonPos.lat, currentTyphoonPos.lon]}
            radius={9}
            color="#ff5451"
            fillColor="#ff5451"
            fillOpacity={0.9}
            className="animate-pulse"
          />
        )}

        {/* 最大陣風總結模式下的測站標記（純數字徽章，無中文級，無風標） */}
        {viewMode === 'summary' && layers.includes('wind') && summaryStations.map((st) => {
          const displayType = windDisplayMode === 'speed' ? 'speed' : 'scale';
          const icon = createBeaufortBadgeIcon(st.scale, st.gustDir, st.maxGust, {
            displayType,
            showArrow: false,
          });

          return (
            <Marker
              key={`summary-${st.stationId}`}
              position={[st.lat, st.lon]}
              icon={icon}
              eventHandlers={{ click: () => setSelectedStation(st.stationId) }}
            >
              <Tooltip direction="top" offset={[0, -10]} className="station-tooltip">
                <div className="text-xs font-black text-white">{st.name} ({st.stationId})</div>
                <div className="mt-0.5 text-[11px] font-bold text-amber-300">
                  最大陣風：<span className="font-black text-rose-300">{st.scaleNumber}</span> ({st.maxGust.toFixed(1)} m/s)
                </div>
                <div className="text-[10px] text-slate-300">
                  風向：{windDirectionText(st.gustDir)} ({st.gustDir}°)
                </div>
                {st.timeStr && (
                  <div className="text-[10px] text-slate-400">
                    時間：{formatExtremeTime(st.timeStr)}
                  </div>
                )}
              </Tooltip>
            </Marker>
          );
        })}

        {/* 逐時回放模式下的測站資料 */}
        {viewMode === 'replay' && Object.entries(currentData).map(([stationId, raw]) => {
          const station = event.stations[stationId];
          if (!station) return null;
          const reading = getStationReading(raw);

          if (layers.includes('rain') && reading.precip !== null && reading.precip > 0) {
            let rainColor = '#38bdf8';
            if (reading.precip >= 100) {
              rainColor = '#ef4444';
            } else if (reading.precip >= 40) {
              rainColor = '#fb923c';
            }

            return (
              <CircleMarker
                key={`${stationId}-rain`}
                center={[station.lat, station.lon]}
                radius={12}
                stroke={false}
                fillColor="transparent"
                fillOpacity={0}
                eventHandlers={{ click: () => setSelectedStation(stationId) }}
              >
                <Tooltip
                  permanent
                  direction="center"
                  className="rain-tooltip"
                >
                  <span className="rain-value" style={{ color: rainColor }}>
                    {Math.round(reading.precip)}
                  </span>
                </Tooltip>
              </CircleMarker>
            );
          }

          if (!layers.includes('wind')) return null;
          let wind = reading.windAvg;
          let dir = reading.windDir;
          if (!isValidValue(wind)) {
            wind = reading.gust;
            dir = reading.gustDir;
          }
          if (!isValidValue(wind) || !isValidValue(dir)) return null;

          const isBarb = windDisplayMode === 'barb';
          const scale = getBeaufortScale(wind);
          const icon = isBarb
            ? createWindBarbIcon(wind, dir, getWindBarbColor(wind), wind >= 13.9 ? 1 : 0.8)
            : createBeaufortBadgeIcon(scale, dir, wind);

          return (
            <Marker
              key={stationId}
              position={[station.lat, station.lon]}
              icon={icon}
              eventHandlers={{ click: () => setSelectedStation(stationId) }}
            >
              <Tooltip direction="top" offset={[0, isBarb ? -14 : -10]} className="station-tooltip">
                <div className="text-xs font-black text-white">{station.name} ({stationId})</div>
                <div className="text-[11px] font-bold text-cyan-300">
                  風速：{getBeaufortLabel(wind)} ({wind.toFixed(1)} m/s)
                </div>
                <div className="text-[10px] text-slate-300">
                  風向：{windDirectionText(dir)} ({dir}°)
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default memo(TyphoonMap);
