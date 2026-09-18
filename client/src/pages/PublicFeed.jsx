import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchClaims, fetchClaimById } from '../api/api';
import StatusBadge from '../components/StatusBadge';
import ClaimDrawer from '../components/ClaimDrawer';

export default function PublicFeed() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('risk'); // 'risk' | 'recency'

  // Load claims on mount & filter change
  const loadClaims = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (status) params.status = status;
      if (sort) params.sort = sort;

      const { data } = await fetchClaims(params);
      setClaims(data);

      // Check if URL has ?claimId=
      const urlClaimId = searchParams.get('claimId');
      if (urlClaimId) {
        const found = data.find((c) => c._id === urlClaimId);
        if (found) {
          setSelectedClaim(found);
        } else {
          // Fetch directly if not in filtered list
          try {
            const res = await fetchClaimById(urlClaimId);
            setSelectedClaim(res.data);
          } catch {}
        }
      }
    } catch (err) {
      console.error('Error fetching claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, [category, status, sort]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadClaims();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Update single claim in list after drawer review or dispute
  const handleClaimUpdated = (updated) => {
    setClaims((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
    setSelectedClaim(updated);
  };

  const handleCloseDrawer = () => {
    setSelectedClaim(null);
    searchParams.delete('claimId');
    setSearchParams(searchParams);
  };

  // Quick summary numbers
  const totalCount = claims.length;
  const criticalCount = claims.filter((c) => c.riskLevel === 'Critical' || c.isHighRisk).length;
  const unverifiedCount = claims.filter((c) => c.status === 'Unverified').length;
  const verifiedCount = claims.filter((c) => c.status !== 'Unverified').length;

  const dotColors = {
    Critical: 'bg-rose-600',
    High: 'bg-orange-500',
    Medium: 'bg-amber-500',
    Low: 'bg-emerald-500',
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Misinformation Triage Feed
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time feed of viral claims triaged by risk severity and factual status.
          </p>
        </div>

        {/* Quick KPI Strip */}
        <div className="flex items-center gap-3 text-xs bg-slate-100 p-1.5 rounded-lg border border-slate-200">
          <div className="px-2.5 py-1 bg-white rounded shadow-xs font-semibold text-slate-800">
            {totalCount} <span className="font-normal text-slate-500">Total</span>
          </div>
          <div className="px-2.5 py-1 bg-white rounded shadow-xs font-semibold text-rose-600">
            {criticalCount} <span className="font-normal text-slate-500">High Risk</span>
          </div>
          <div className="px-2.5 py-1 bg-white rounded shadow-xs font-semibold text-amber-600">
            {unverifiedCount} <span className="font-normal text-slate-500">Pending</span>
          </div>
          <div className="px-2.5 py-1 bg-white rounded shadow-xs font-semibold text-emerald-600">
            {verifiedCount} <span className="font-normal text-slate-500">Verified</span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search viral claims..."
            className="w-full pl-3 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-indigo-600 text-slate-900"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-indigo-600 text-slate-700"
          >
            <option value="">All Categories</option>
            <option value="Politics">Politics</option>
            <option value="Health">Health</option>
            <option value="Finance">Finance</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-indigo-600 text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="Unverified">⏳ Unverified</option>
            <option value="Verified True">✅ Verified True</option>
            <option value="Verified False">❌ Verified False</option>
            <option value="Misleading">⚠️ Misleading</option>
          </select>
        </div>

        {/* Sort Order (DP1 Implementation) */}
        <div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-indigo-600 text-slate-700"
          >
            <option value="risk">🔥 Highest Risk First</option>
            <option value="recency">🕒 Most Recent First</option>
          </select>
        </div>
      </div>

      {/* Claims Table-List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
            Loading triage database...
          </div>
        ) : claims.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No claims found matching current filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {claims.map((claim) => (
              <div
                key={claim._id}
                onClick={() => {
                  setSelectedClaim(claim);
                  setSearchParams({ claimId: claim._id });
                }}
                className="p-4 sm:px-6 hover:bg-slate-50/80 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
              >
                {/* Left: Risk Indicator + Score + Text */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  
                  {/* Risk Level Dot */}
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      dotColors[claim.riskLevel] || 'bg-slate-400'
                    }`}
                    title={`${claim.riskLevel} Risk`}
                  />

                  {/* Score Pill */}
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                    {claim.riskScore}
                  </span>

                  {/* Claim Text */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {claim.text}
                    </p>
                  </div>

                  {/* Image attachment indicator */}
                  {claim.imageUrl && (
                    <span title="Screenshot attached" className="text-xs shrink-0">
                      📷
                    </span>
                  )}
                </div>

                {/* Right: Status Badge + Platform + Date */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <StatusBadge status={claim.status} />

                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {claim.platform}
                  </span>

                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {claim.category}
                  </span>

                  <span className="text-xs text-slate-400 font-mono w-20 text-right">
                    {new Date(claim.submittedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-out Drawer Component */}
      {selectedClaim && (
        <ClaimDrawer
          claim={selectedClaim}
          onClose={handleCloseDrawer}
          onClaimUpdated={handleClaimUpdated}
        />
      )}
    </div>
  );
}