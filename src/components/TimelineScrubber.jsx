import React from 'react';

const TimelineScrubber = ({ 
  epochs, 
  currentTimeIndex, 
  setCurrentTimeIndex, 
  isPlaying, 
  setIsPlaying, 
  playbackSpeed, 
  setPlaybackSpeed 
}) => {
  const currentEpoch = epochs[currentTimeIndex];

  // Handle wheel events
  const handleWheel = (e) => {
    // DeltaY > 0 is scrolling down (forward time)
    if (e.deltaY > 0) {
      setCurrentTimeIndex(prev => Math.min(prev + 1, epochs.length - 1));
    } else if (e.deltaY < 0) {
      setCurrentTimeIndex(prev => Math.max(prev - 1, 0));
    }
  };

  // Handle drag/touch interaction
  const handleInteraction = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Use clientX directly from PointerEvent
    const clientX = e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newIndex = Math.floor(ratio * (epochs.length - 1));
    if (newIndex >= 0 && newIndex < epochs.length) {
      setCurrentTimeIndex(newIndex);
    }
  };

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    handleInteraction(e);
  };

  const handlePointerMove = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      handleInteraction(e);
    }
  };

  const handlePointerUp = (e) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div 
      className="fixed bottom-0 w-full z-50 flex justify-center items-center gap-2 md:gap-12 px-4 md:px-12 h-20 bg-slate-950/90 backdrop-blur-md border-t border-cyan-500/20 select-none"
      onWheel={handleWheel}
    >
      <div className="absolute -top-6 left-0 w-full px-4 md:px-24">
        <div 
          className="relative w-full h-12 flex items-center cursor-pointer touch-none" 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="absolute w-full h-1.5 bg-outline-variant/40 rounded-full"></div>
          <div className="absolute h-1.5 bg-secondary rounded-full" style={{ width: `${(currentTimeIndex / Math.max(1, epochs.length - 1)) * 100}%` }}></div>
          
          <div 
            className="absolute w-6 h-6 md:w-3 md:h-6 bg-secondary rounded md:rounded-sm -ml-3 md:-ml-1.5 shadow-[0_0_12px_rgba(68,226,205,0.6)] cursor-grab" 
            style={{ left: `${(currentTimeIndex / Math.max(1, epochs.length - 1)) * 100}%` }}
          >
             <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-slate-900/90 text-cyan-200 text-[11px] px-3 py-1.5 rounded-lg border border-cyan-500/30 whitespace-nowrap shadow-xl">
                {new Date(Number(currentEpoch) * 1000).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
             </div>
          </div>
        </div>
      </div>

      <button className="flex flex-col items-center justify-center text-slate-400 p-2" onClick={() => setCurrentTimeIndex(0)}>
        <span className="material-symbols-outlined">fast_rewind</span>
      </button>
      <button
        className="flex flex-col items-center justify-center text-cyan-400 drop-shadow-[0_0_8px_rgba(68,226,205,0.5)] hover:scale-110 active:scale-95 transition-all w-14 h-14 md:w-16 md:h-16"
        onClick={() => setIsPlaying(!isPlaying)}
      >
        <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>{isPlaying ? 'pause' : 'play_arrow'}</span>
      </button>
      <button className="flex flex-col items-center justify-center text-slate-400 p-2" onClick={() => setCurrentTimeIndex(epochs.length - 1)}>
        <span className="material-symbols-outlined">fast_forward</span>
      </button>

      <div className="flex bg-white/5 border border-white/10 rounded-full px-1.5 py-1 gap-1 ml-2 md:ml-4">
         {[1, 2, 4].map(s => (
           <button 
             key={s}
             onClick={() => setPlaybackSpeed(s)}
             className={`text-[9px] md:text-[10px] font-bold w-7 h-6 md:w-10 md:h-6 rounded-full transition-colors ${playbackSpeed === s ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
           >
             {s}x
           </button>
         ))}
       </div>
    </div>
  );
};

export default TimelineScrubber;
