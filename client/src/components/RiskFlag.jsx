import React from 'react';

export default function RiskFlag({ type, active }) {
  if (!active) return null;

  const flagConfig = {
    sensational: { label: 'Sensational', icon: '🔥', style: 'bg-orange-50 text-orange-700 border-orange-200' },
    shouting: { label: 'Shouting (CAPS)', icon: '📢', style: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    unsourced: { label: 'Unsourced', icon: '🔗', style: 'bg-slate-100 text-slate-700 border-slate-300' },
  };

  const conf = flagConfig[type];
  if (!conf) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${conf.style}`}>
      <span>{conf.icon}</span>
      <span>{conf.label}</span>
    </span>
  );
}