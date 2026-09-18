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

  // Helper to convert raw URLs into a readable title for the feed
  const formatTitle = (text) => {
    if (!text) return '';
    if (text.startsWith('http://') || text.startsWith('https://')) {
      try {
        const url = new URL(text);
        const domain = url.hostname.replace('www.', '');
        const segments = url.pathname.split('/').filter(Boolean);
        
        // Look for a segment that actually looks like an article title (contains hyphens, is long enough)
        // This avoids picking up random hashes like 'c64gd7k9qkz8o' or 'XyqQrnRSMq'
        const slug = segments.reverse().find(seg => seg.includes('-') && seg.length > 15);
        
        if (slug) {
          const readable = slug.replace(/[-_]/g, ' ');
          return `${readable.charAt(0).toUpperCase() + readable.slice(1)} (via ${domain})`;
        }
        
        // If it's just a shortlink or hash, return a clean generic title based on the domain
        const siteName = domain.split('.')[0];
        const formattedSiteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
        
        if (domain.includes('reddit')) return 'Reddit Post / Claim';
        if (domain.includes('twitter') || domain.includes('x.com')) return 'X (Twitter) Post';
        if (domain.includes('youtube') || domain.includes('youtu.be')) return 'YouTube Video Claim';
        
        return `External Claim from ${formattedSiteName}`;
      } catch(e) {
        return text;
      }
    }
    return text;
  };

  return (
    <div className="px-6 sm:px-12 py-8 w-full mx-auto space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b-2 border-black pb-6">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight">
            Live Feed
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time viral claims triage
          </p>
        </div>

        {/* Minimalist KPI Strip */}
        <div className="flex items-center gap-6 text-[10px] font-bold tracking-widest uppercase bg-white p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col items-end">
            <span className="text-[#FFD700] text-xl leading-none">{totalCount}</span>
            <span className="text-gray-600 mt-1.5">Total</span>
          </div>
          <div className="w-px h-8 bg-black/10"></div>
          <div className="flex flex-col items-end">
            <span className="text-rose-500 text-xl leading-none">{criticalCount}</span>
            <span className="text-gray-600 mt-1.5">High Risk</span>
          </div>
          <div className="w-px h-8 bg-black/10"></div>
          <div className="flex flex-col items-end">
            <span className="text-amber-500 text-xl leading-none">{unverifiedCount}</span>
            <span className="text-gray-600 mt-1.5">Pending</span>
          </div>
          <div className="w-px h-8 bg-black/10"></div>
          <div className="flex flex-col items-end">
            <span className="text-emerald-500 text-xl leading-none">{verifiedCount}</span>
            <span className="text-gray-600 mt-1.5">Verified</span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH VIRAL CLAIMS..."
            className="w-full bg-white border-2 border-black rounded-xl text-black text-[10px] uppercase font-bold tracking-[0.15em] px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-white border-2 border-black rounded-xl text-black text-[10px] uppercase font-bold tracking-[0.15em] px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all appearance-none cursor-pointer"
          >
            <option value="">ALL CATEGORIES</option>
            <option value="Politics">POLITICS</option>
            <option value="Health">HEALTH</option>
            <option value="Finance">FINANCE</option>
            <option value="Other">OTHER</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-white border-2 border-black rounded-xl text-black text-[10px] uppercase font-bold tracking-[0.15em] px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all appearance-none cursor-pointer"
          >
            <option value="">ALL STATUSES</option>
            <option value="Unverified">UNVERIFIED</option>
            <option value="Verified True">VERIFIED TRUE</option>
            <option value="Verified False">VERIFIED FALSE</option>
            <option value="Misleading">MISLEADING</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full bg-white border-2 border-black rounded-xl text-black text-[10px] uppercase font-bold tracking-[0.15em] px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all appearance-none cursor-pointer"
          >
            <option value="risk">HIGHEST RISK FIRST</option>
            <option value="recency">MOST RECENT FIRST</option>
          </select>
        </div>
      </div>

      {/* Claims Grid */}
      <div className="pt-2">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs animate-pulse">
            Loading triage database...
          </div>
        ) : claims.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No claims found matching current filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {claims.map((claim) => (
              <div
                key={claim._id}
                onClick={() => {
                  setSelectedClaim(claim);
                  setSearchParams({ claimId: claim._id });
                }}
                className="group relative bg-white border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col h-64"
              >
                {/* Header: Category, Platform, Date & Status */}
                <div className="flex justify-between items-start mb-4 gap-2">
                  <div className="flex flex-col gap-1.5 items-start">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider bg-indigo-100 px-2.5 py-1 rounded-lg border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        {claim.category}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        {claim.platform}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(claim.submittedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={claim.status} />
                  </div>
                </div>

                {/* Main Text Content */}
                <div className="flex-1 min-h-0">
                  <h3 className="text-sm font-medium text-slate-900 line-clamp-5 leading-relaxed group-hover:text-indigo-700 transition-colors break-words capitalize-first">
                    {formatTitle(claim.text)}
                  </h3>
                </div>

                {/* Card Footer with Click Hint */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/10 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shadow-sm ${dotColors[claim.riskLevel] || 'bg-slate-400'}`}
                      title={`${claim.riskLevel} Risk`}
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Risk Score: <span className="font-mono">{claim.riskScore}</span>
                    </span>
                  </div>
                  
                  <span className="text-[11px] font-bold text-indigo-500 flex items-center gap-1 group-hover:text-indigo-700 transition-colors">
                    View details <span className="group-hover:translate-x-0.5 transition-transform">→</span>
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