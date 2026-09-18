import React from 'react';

export default function AuditTimeline({ history = [] }) {
  if (!history || history.length === 0) {
    return <p className="text-xs text-gray-400 italic">No audit records yet.</p>;
  }

  const actionIcons = {
    submitted: { icon: '📥', bg: 'bg-blue-100', text: 'text-blue-800' },
    reviewed:  { icon: '🔍', bg: 'bg-emerald-100', text: 'text-emerald-800' },
    disputed:  { icon: '⚠️', bg: 'bg-amber-100', text: 'text-amber-800' },
  };

  return (
    <div className="relative pl-7 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-1 before:bg-black">
      {history.map((event, idx) => {
        const conf = actionIcons[event.action] || actionIcons.submitted;
        const timeFormatted = new Date(event.timestamp).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div key={idx} className="relative">
            {/* Dot / Badge Icon */}
            <span
              className={`absolute -left-7 top-0.5 flex items-center justify-center w-7 h-7 rounded-full border-2 border-black text-xs ${conf.bg} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
            >
              {conf.icon}
            </span>

            {/* Content */}
            <div className="text-xs space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-black text-black uppercase tracking-wider text-xs">
                  {event.action}
                  {event.status && (
                    <span className="ml-1.5 text-slate-600 font-bold normal-case">
                      as <strong className="text-black font-black uppercase tracking-wide bg-slate-100 px-1.5 py-0.5 rounded border border-black">{event.status}</strong>
                    </span>
                  )}
                </span>
                <time className="text-[10px] text-gray-500 font-mono font-bold bg-white border border-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  {timeFormatted}
                </time>
              </div>

              <div className="text-gray-500 text-[11px] font-bold flex items-center gap-1.5">
                <span>By:</span>
                <span className="font-mono text-black">
                  {event.performedBy || 'Anonymous'}
                </span>
              </div>

              {event.note && (
                <div className="mt-2 p-3 bg-white rounded-xl border-2 border-black text-black font-medium italic shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  "{event.note}"
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}