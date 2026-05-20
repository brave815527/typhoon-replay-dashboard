import React, { useMemo } from 'react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Bar, Line } from 'react-chartjs-2';
import { formatEpoch, getBeaufortLabel, getStationReading, isValidValue } from './dataAdapter.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, annotationPlugin);

const directionNames = ['北', '北北東', '東北', '東北東', '東', '東南東', '東南', '南南東', '南', '南南西', '西南', '西南西', '西', '西北西', '西北', '北北西'];

function formatExtremeTime(value) {
  if (!value || String(value).startsWith('-99')) return '無資料';
  const text = String(value);
  if (text.length === 8) return `${text.slice(4, 6)}/${text.slice(6, 8)}`;
  const padded = text.padStart(6, '0');
  return `${Number(padded.slice(0, 2))}日 ${padded.slice(2, 4)}:${padded.slice(4, 6)}`;
}

function windDirectionText(deg) {
  if (!isValidValue(deg) || deg < 0 || deg > 360) return '無資料';
  const index = Math.floor(((deg + 11.25) % 360) / 22.5);
  return `${directionNames[index]}風`;
}

function SummaryCard({ label, value, unit, sub, tone = 'cyan' }) {
  const tones = {
    cyan: 'bg-cyan-500/15 text-cyan-100 ring-cyan-400/30 hover:shadow-cyan-500/10',
    red: 'bg-red-500/15 text-red-100 ring-red-400/30 hover:shadow-red-500/10',
    blue: 'bg-blue-500/15 text-blue-100 ring-blue-400/30 hover:shadow-blue-500/10',
    orange: 'bg-orange-500/15 text-orange-100 ring-orange-400/30 hover:shadow-orange-500/10',
  };
  return (
    <div className={`rounded-2xl p-4 ring-1 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${tones[tone]}`}>
      <div className="mb-2 text-[11px] font-black tracking-wider opacity-70">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-black italic">{value ?? '-'}</span>
        <span className="font-display text-xs font-bold opacity-80">{unit}</span>
      </div>
      <div className="mt-3 border-t border-white/10 pt-2 text-[11px] font-bold opacity-65">{sub}</div>
    </div>
  );
}

