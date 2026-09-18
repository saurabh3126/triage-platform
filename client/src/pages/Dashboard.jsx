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
      <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
        Aggregating platform intelligence...
      </div>
    );
  }

  const total = stats?.total || 0;

  // Helper to extract count from aggregation array
  const getCount = (arr, key) => {
    const item = arr?.find((i) => i._id === key);
    return item ? item.count : 0;
  };

  const criticalCount = getCount(stats?.byRiskLevel, 'Critical');
  const highCount = getCount(stats?.byRiskLevel, 'High');
  const mediumCount = getCount(stats?.byRiskLevel, 'Medium');
  const lowCount = getCount(stats?.byRiskLevel, 'Low');

  const unverifiedCount = getCount(stats?.byStatus, 'Unverified');
  const trueCount = getCount(stats?.byStatus, 'Verified True');
  const falseCount = getCount(stats?.byStatus, 'Verified False');
  const misleadingCount = getCount(stats?.byStatus, 'Misleading');

  const verifiedTotal = trueCount + falseCount + misleadingCount;

  const calcPct = (cnt) => (total > 0 ? Math.round((cnt / total) * 100) : 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Platform Triage Intelligence
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time metrics, risk distribution, and provenance activity across the fact-checking network.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Claims */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Claims Triaged
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {total}
            </span>
            <span className="text-xs text-slate-400">records</span>
          </div>
        </div>

        {/* Critical Risk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-rose-500">
          <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
            Critical Risk
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 font-mono">
              {criticalCount}
            </span>
            <span className="text-xs text-slate-400">({calcPct(criticalCount)}%)</span>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
            Pending Review
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600 font-mono">
              {unverifiedCount}
            </span>
            <span className="text-xs text-slate-400">({calcPct(unverifiedCount)}%)</span>
          </div>
        </div>

        {/* Verified */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            Verified Verdicts
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 font-mono">
              {verifiedTotal}
            </span>
            <span className="text-xs text-slate-400">({calcPct(verifiedTotal)}%)</span>
          </div>
        </div>
      </div>

      {/* Risk Level Distribution Bars */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Threat Severity Distribution
        </h2>

        <div className="space-y-3 text-xs">
          {/* Critical */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-rose-600">● Critical Risk</span>
              <span className="font-mono text-slate-700">{criticalCount} ({calcPct(criticalCount)}%)</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-rose-600" style={{ width: `${calcPct(criticalCount)}%` }} />
            </div>
          </div>

          {/* High */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-orange-500">● High Risk</span>
              <span className="font-mono text-slate-700">{highCount} ({calcPct(highCount)}%)</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500" style={{ width: `${calcPct(highCount)}%` }} />
            </div>
          </div>

          {/* Medium */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-amber-500">● Medium Risk</span>
              <span className="font-mono text-slate-700">{mediumCount} ({calcPct(mediumCount)}%)</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: `${calcPct(mediumCount)}%` }} />
            </div>
          </div>

          {/* Low */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-emerald-500">● Low Risk</span>
              <span className="font-mono text-slate-700">{lowCount} ({calcPct(lowCount)}%)</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${calcPct(lowCount)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Dual Breakdown: Category & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* By Category */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Claims by Category
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            {['Health', 'Politics', 'Finance', 'Other'].map((cat) => {
              const cnt = getCount(stats?.byCategory, cat);
              return (
                <div key={cat} className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-700 font-medium">{cat}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{cnt}</span>
                    <span className="text-slate-400 font-mono text-[11px]">({calcPct(cnt)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Verification Verdicts
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            {[
              { label: 'Unverified', color: 'text-slate-600' },
              { label: 'Verified True', color: 'text-emerald-600' },
              { label: 'Verified False', color: 'text-rose-600' },
              { label: 'Misleading', color: 'text-amber-600' },
            ].map(({ label, color }) => {
              const cnt = getCount(stats?.byStatus, label);
              return (
                <div key={label} className="py-2.5 flex justify-between items-center">
                  <span className={`font-medium ${color}`}>{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{cnt}</span>
                    <span className="text-slate-400 font-mono text-[11px]">({calcPct(cnt)}%)</span>
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Source Platforms
          </h2>
          <div className="space-y-2 text-xs">
            {['WhatsApp', 'X', 'Instagram', 'Other'].map((p) => {
              const cnt = getCount(stats?.byPlatform, p);
              return (
                <div key={p} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-700 font-medium">{p}</span>
                  <span className="font-mono font-bold text-slate-900">{cnt}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Platform Audit Activity */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Recent Audit Stream
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            {stats?.recent?.length > 0 ? (
              stats.recent.map((ev, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-800 font-medium truncate">
                      "{ev.text}..."
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      <span className="capitalize font-semibold text-slate-600">{ev.action}</span>
                      {ev.status && ` as ${ev.status}`} by <span className="font-mono text-slate-700">{ev.performedBy}</span>
                    </p>
                  </div>
                  <time className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </time>
                </div>
              ))
            ) : (
              <p className="text-slate-400 italic py-4">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}