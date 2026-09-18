import React, { useState, useEffect } from 'react';
import { fetchStats } from '../api/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data } = await fetchStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">
        Aggregating platform intelligence...
      </div>
    );
  }

  const total = stats?.total || 0;

  const getCount = (arr, key) => {
    const item = arr?.find((i) => i._id === key);
    return item ? item.count : 0;
  };

  const criticalCount  = getCount(stats?.byRiskLevel, 'Critical');
  const highCount      = getCount(stats?.byRiskLevel, 'High');
  const mediumCount    = getCount(stats?.byRiskLevel, 'Medium');
  const lowCount       = getCount(stats?.byRiskLevel, 'Low');

  const unverifiedCount  = getCount(stats?.byStatus, 'Unverified');
  const trueCount        = getCount(stats?.byStatus, 'Verified True');
  const falseCount       = getCount(stats?.byStatus, 'Verified False');
  const misleadingCount  = getCount(stats?.byStatus, 'Misleading');

  const verifiedTotal = trueCount + falseCount + misleadingCount;
  const calcPct = (cnt) => (total > 0 ? Math.round((cnt / total) * 100) : 0);

  const RiskBar = ({ label, count, color, barColor, track }) => (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className={`text-xs font-black uppercase tracking-widest ${color}`}>● {label}</span>
        <span className={`font-mono font-black text-sm ${color}`}>
          {count} <span className="text-slate-500 font-normal text-xs">({calcPct(count)}%)</span>
        </span>
      </div>
      <div className={`h-3 w-full ${track} rounded-full overflow-hidden border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
        <div className={`h-full ${barColor} transition-all duration-500 ease-out`} style={{ width: `${calcPct(count)}%` }} />
      </div>
    </div>
  );

  return (
    <div className="px-6 sm:px-12 py-8 w-full mx-auto space-y-8">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b-2 border-black pb-6">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-black uppercase leading-none">
            Platform <span className="text-[#FFD700]">Intelligence</span>
          </h1>
          <p className="text-[10px] text-gray-600 mt-2 uppercase tracking-widest font-bold">
            Real-time metrics across the fact-checking network
          </p>
        </div>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 bg-white border-2 border-black rounded-xl px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          🟢 Live
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Claims */}
        <div className="bg-white p-5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-2">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
            Total Triaged
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-black font-mono">{total}</span>
            <span className="text-xs text-gray-600 font-bold uppercase">records</span>
          </div>
        </div>

        {/* Critical Risk */}
        <div className="bg-rose-50 p-5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-2">
          <span className="text-[10px] font-black text-rose-700 uppercase tracking-[0.2em]">
            Critical Risk
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-rose-700 font-mono">{criticalCount}</span>
            <span className="text-xs text-gray-600 font-bold">({calcPct(criticalCount)}%)</span>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-amber-50 p-5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-2">
          <span className="text-[10px] font-black text-amber-700 uppercase tracking-[0.2em]">
            Pending Review
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-amber-700 font-mono">{unverifiedCount}</span>
            <span className="text-xs text-gray-600 font-bold">({calcPct(unverifiedCount)}%)</span>
          </div>
        </div>

        {/* Verified */}
        <div className="bg-emerald-50 p-5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-2">
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">
            Verdicts Issued
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-emerald-700 font-mono">{verifiedTotal}</span>
            <span className="text-xs text-gray-600 font-bold">({calcPct(verifiedTotal)}%)</span>
          </div>
        </div>
      </div>

      {/* Risk Level Distribution */}
      <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-5">
        <h2 className="text-[10px] font-black text-black uppercase tracking-[0.2em] border-b-2 border-black pb-3">
          Threat Severity Distribution
        </h2>
        <div className="space-y-4">
          <RiskBar label="Critical"  count={criticalCount} color="text-rose-700"   barColor="bg-rose-500"   track="bg-rose-100"   />
          <RiskBar label="High"      count={highCount}     color="text-orange-700" barColor="bg-orange-500" track="bg-orange-100" />
          <RiskBar label="Medium"    count={mediumCount}   color="text-amber-700"  barColor="bg-amber-500"  track="bg-amber-100"  />
          <RiskBar label="Low"       count={lowCount}      color="text-emerald-700" barColor="bg-emerald-500" track="bg-emerald-100" />
        </div>
      </div>

      {/* Dual Breakdown: Category & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* By Category */}
        <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <h2 className="text-[10px] font-black text-black uppercase tracking-[0.2em] border-b-2 border-black pb-3">
            Claims by Category
          </h2>
          <div className="space-y-2">
            {['Health', 'Politics', 'Finance', 'Other'].map((cat) => {
              const cnt = getCount(stats?.byCategory, cat);
              return (
                <div key={cat} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-xs font-black text-black uppercase tracking-wider">{cat}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-black text-sm">{cnt}</span>
                    <span className="text-gray-600 font-mono text-[10px] font-bold">({calcPct(cnt)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Status */}
        <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <h2 className="text-[10px] font-black text-black uppercase tracking-[0.2em] border-b-2 border-black pb-3">
            Verification Verdicts
          </h2>
          <div className="space-y-2">
            {[
              { label: 'Unverified',     bg: 'bg-slate-100',   text: 'text-slate-700'   },
              { label: 'Verified True',  bg: 'bg-emerald-100', text: 'text-emerald-700' },
              { label: 'Verified False', bg: 'bg-rose-100',    text: 'text-rose-700'    },
              { label: 'Misleading',     bg: 'bg-amber-100',   text: 'text-amber-700'   },
            ].map(({ label, bg, text }) => {
              const cnt = getCount(stats?.byStatus, label);
              return (
                <div key={label} className={`flex justify-between items-center p-3 ${bg} rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                  <span className={`text-xs font-black uppercase tracking-wider ${text}`}>{label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-black text-sm ${text}`}>{cnt}</span>
                    <span className="text-gray-600 font-mono text-[10px] font-bold">({calcPct(cnt)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Platform & Recent Audit Stream */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Source Platforms */}
        <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <h2 className="text-[10px] font-black text-black uppercase tracking-[0.2em] border-b-2 border-black pb-3">
            Source Platforms
          </h2>
          <div className="space-y-2">
            {['WhatsApp', 'X', 'Instagram', 'Reddit', 'Other'].map((p) => {
              const cnt = getCount(stats?.byPlatform, p);
              return (
                <div key={p} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-xs font-black text-black uppercase tracking-wider">{p}</span>
                  <span className="font-mono font-black text-black text-sm">{cnt}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Audit Stream */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <h2 className="text-[10px] font-black text-black uppercase tracking-[0.2em] border-b-2 border-black pb-3">
            Recent Audit Stream
          </h2>
          <div className="space-y-2">
            {stats?.recent?.length > 0 ? (
              stats.recent.map((ev, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-black font-bold truncate">
                      "{ev.text}..."
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider font-bold">
                      <span className="text-black">{ev.action}</span>
                      {ev.status && ` → ${ev.status}`} · <span className="font-mono">{ev.performedBy}</span>
                    </p>
                  </div>
                  <time className="text-[10px] text-gray-600 shrink-0 font-mono font-bold bg-white border-2 border-black rounded-lg px-2 py-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </time>
                </div>
              ))
            ) : (
              <p className="text-gray-600 italic text-sm py-4 text-center">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}