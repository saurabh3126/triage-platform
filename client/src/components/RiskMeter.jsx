import React from 'react';

export default function RiskMeter({ score = 0, level = 'Low', showBar = true }) {
  const levelColors = {
    Low:      { text: 'text-emerald-700', bg: 'bg-emerald-500', track: 'bg-emerald-100' },
    Medium:   { text: 'text-amber-700',   bg: 'bg-amber-500',   track: 'bg-amber-100'   },
    High:     { text: 'text-orange-700',  bg: 'bg-orange-500',  track: 'bg-orange-100'  },
    Critical: { text: 'text-rose-700',    bg: 'bg-rose-600',    track: 'bg-rose-100'    },
  };

  const current = levelColors[level] || levelColors.Low;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className={`font-black uppercase tracking-widest ${current.text}`}>
          ● {level} Risk
        </span>
        <span className="font-mono font-black text-white text-sm">
          {score}<span className="text-slate-500 font-normal text-xs">/100</span>
        </span>
      </div>
      {showBar && (
        <div className={`h-2.5 w-full ${current.track} rounded-full overflow-hidden border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
          <div
            className={`h-full ${current.bg} transition-all duration-300 ease-out`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      )}
    </div>
  );
}