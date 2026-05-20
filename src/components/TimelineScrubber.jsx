import React from 'react';
import { formatEpoch } from '../dataAdapter.js';

const TimelineScrubber = ({
  epochs,
  currentTimeIndex,
  setCurrentTimeIndex,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  jumpToPeak,
}) => {
  const currentEpoch = epochs[currentTimeIndex];
  const progress = (currentTimeIndex / Math.max(1, epochs.length - 1)) * 100;
  const tickIndexes = [0, 0.25, 0.5, 0.75, 1]
    .map((ratio) => Math.round(ratio * Math.max(0, epochs.length - 1)))
    .filter((value, index, array) => array.indexOf(value) === index);

  const handleWheel = (event) => {
    setCurrentTimeIndex((prev) => event.deltaY > 0 ? Math.min(prev + 1, epochs.length - 1) : Math.max(prev - 1, 0));
  };

  const handleInteraction = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    setCurrentTimeIndex(Math.floor(ratio * (epochs.length - 1)));
  };

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    handleInteraction(event);
  };

  const handlePointerMove = (event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) handleInteraction(event);
  };

  return (
    <div
      className="fixed bottom-0 z-50 flex h-24 w-full select-none items-center justify-center gap-2 border-t border-white/5 bg-[#030712]/90 px-4 backdrop-blur-xl md:h-24 md:gap-8 md:px-12"
      onWheel={handleWheel}
    >
      <div className="absolute -top-8 left-0 w-full px-4 md:px-24">
        <div
          className="relative flex h-14 w-full cursor-pointer touch-none items-center"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
          onPointerCancel={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
          role="slider"
          aria-label="回放時間軸"
          aria-valuemin={0}
          aria-valuemax={Math.max(0, epochs.length - 1)}
          aria-valuenow={currentTimeIndex}
        >
          <div className="absolute h-1.5 w-full rounded-full bg-outline-variant/40" />
          <div className="absolute h-1.5 rounded-full bg-secondary" style={{ width: `${progress}%` }} />
          {tickIndexes.map((index) => (
            <div
              key={index}
              className="absolute top-7 hidden -translate-x-1/2 text-[10px] font-bold text-slate-500 sm:block"
              style={{ left: `${(index / Math.max(1, epochs.length - 1)) * 100}%` }}
            >
              {formatEpoch(epochs[index], { minute: undefined })}
            </div>
          ))}
          <div
            className="absolute -ml-3 h-7 w-6 cursor-grab rounded bg-secondary shadow-[0_0_12px_rgba(68,226,205,0.6)] md:-ml-1.5 md:h-7 md:w-3"
            style={{ left: `${progress}%` }}
          >
            <div className="absolute bottom-full left-1/2 mb-4 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/5 bg-[#030712]/90 px-3 py-1.5 text-[11px] text-cyan-100 shadow-2xl backdrop-blur-xl">
              {formatEpoch(currentEpoch)}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="flex items-center justify-center rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
        onClick={() => setCurrentTimeIndex(0)}
        aria-label="回到開始"
        title="回到開始"
      >
        <span className="material-symbols-outlined">fast_rewind</span>
      </button>
      <button
        type="button"
        className="flex h-14 w-14 items-center justify-center rounded-full text-cyan-300 drop-shadow-[0_0_8px_rgba(68,226,205,0.5)] transition hover:scale-105 hover:bg-white/5 active:scale-95 md:h-16 md:w-16"
        onClick={() => setIsPlaying(!isPlaying)}
        aria-label={isPlaying ? '暫停播放' : '播放回放'}
        title={isPlaying ? '暫停播放' : '播放回放'}
      >
        <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>{isPlaying ? 'pause' : 'play_arrow'}</span>
      </button>
      <button
        type="button"
        className="flex items-center justify-center rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
        onClick={() => setCurrentTimeIndex(epochs.length - 1)}
        aria-label="跳到結束"
        title="跳到結束"
      >
        <span className="material-symbols-outlined">fast_forward</span>
      </button>
      <button
        type="button"
        className="hidden rounded-full bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-300 transition hover:bg-white/10 md:block"
        onClick={jumpToPeak}
        title="跳到中心風力最強時刻"
      >
        最強時刻
      </button>
      <div className="flex rounded-full border border-white/10 bg-white/5 px-1.5 py-1">
        {[1, 2, 4].map((speed) => (
          <button
            type="button"
            key={speed}
            onClick={() => setPlaybackSpeed(speed)}
            className={`h-6 w-8 rounded-full text-[10px] font-bold transition md:w-10 ${playbackSpeed === speed ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            aria-label={`${speed} 倍速`}
          >
            {speed}x
          </button>
        ))}
      </div>
      <div className="hidden text-[11px] font-medium text-slate-500 md:block">
        Space 播放 · ←/→ 單步 · 滾輪調整時間
      </div>
    </div>
  );
};

export default TimelineScrubber;
