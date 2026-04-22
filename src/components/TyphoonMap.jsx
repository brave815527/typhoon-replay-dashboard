import React, { memo } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, Polyline, Circle } from 'react-leaflet';
import { createWindBarbIcon } from '../WindBarb.js';

const TyphoonMap = ({ data, currentData, currentTyphoonPos, track, trackLatLngs, setSelectedStation }) => {
  return (
    <div className="absolute inset-0 z-0 bg-slate-900">
      <MapContainer center={[23.5, 121]} zoom={window.innerWidth < 768 ? 6 : 7} className="w-full h-full" zoomControl={false}>
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
          
          let color = '#94a3b8'; // 5級以下：刷淡灰
          let opacity = 0.5;
          
          if (wind >= 24.5) { // 10級以上：紅色
            color = '#ef4444';
            opacity = 1;
          } else if (wind >= 13.9) { // 7級以上：橘黃色
            color = '#f59e0b';
            opacity = 1;
          } else if (wind >= 8.0) { // 5級以上：湖水藍色
            color = '#06b6d4';
            opacity = 0.9;
          }

          return (
            <Marker
              key={stno}
              position={[st.la, st.lo]}
              icon={createWindBarbIcon(wind, dir, color, opacity)}
              eventHandlers={{ click: () => setSelectedStation(stno) }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
};

export default memo(TyphoonMap);
