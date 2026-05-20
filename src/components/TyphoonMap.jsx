import React, { memo } from 'react';
import { Circle, CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip } from 'react-leaflet';
import { createWindBarbIcon } from '../WindBarb.js';
import { getStationReading, isValidValue } from '../dataAdapter.js';

const layerOptions = [
  ['wind', '風標'],
  ['track', '路徑'],
  ['r7', '七級圈'],
  ['r10', '十級圈'],
  ['rain', '雨量'],
];

function LayerControl({ layers, toggleLayer }) {
  return (
    <div className="absolute left-4 top-20 z-[500] flex flex-wrap gap-2 md:left-auto md:right-[23rem]">
      {layerOptions.map(([layer, label]) => (
        <button
          key={layer}
          type="button"
          className={`rounded-full border px-3 py-1.5 text-[11px] font-bold shadow-xl backdrop-blur-md transition ${layers.includes(layer) ? 'border-cyan-300/50 bg-cyan-400 text-slate-950' : 'border-white/10 bg-slate-950/70 text-slate-200 hover:bg-white/10'}`}
          onClick={() => toggleLayer(layer)}
          aria-pressed={layers.includes(layer)}
          title={`切換${label}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const TyphoonMap = ({ event, currentData, currentTyphoonPos, layers, toggleLayer, setSelectedStation }) => {
  if (!event || !event.stations) return null;

  return (
    <div className="absolute inset-0 z-0 bg-slate-900">
      <LayerControl layers={layers} toggleLayer={toggleLayer} />
      <MapContainer
        center={[23.5, 121]}
        zoom={window.innerWidth < 768 ? 6 : 7}
        className="h-full w-full"
        zoomControl={false}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">Carto</a>'
        />

        {layers.includes('track') && (
          <>
            {event.track.slice(0, -1).map((point, index) => {
              const nextPoint = event.track[index + 1];
              // Map intensity using the wind speed at the start of the segment
              const speed = point.wind;
              let color = '#64748b'; // default slate
              if (speed !== null && speed !== undefined && speed >= 0) {
                if (speed < 17.2) color = '#10b981'; // 熱帶性低氣壓 (Emerald)
                else if (speed < 32.7) color = '#06b6d4'; // 輕度颱風 (Cyan)
                else if (speed < 51.0) color = '#fb923c'; // 中度颱風 (Orange)
                else color = '#ef4444'; // 強烈颱風 (Red)
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

        {layers.includes('r7') && currentTyphoonPos.r7 > 0 && (
          <Circle
            center={[currentTyphoonPos.lat, currentTyphoonPos.lon]}
            radius={currentTyphoonPos.r7 * 1000}
            color="#facc15"
            weight={2}
            fillOpacity={0.12}
            dashArray="5, 10"
          />
        )}
        {layers.includes('r10') && currentTyphoonPos.r10 > 0 && (
          <Circle
            center={[currentTyphoonPos.lat, currentTyphoonPos.lon]}
            radius={currentTyphoonPos.r10 * 1000}
            color="#ef4444"
            weight={2}
            fillOpacity={0.22}
            dashArray="5, 10"
          />
        )}

        <CircleMarker
          center={[currentTyphoonPos.lat, currentTyphoonPos.lon]}
          radius={9}
          color="#ff5451"
          fillColor="#ff5451"
          fillOpacity={0.9}
          className="animate-pulse"
        />

        {Object.entries(currentData).map(([stationId, raw]) => {
          const station = event.stations[stationId];
          if (!station) return null;
          const reading = getStationReading(raw);

          if (layers.includes('rain') && reading.precip !== null && reading.precip > 0) {
            let rainColor = '#38bdf8'; // 預設亮藍色
            if (reading.precip >= 100) {
              rainColor = '#ef4444'; // 超過 100 用紅色
            } else if (reading.precip >= 40) {
              rainColor = '#fb923c'; // 超過 40 用橘色
            }

            return (
              <CircleMarker
                key={`${stationId}-rain`}
                center={[station.lat, station.lon]}
                radius={12} // 保持隱形的 12px 點擊熱區，方便使用者點選觀看細節
                stroke={false} // 隱藏外框
                fillColor="transparent" // 填充完全透明
                fillOpacity={0} // 隱藏圓圈
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

          let color = '#94a3b8';
          let opacity = 0.5;
          if (wind >= 24.5) {
            color = '#ef4444';
            opacity = 1;
          } else if (wind >= 13.9) {
            color = '#f59e0b';
            opacity = 1;
          } else if (wind >= 8.0) {
            color = '#06b6d4';
            opacity = 0.9;
          }

          return (
            <Marker
              key={stationId}
              position={[station.lat, station.lon]}
              icon={createWindBarbIcon(wind, dir, color, opacity)}
              eventHandlers={{ click: () => setSelectedStation(stationId) }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
};

export default memo(TyphoonMap);
