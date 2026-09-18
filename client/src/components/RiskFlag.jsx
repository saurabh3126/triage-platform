import React from 'react';

export default function RiskFlag({ type, active }) {
  if (!active) return null;

  const flagConfig = {
    sensational: { label: 'Sensational', icon: '🔥', style: 'bg-orange-100 text-orange-900' },
    shouting:    { label: 'Shouting (CAPS)', icon: '📢', style: 'bg-amber-100 text-amber-900' },
    unsourced:   { label: 'Unsourced', icon: '🔗', style: 'bg-slate-100 text-slate-900' },
  };

  const conf = flagConfig[type];
  if (!conf) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${conf.style}`}>
      <span>{conf.icon}</span>
      <span>{conf.label}</span>
    </span>
  );
}