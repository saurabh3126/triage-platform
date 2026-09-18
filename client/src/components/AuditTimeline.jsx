import React from 'react';

export default function AuditTimeline({ history = [] }) {
  if (!history || history.length === 0) {
    return <p className="text-xs text-slate-400 italic">No audit records yet.</p>;
  }

  const actionIcons = {
    submitted: { icon: '📥', color: 'bg-blue-100 text-blue-600 border-blue-200' },
    reviewed: { icon: '🔍', color: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
    disputed: { icon: '⚠️', color: 'bg-amber-100 text-amber-600 border-amber-200' },
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {history.map((event, idx) => {
        const conf = actionIcons[event.action] || actionIcons.submitted;
        const timeFormatted = new Date(event.timestamp).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div key={idx} className="relative group">
            {/* Dot/Icon */}
            <span
              className={`absolute -left-6 top-0.5 flex items-center justify-center w-5 h-5 rounded-full border text-[10px] ${conf.color} bg-white shadow-xs`}
            >
              {conf.icon}
            </span>

            {/* Content */}
            <div className="text-xs">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-slate-900 capitalize">
                  {event.action}
                  {event.status && (
                    <span className="ml-1 text-slate-600 font-normal">
                      as <strong className="text-slate-800">{event.status}</strong>
                    </span>
                  )}
                </span>
                <time className="text-[10px] text-slate-400 shrink-0 font-mono">
                  {timeFormatted}
                </time>
              </div>

              <div className="text-slate-500 mt-0.5 text-[11px] flex items-center gap-1.5">
                <span>By:</span>
                <span className="font-medium text-slate-700 font-mono">
                  {event.performedBy || 'Anonymous'}
                </span>
              </div>

              {event.note && (
                <p className="mt-1.5 p-2 bg-slate-50 rounded border border-slate-200 text-slate-700 italic">
                  "{event.note}"
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}