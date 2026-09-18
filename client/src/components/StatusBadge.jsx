import React from 'react';

export default function StatusBadge({ status }) {
  const styles = {
    'Unverified':     'bg-slate-100 text-slate-700 border-black',
    'Verified True':  'bg-emerald-100 text-emerald-700 border-black',
    'Verified False': 'bg-rose-100 text-rose-700 border-black',
    'Misleading':     'bg-amber-100 text-amber-700 border-black',
    'Disputed':       'bg-purple-100 text-purple-700 border-black',
  };

  const icons = {
    'Unverified':     '⏳',
    'Verified True':  '✅',
    'Verified False': '❌',
    'Misleading':     '⚠️',
    'Disputed':       '🗳️',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${styles[status] || styles['Unverified']}`}>
      <span>{icons[status] || '⏳'}</span>
      <span>{status}</span>
    </span>
  );
}