const StationModal = ({ stationId, event, currentEpoch, onClose }) => {
  const station = event?.stations?.[stationId] || null;
  const chartData = useMemo(() => {
    if (!event || !stationId) return null;
    const labels = [];
    const series = { windAvg: [], gust: [], windDir: [], temp: [], humidity: [], pressure: [], precip: [] };
    const rows = [];

    event.epochs.forEach((epoch) => {
      const reading = getStationReading(event.hourlyByEpoch[epoch]?.[stationId]);
      if (!event.hourlyByEpoch[epoch]?.[stationId]) return;
      labels.push(formatEpoch(epoch));
      Object.keys(series).forEach((key) => series[key].push(reading[key]));
      rows.push({ epoch, ...reading });
    });

    return { labels, series, rows };
  }, [event, stationId]);


  const commonOptions = useMemo(() => {
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: 'rgba(255,255,255,0.65)' } },
        tooltip: { backgroundColor: 'rgba(0,0,0,0.9)', padding: 12, cornerRadius: 8 },
      },
      scales: {
        x: {
          grid: {
            color: function (context) {
              const chart = context.chart;
              const index = context.index;
              if (chart && chart.data && chart.data.labels) {
                const label = chart.data.labels[index];
                if (label) {
                  const parts = label.split(/\s+/);
                  if (parts.length === 2) {
                    const time = parts[1];
                    if (['00:00', '06:00', '12:00', '18:00'].includes(time)) {
                      return 'rgba(255, 255, 255, 0.05)';
                    }
                  }
                }
              }
              return 'transparent';
            },
            tickColor: function (context) {
              const chart = context.chart;
              const index = context.index;
              if (chart && chart.data && chart.data.labels) {
                const label = chart.data.labels[index];
                if (label) {
                  const parts = label.split(/\s+/);
                  if (parts.length === 2) {
                    const time = parts[1];
                    if (['00:00', '06:00', '12:00', '18:00'].includes(time)) {
                      return 'rgba(255, 255, 255, 0.2)';
                    }
                  }
                }
              }
              return 'transparent';
            },
          },
          ticks: {
            color: 'rgba(255,255,255,0.55)',
            maxRotation: 0,
            autoSkip: false,
            callback: function (value) {
              const label = this.getLabelForValue(value);
              if (!label) return '';
              const parts = label.split(/\s+/);
              if (parts.length === 2) {
                const [date, time] = parts;
                if (time === '00:00') {
                  return ['00', date];
                }
                if (['06:00', '12:00', '18:00'].includes(time)) {
                  return time.slice(0, 2);
                }
              }
              return '';
            },
          },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.08)' },
          ticks: { color: 'rgba(255,255,255,0.55)' },
        },
      },
    };

    return options;
  }, []);

  const tempHumidityOptions = useMemo(() => {
    return {
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        y: {
          grid: { color: 'rgba(255,255,255,0.08)' },
          ticks: { color: '#fb923c' },
          title: {
            display: true,
            text: '溫度 (°C)',
            color: '#fb923c',
            font: { size: 10, weight: 'bold' }
          }
        },
        y1: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: '#34d399' },
          min: 0,
          max: 100,
          title: {
            display: true,
            text: '濕度 (%)',
            color: '#34d399',
            font: { size: 10, weight: 'bold' }
          }
        }
      }
    };
  }, [commonOptions]);

  const windDirectionOptions = useMemo(() => {
    return {
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        y: {
          min: 0,
          max: 360,
          grid: { color: 'rgba(255,255,255,0.08)' },
          ticks: {
            color: '#38bdf8',
            stepSize: 45,
            callback: function(value) {
              if ([0, 45, 90, 135, 180, 225, 270, 315, 360].includes(value)) {
                return `${value}°`;
              }
              return '';
            }
          },
          title: {
            display: true,
            text: '風向',
            color: '#38bdf8',
            font: { size: 10, weight: 'bold' }
          }
        }
      },
      plugins: {
        ...commonOptions.plugins,
        tooltip: {
          ...commonOptions.plugins.tooltip,
          callbacks: {
            label: function(context) {
              const val = context.raw;
              if (val === null || val === undefined) return '無資料';
              return `風向: ${windDirectionText(val)} (${val}°)`;
            }
          }
        }
      }
    };
  }, [commonOptions]);

  if (!station || !chartData) return null;

  const extremes = station.extremes || {};
  const totalRain = chartData.series.precip.reduce((sum, value) => sum + (value || 0), 0).toFixed(1);

  // 1. 決定標記點的 Y 軸數值 (優先使用一日瞬間風速極值 extremes.wd7v，否則使用逐時陣風最大值)
  const maxGustVal = useMemo(() => {
    if (isValidValue(extremes.wd7v)) return Number(extremes.wd7v);

    // 降級方案一：逐時瞬間風的最大值
    let maxVal = -1;
    chartData.series.gust.forEach((val) => {
      if (val !== null && val !== undefined && val > maxVal) {
        maxVal = val;
      }
    });
    if (maxVal !== -1) return maxVal;

    // 降級方案二：逐時平均風的最大值
    let maxAvgVal = -1;
    chartData.series.windAvg.forEach((val) => {
      if (val !== null && val !== undefined && val > maxAvgVal) {
        maxAvgVal = val;
      }
    });
    return maxAvgVal !== -1 ? maxAvgVal : null;
  }, [extremes.wd7v, chartData]);

  // 2. 決定標記點的 X 軸索引 (藉由時間接近算法尋找與 extremes.wd7t 最貼近的 X 軸整點)
  const maxGustIdx = useMemo(() => {
    if (maxGustVal === null) return -1;

    if (extremes.wd7t) {
      const text = String(extremes.wd7t).padStart(6, '0'); // "DDHHMM"
      const targetDay = Number(text.slice(0, 2));
      const targetHour = Number(text.slice(2, 4));
      const targetMin = Number(text.slice(4, 6));

      let minDiff = Infinity;
      let bestIdx = -1;

      chartData.rows.forEach((row, idx) => {
        const date = new Date(Number(row.epoch) * 1000);
        const day = date.getDate();
        const hour = date.getHours();
        const min = date.getMinutes();

        const diff = Math.abs((day - targetDay) * 24 * 60 + (hour - targetHour) * 60 + (min - targetMin));
        if (diff < minDiff) {
          minDiff = diff;
          bestIdx = idx;
        }
      });

      if (bestIdx !== -1) return bestIdx;
    }

    // 降級尋找：數值在逐時數據中匹配的 index
    const gustIdx = chartData.series.gust.indexOf(maxGustVal);
    if (gustIdx !== -1) return gustIdx;
    const avgIdx = chartData.series.windAvg.indexOf(maxGustVal);
    if (avgIdx !== -1) return avgIdx;

    return chartData.labels.length ? Math.floor(chartData.labels.length / 2) : -1;
  }, [maxGustVal, extremes.wd7t, chartData]);

  // 3. 動態決定 Y 軸最大上限 (比紅點風速多 15% 的空間以放置標籤，避免被頂部遮擋)
  const yAxisMax = useMemo(() => {
    if (maxGustVal !== null) {
      return Math.ceil(maxGustVal * 1.15);
    }
    return undefined;
  }, [maxGustVal]);

  // 4. 圖表專屬 options 設定
  const windChartOptions = useMemo(() => {
    const options = {
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        y: {
          ...commonOptions.scales.y,
          max: yAxisMax,
        }
      }
    };

    if (maxGustIdx !== -1 && maxGustVal !== null) {
      const labelContent = extremes.wd7t ? [
        `最大瞬間風速: ${maxGustVal} m/s`,
        `時間: ${formatExtremeTime(extremes.wd7t)}`
      ] : [
        `最大瞬間風速: ${maxGustVal} m/s`,
        `時間: ${chartData.labels[maxGustIdx]}`
      ];

      options.plugins = {
        ...commonOptions.plugins,
        annotation: {
          annotations: {
            maxGustPoint: {
              type: 'point',
              xValue: chartData.labels[maxGustIdx],
              yValue: maxGustVal,
              backgroundColor: '#ef4444',
              borderColor: '#ffffff',
              borderWidth: 2,
              radius: 7,
            },
            maxGustLabel: {
              type: 'label',
              xValue: chartData.labels[maxGustIdx],
              yValue: maxGustVal,
              backgroundColor: 'rgba(239, 68, 68, 0.95)',
              content: labelContent,
              font: { size: 9, weight: 'bold', family: 'Inter' },
              color: '#ffffff',
              borderRadius: 6,
              padding: 6,
              yAdjust: -32,
              position: 'center'
            }
          }
        }
      };
    }
    return options;
  }, [commonOptions, maxGustIdx, maxGustVal, yAxisMax, chartData, extremes]);

  const copyLink = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('station', stationId);
    await navigator.clipboard.writeText(url.toString());
  };

  const exportCsv = () => {
    const header = 'epoch,time,windAvg,windDir,gust,gustDir,temp,humidity,pressure,precip\n';
    const body = chartData.rows.map((row) => [
      row.epoch,
      formatEpoch(row.epoch),
      row.windAvg ?? '',
      row.windDir ?? '',
      row.gust ?? '',
      row.gustDir ?? '',
      row.temp ?? '',
      row.humidity ?? '',
      row.pressure ?? '',
      row.precip ?? '',
    ].join(',')).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.metadata.year}-${event.metadata.name}-${stationId}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} aria-label="關閉測站視窗" type="button" />
      <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A]/90 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] p-5 md:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/20 text-2xl font-black italic text-cyan-300">ST</div>
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-black text-white">{station.name}</h2>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/50">{station.type === 'manual' ? '署屬站' : '自動站'} · <span className="font-display font-black">{stationId}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={copyLink} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15" title="複製此測站連結">複製連結</button>
            <button type="button" onClick={exportCsv} className="rounded-xl bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300" title="匯出此測站逐時 CSV">匯出 CSV</button>
            <button type="button" onClick={onClose} className="rounded-2xl p-3 text-white/50 transition hover:bg-white/10 hover:text-white" aria-label="關閉">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:px-10 md:py-8">
          <div className="mb-10 grid gap-4 md:grid-cols-4">
            <SummaryCard label="最大瞬間風速" value={extremes.wd7v} unit="m/s" sub={`${windDirectionText(extremes.wd7d)} (${formatExtremeTime(extremes.wd7t)}) · ${getBeaufortLabel(extremes.wd7v)}`} tone="red" />
            <SummaryCard label="最低氣壓" value={extremes.ps5v} unit="hPa" sub={formatExtremeTime(extremes.ps5t)} tone="blue" />
            <SummaryCard label="最大日雨量" value={extremes.pp1v} unit="mm" sub={formatExtremeTime(extremes.pp1t)} tone="cyan" />
            <SummaryCard label="觀測總雨量" value={totalRain} unit="mm" sub="此事件逐時累計" tone="orange" />
          </div>

          <div className="space-y-12">
            <section>
              <h3 className="mb-4 text-sm font-black uppercase tracking-[0.25em] text-red-300">風速與陣風 (m/s)</h3>
              <div className="h-72 rounded-[2rem] border border-white/5 bg-white/[0.02] p-5 shadow-2xl">
                <Line data={{
                  labels: chartData.labels,
                  datasets: [
                    {
                      label: '平均風',
                      data: chartData.series.windAvg,
                      borderColor: '#06b6d4',
                      backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return 'rgba(6, 182, 212, 0.08)';
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
                        gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
                        return gradient;
                      },
                      fill: true,
                      tension: 0.35,
                      pointRadius: 0,
                    },
                    {
                      label: '瞬間風',
                      data: chartData.series.gust,
                      showLine: false,
                      pointRadius: 3.5,
                      pointBackgroundColor: '#fb923c',
                      pointBorderColor: '#fb923c',
                      pointHoverRadius: 6,
                      pointHoverBackgroundColor: '#ffffff',
                      pointHoverBorderColor: '#fb923c',
                      pointHoverBorderWidth: 2,
                    },
                  ],
                }} options={windChartOptions} />
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-sm font-black uppercase tracking-[0.25em] text-cyan-300">風向 (方位與度數)</h3>
              <div className="h-72 rounded-[2rem] border border-white/5 bg-white/[0.02] p-5 shadow-2xl">
                <Line data={{
                  labels: chartData.labels,
                  datasets: [{
                    label: '風向',
                    data: chartData.series.windDir,
                    borderColor: '#38bdf8',
                    backgroundColor: (context) => {
                      const chart = context.chart;
                      const { ctx, chartArea } = chart;
                      if (!chartArea) return 'rgba(56, 189, 248, 0.05)';
                      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
                      gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
                      return gradient;
                    },
                    fill: true,
                    tension: 0.1,
                    pointRadius: 2,
                    pointBackgroundColor: '#38bdf8',
                    pointBorderColor: '#38bdf8',
                  }]
                }} options={windDirectionOptions} />
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-sm font-black uppercase tracking-[0.25em] text-sky-300">雨量 (mm)</h3>
              <div className="h-72 rounded-[2rem] border border-white/5 bg-white/[0.02] p-5 shadow-2xl">
                <Bar data={{
                  labels: chartData.labels,
                  datasets: [{
                    label: '逐時雨量',
                    data: chartData.series.precip,
                    backgroundColor: (context) => {
                      const chart = context.chart;
                      const { ctx, chartArea } = chart;
                      if (!chartArea) return '#38bdf8';
                      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                      gradient.addColorStop(0, '#38bdf8');
                      gradient.addColorStop(1, '#0284c7');
                      return gradient;
                    },
                    borderRadius: 4,
                  }],
                }} options={commonOptions} />
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-sm font-black uppercase tracking-[0.25em] text-blue-300">氣壓 (hPa)</h3>
              <div className="h-72 rounded-[2rem] border border-white/5 bg-white/[0.02] p-5 shadow-2xl">
                <Line data={{
                  labels: chartData.labels,
                  datasets: [{
                    label: '氣壓',
                    data: chartData.series.pressure,
                    borderColor: '#60a5fa',
                    backgroundColor: (context) => {
                      const chart = context.chart;
                      const { ctx, chartArea } = chart;
                      if (!chartArea) return 'rgba(96, 165, 250, 0.05)';
                      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                      gradient.addColorStop(0, 'rgba(96, 165, 250, 0.15)');
                      gradient.addColorStop(1, 'rgba(96, 165, 250, 0.0)');
                      return gradient;
                    },
                    fill: true,
                    tension: 0.35,
                    pointRadius: 0,
                  }]
                }} options={commonOptions} />
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-sm font-black uppercase tracking-[0.25em] text-orange-300">溫度與濕度</h3>
              <div className="h-72 rounded-[2rem] border border-white/5 bg-white/[0.02] p-5 shadow-2xl">
                <Line data={{
                  labels: chartData.labels,
                  datasets: [
                    {
                      label: '溫度 °C',
                      data: chartData.series.temp,
                      borderColor: '#fb923c',
                      backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return 'rgba(251, 146, 60, 0.03)';
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, 'rgba(251, 146, 60, 0.1)');
                        gradient.addColorStop(1, 'rgba(251, 146, 60, 0.0)');
                        return gradient;
                      },
                      fill: true,
                      tension: 0.35,
                      pointRadius: 0,
                      pointHoverRadius: 5,
                      pointHoverBackgroundColor: '#ffffff',
                      pointHoverBorderColor: '#fb923c',
                      pointHoverBorderWidth: 2,
                      yAxisID: 'y',
                    },
                    {
                      label: '濕度 %',
                      data: chartData.series.humidity,
                      borderColor: '#34d399',
                      backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return 'rgba(52, 211, 153, 0.03)';
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, 'rgba(52, 211, 153, 0.08)');
                        gradient.addColorStop(1, 'rgba(52, 211, 153, 0.0)');
                        return gradient;
                      },
                      fill: true,
                      tension: 0.35,
                      pointRadius: 0,
                      pointHoverRadius: 5,
                      pointHoverBackgroundColor: '#ffffff',
                      pointHoverBorderColor: '#34d399',
                      pointHoverBorderWidth: 2,
                      yAxisID: 'y1',
                    },
                  ],
                }} options={tempHumidityOptions} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(StationModal);
