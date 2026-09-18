import React from 'react';

export default function StatusBadge({ status }) {
  const styles = {
    'Unverified': 'bg-slate-100 text-slate-700 border-slate-300',
    'Verified True': 'bg-emerald-50 text-emerald-700 border-emerald-300',
    'Verified False': 'bg-rose-50 text-rose-700 border-rose-300',
    'Misleading': 'bg-amber-50 text-amber-700 border-amber-300',
  };

  const icons = {
    'Unverified': '⏳',
    'Verified True': '✅',
    'Verified False': '❌',
    'Misleading': '⚠️',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles['Unverified']}`}>
      <span>{icons[status] || '⏳'}</span>
      <span>{status}</span>
    </span>
  );
}