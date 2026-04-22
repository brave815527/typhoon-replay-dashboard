import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Line, Bar } from 'react-chartjs-2';
import { isValidValue } from './utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

const StationModal = ({ stationId, data, onClose }) => {
  if (!data || !stationId || !data.stations[stationId]) return null;

  const station = data.stations[stationId];
  const stName = station.n;
  const extremes = station.extremes || {};

  const getWindDirCH = (deg) => {
    if (!isValidValue(deg) || deg < 0 || deg > 360) return "";
    const dirs = ["北", "北北東", "東北", "東北東", "東", "東南東", "東南", "南南東", "南", "南南西", "西南", "西南西", "西", "西北西", "西北", "北北西"];
    const idx = Math.floor(((deg + 11.25) % 360) / 22.5);
    return dirs[idx] + "風";
  };

  const formatExTime = (t) => {
    if (!t || String(t).startsWith("-99")) return "";
    const s = String(t);
    if (s.length === 8) return `${s.slice(4,6)}/${s.slice(6,8)}`;
    const ps = s.padStart(6, '0');
    return `${parseInt(ps.slice(0, 2))}日 ${ps.slice(2, 4)}:${ps.slice(4, 6)}`;
  };

  const chartData = useMemo(() => {
    const epochs = Object.keys(data.hourlyData).sort((a, b) => Number(a) - Number(b));
    const labels = [];
    const parsedData = { windSpeed: [], windGust: [], windDir: [], temp: [], pressure: [], precip: [], humidity: [] };
    const dateMapping = []; // Used for faster lookup in annotations

    epochs.forEach(ep => {
      const vals = data.hourlyData[ep][stationId];
      if (vals) {
        const date = new Date(Number(ep) * 1000);
        const day = date.getDate();
        const hour = date.getHours();
        
        labels.push(`${String(date.getMonth() + 1).padStart(2,'0')}/${String(day).padStart(2,'0')} ${String(hour).padStart(2,'0')}:00`);
        dateMapping.push({ day, hour });

        parsedData.windSpeed.push(isValidValue(vals[0]) ? vals[0] : null);
        parsedData.windDir.push(isValidValue(vals[1]) ? vals[1] : null);
        parsedData.windGust.push(isValidValue(vals[2]) ? vals[2] : null);
        parsedData.temp.push(isValidValue(vals[4]) ? vals[4] : null);
        parsedData.humidity.push(isValidValue(vals[5]) ? vals[5] : null);
        parsedData.pressure.push(isValidValue(vals[6]) ? vals[6] : null);
        parsedData.precip.push(isValidValue(vals[7]) ? vals[7] : null);
      }
    });

    const findLabelIdx = (exTime) => {
      if (!exTime || String(exTime).startsWith("-99")) return -1;
      const ps = String(exTime).padStart(6, '0');
      const targetDay = parseInt(ps.slice(0, 2));
      const targetHour = parseInt(ps.slice(2, 4));
      return dateMapping.findIndex(m => m.day === targetDay && m.hour === targetHour);
    };

    return { labels, ...parsedData, findLabelIdx };
  }, [data, stationId]);

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: { 
        backgroundColor: 'rgba(0,0,0,0.9)', 
        padding: 12, 
        cornerRadius: 8,
        titleFont: { size: 14 }
      },
    },
    scales: {
      x: { 
        grid: { color: 'rgba(255,255,255,0.03)' }, 
        ticks: { 
          color: 'rgba(255,255,255,0.6)', 
          font: { size: 12, weight: 'bold' },
          callback: function(val, index) {
            const label = this.getLabelForValue(val);
            if (!label) return '';
            const parts = label.split(' ');
            if (parts.length < 2) return '';
            const t = parts[1].split(':')[0];
            if (["00", "06", "12", "18"].includes(t)) {
              return t === "00" ? [t, parts[0]] : t;
            }
            return '';
          },
          autoSkip: false,
          maxRotation: 0
        } 
      },
      y: { 
        grid: { color: 'rgba(255,255,255,0.08)' }, 
        ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 12 } } 
      }
    }
  };

  const createAnnPoint = (idx, value, color) => {
    if (idx < 0) return null;
    return {
      type: 'point',
      xValue: idx,
      yValue: value,
      backgroundColor: color,
      borderColor: '#fff',
      borderWidth: 2,
      radius: 6,
      hoverRadius: 8
    };
  };

  const chartSections = [
    {
      title: "風速與陣風 (m/s)",
      color: "text-red-400",
      content: <Line data={{
        labels: chartData.labels,
        datasets: [
          { label: '平均', data: chartData.windSpeed, borderColor: 'rgba(0,229,255,0.6)', backgroundColor: 'rgba(0,229,255,0.05)', fill: true, tension: 0.4, pointRadius: 0 },
          { label: '瞬間', data: chartData.windGust, borderColor: '#EF4444', borderDash: [5, 5], tension: 0.4, pointRadius: 0 }
        ]
      }} options={{
        ...commonOptions,
        plugins: {
          ...commonOptions.plugins,
          annotation: {
            annotations: {
              gust: createAnnPoint(chartData.findLabelIdx(extremes.wd7t), extremes.wd7v, '#EF4444')
            }
          }
        }
      }} />,
      extremes: [
        { label: "最大瞬間風速", value: extremes.wd7v, unit: "m/s", sub: `${getWindDirCH(extremes.wd7d)} (${formatExTime(extremes.wd7t)})`, color: "bg-error/30 text-error ring-1 ring-error/50" }
      ]
    },
    {
      title: "風向 (°)",
      color: "text-purple-400",
      content: <Line data={{
        labels: chartData.labels,
        datasets: [{ data: chartData.windDir, borderColor: '#A855F7', showLine: false, pointRadius: 3, pointBackgroundColor: '#A855F7' }]
      }} options={{...commonOptions, scales: { ...commonOptions.scales, y: { min: 0, max: 360, ticks: { stepSize: 90, font: { size: 12 } } } }}} />
    },
    {
      title: "氣壓 (hPa)",
      color: "text-blue-400",
      content: <Line data={{
        labels: chartData.labels,
        datasets: [{ data: chartData.pressure, borderColor: '#3B82F6', tension: 0.4, pointRadius: 0 }]
      }} options={{
        ...commonOptions,
        plugins: {
          ...commonOptions.plugins,
          annotation: {
            annotations: {
              maxP: createAnnPoint(chartData.findLabelIdx(extremes.ps3t), extremes.ps3v, '#818CF8'),
              minP: createAnnPoint(chartData.findLabelIdx(extremes.ps5t), extremes.ps5v, '#3B82F6')
            }
          }
        }
      }} />,
      extremes: [
        { label: "最高氣壓", value: extremes.ps3v, unit: "hPa", sub: formatExTime(extremes.ps3t), color: "bg-indigo-500/30 text-indigo-200 ring-1 ring-indigo-500/50" },
        { label: "最低氣壓", value: extremes.ps5v, unit: "hPa", sub: formatExTime(extremes.ps5t), color: "bg-blue-600/30 text-blue-100 ring-1 ring-blue-500/50" }
      ]
    },
    {
      title: "雨量 (mm)",
      color: "text-sky-400",
      content: <Bar data={{
        labels: chartData.labels,
        datasets: [{ data: chartData.precip, backgroundColor: '#38BDF8', borderRadius: 2 }]
      }} options={commonOptions} />,
      extremes: [
        ...(extremes.pp1v !== undefined && extremes.pp1v !== null ? [
          { label: "最大日累計雨量", value: extremes.pp1v, unit: "mm", sub: formatExTime(extremes.pp1t), color: "bg-sky-500/30 text-sky-200 ring-1 ring-sky-400/50" }
        ] : []),
        { 
          label: "觀測期間總雨量", 
          value: chartData.precip.reduce((sum, v) => sum + (v || 0), 0).toFixed(1), 
          unit: "mm", 
          sub: "Total Cumulative", 
          color: "bg-blue-600/30 text-blue-100 ring-1 ring-blue-500/50" 
        }
      ]
    },
    {
      title: "溫度 (°C)",
      color: "text-orange-400",
      content: <Line data={{
        labels: chartData.labels,
        datasets: [{ data: chartData.temp, borderColor: '#F97316', backgroundColor: 'rgba(249,115,22,0.1)', fill: true, tension: 0.4, pointRadius: 0 }]
      }} options={{
        ...commonOptions,
        plugins: {
          ...commonOptions.plugins,
          annotation: {
            annotations: {
              maxT: createAnnPoint(chartData.findLabelIdx(extremes.tx2t), extremes.tx2v, '#F97316'),
              minT: createAnnPoint(chartData.findLabelIdx(extremes.tx4t), extremes.tx4v, '#3B82F6')
            }
          }
        }
      }} />,
      extremes: [
        { label: "最高溫度", value: extremes.tx2v, unit: "°C", sub: formatExTime(extremes.tx2t), color: "bg-orange-500/30 text-orange-200 ring-1 ring-orange-400/50" },
        { label: "最低溫度", value: extremes.tx4v, unit: "°C", sub: formatExTime(extremes.tx4t), color: "bg-blue-500/30 text-blue-100 ring-1 ring-blue-400/50" }
      ]
    },
    {
      title: "濕度 (%)",
      color: "text-emerald-400",
      content: <Line data={{
        labels: chartData.labels,
        datasets: [{ data: chartData.humidity, borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4, pointRadius: 0 }]
      }} options={{...commonOptions, scales: { ...commonOptions.scales, y: { min: 0, max: 100, ticks: { font: { size: 12 } } } }}} />
    }
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[94vh] bg-[#0A0A0A] border border-white/10 rounded-3xl shadow-4xl flex flex-col overflow-hidden">
        
        <div className="p-5 md:p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
              <span className="text-cyan-400 text-2xl font-black italic">ST</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter">{stName}</h2>
              <p className="text-[11px] text-white/50 uppercase tracking-[0.3em] font-black">Station Analytical Metrics</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/10 text-white/40 hover:text-white">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:px-10 md:py-8 custom-scrollbar touch-pan-y overscroll-contain">
          <div className="flex flex-col gap-14">
            {chartSections.map((section, idx) => {
              const hasExtremes = section.extremes && section.extremes.length > 0;
              return (
                <div key={idx} className="group relative">
                  <div className="flex items-center gap-6 mb-8">
                    <h3 className={`text-sm md:text-base font-black uppercase tracking-[0.25em] ${section.color}`}>{section.title}</h3>
                    <div className="flex-1 h-[2px] bg-gradient-to-r from-white/10 to-transparent"></div>
                  </div>

                  {hasExtremes && (
                    <div className="flex flex-wrap gap-4 mb-8">
                      {section.extremes.map((ex, i) => (
                        <div key={i} className={`px-5 py-4 rounded-2xl border border-white/5 ${ex.color} flex flex-col shadow-xl transition-all hover:translate-y-[-2px]`}>
                          <div className="text-[11px] opacity-70 font-black mb-2 uppercase tracking-tighter">{ex.label}</div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black italic tracking-tighter leading-none">{ex.value}</span>
                            <span className="text-[13px] opacity-90 font-black">{ex.unit}</span>
                          </div>
                          {ex.sub && <div className="text-[11px] opacity-60 mt-3 font-bold font-mono border-t border-white/10 pt-2">{ex.sub}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="h-64 md:h-80 w-full relative bg-white/[0.01] rounded-[2rem] p-6 border border-white/5 shadow-2xl">
                    {section.content}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="h-10"></div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(StationModal);
