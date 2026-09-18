import React from 'react';

export default function RiskMeter({ score = 0, level = 'Low', showBar = true }) {
  const levelColors = {
    Low: { text: 'text-emerald-600', bg: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Medium: { text: 'text-amber-600', bg: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    High: { text: 'text-orange-600', bg: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
    Critical: { text: 'text-rose-600', bg: 'bg-rose-600', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  };

  const current = levelColors[level] || levelColors.Low;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className={`font-semibold uppercase tracking-wider ${current.text}`}>
          ● {level} Risk
        </span>
        <span className="font-mono font-bold text-slate-900">
          {score}<span className="text-slate-400 font-normal">/100</span>
        </span>
      </div>
      {showBar && (
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${current.bg} transition-all duration-300 ease-out`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      )}
    </div>
  );
}