import React, { useState, useEffect } from 'react';
import StatusBadge from './StatusBadge';
import RiskMeter from './RiskMeter';
import RiskFlag from './RiskFlag';
import AuditTimeline from './AuditTimeline';
import { reviewClaim, disputeClaim, voteOnClaim, resolveClaim } from '../api/api';
import toast from 'react-hot-toast';

function useCountdown(deadline) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const diff = new Date(deadline) - new Date();
      if (diff <= 0) { setTimeLeft('Voting ended'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s remaining`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return timeLeft;
}

export default function ClaimDrawer({ claim, onClose, onClaimUpdated }) {
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('Verified False');
  const [reviewerNote, setReviewerNote] = useState('');
  
  const timeLeft = useCountdown(claim?.community?.votingDeadline);

  if (!claim) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?claimId=${claim._id}`);
    toast.success('Link copied to clipboard!');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewerNote.trim()) return toast.error('Note required.');
    setSubmitting(true);
    try {
      const { data } = await reviewClaim(claim._id, { status: reviewStatus, reviewerNote });
      toast.success('Verdict submitted!');
      setShowReviewForm(false);
      onClaimUpdated(data);
    } catch (err) {
      toast.error('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispute = async () => {
    if (!confirm('Dispute this verdict? This will send it to a 12-hour community vote.')) return;
    setSubmitting(true);
    try {
      const { data } = await disputeClaim(claim._id);
      toast.success('Sent to community voting!');
      onClaimUpdated(data);
    } catch (err) {
      toast.error('Failed to dispute');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (vote) => {
    const voted = localStorage.getItem(`voted_${claim._id}`);
    if (voted) return toast.error('You already voted!');
    if (claim.community?.resolved) return toast.error('Voting is closed for this claim.');
    
    setSubmitting(true);
    try {
      const { data } = await voteOnClaim(claim._id, vote);
      localStorage.setItem(`voted_${claim._id}`, vote);
      toast.success('Vote recorded!');
      onClaimUpdated(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Vote failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    setSubmitting(true);
    try {
      const { data } = await resolveClaim(claim._id);
      toast.success('Resolved based on votes!');
      onClaimUpdated(data);
    } catch (err) {
      toast.error('Cannot resolve yet');
    } finally {
      setSubmitting(false);
    }
  };

  const isUnverified = claim.status === 'Unverified';
  const isDisputed   = claim.status === 'Disputed';
  const isVerified   = ['Verified True', 'Verified False', 'Misleading'].includes(claim.status);
  
  const trueCount    = claim.community?.trueVotes?.length || 0;
  const falseCount   = claim.community?.falseVotes?.length || 0;
  const totalVotes   = trueCount + falseCount;
  const truePercent  = totalVotes ? Math.round((trueCount / totalVotes) * 100) : 50;
  const falsePercent = totalVotes ? Math.round((falseCount / totalVotes) * 100) : 50;
  const hasVoted     = !!localStorage.getItem(`voted_${claim._id}`);
  const myVote       = localStorage.getItem(`voted_${claim._id}`);
  const isResolved   = claim.community?.resolved;
  const deadlinePast = claim.community?.votingDeadline && new Date() >= new Date(claim.community.votingDeadline);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <StatusBadge status={claim.status} />
            <span className="text-xs font-mono text-slate-400">ID: {claim._id.slice(-6)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-50 transition"
            >
              🔗 Copy Link
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-md transition"
            >✕</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Risk Meter */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <RiskMeter score={claim.riskScore} level={claim.riskLevel} />
            <div className="flex flex-wrap gap-1.5 pt-1">
              <RiskFlag type="sensational" active={claim.flags?.sensational} />
              <RiskFlag type="shouting"    active={claim.flags?.shouting} />
              <RiskFlag type="unsourced"   active={claim.flags?.unsourced} />
              {claim.isHighRisk && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-600 text-white">
                  🔴 High Risk (2+ Flags)
                </span>
              )}
            </div>
          </div>

          {/* Claim Text */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Claim Text</label>
            <div className="p-4 bg-white rounded-xl border border-slate-200 text-slate-900 text-sm leading-relaxed whitespace-pre-wrap font-sans select-text">
              {claim.text}
            </div>
          </div>

          {/* Image */}
          {claim.imageUrl && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attached Screenshot</label>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-64 flex items-center justify-center p-2">
                <img src={claim.imageUrl} alt="Claim Attachment" className="max-h-60 rounded-lg object-contain shadow-xs" />
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md">
              <span className="text-slate-400">Platform:</span>
              <span className="font-semibold text-slate-800">{claim.platform}</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md">
              <span className="text-slate-400">Category:</span>
              <span className="font-semibold text-slate-800">{claim.category}</span>
            </div>
            <div className="text-slate-400 ml-auto font-mono">
              {new Date(claim.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          {/* VERDICT OR REVIEW SECTION */}
          {!isDisputed && (
            <div className="pt-2 border-t border-slate-200">
              {isUnverified ? (
                !showReviewForm ? (
                  <button onClick={() => setShowReviewForm(true)} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-sm transition shadow-sm">
                    ✍️ Add Initial Verdict
                  </button>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Submit Verdict</div>
                                        <div className="grid grid-cols-2 gap-2">
                      {['Verified True', 'Verified False/Misleading'].map(v => (
                        <button key={v} type="button" onClick={() => setReviewStatus(v)} className={`py-2 text-xs font-semibold rounded border transition ${reviewStatus === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-slate-100 text-slate-700'}`}>{v}</button>
                      ))}
                    </div>
                    <textarea required value={reviewerNote} onChange={e => setReviewerNote(e.target.value)} placeholder="Provide an explanation or link to a source..." className="w-full p-2.5 text-sm border border-slate-300 rounded-md outline-indigo-500" rows={3} />
                    <div className="flex gap-2">
                      <button type="submit" disabled={submitting} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-md transition">Submit Verdict</button>
                      <button type="button" onClick={() => setShowReviewForm(false)} className="px-4 py-2 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-md transition font-medium">Cancel</button>
                    </div>
                  </form>
                )
              ) : isVerified ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">Verdict Note</span>
                      <span className="text-slate-500 font-mono">by {claim.reviewedBy || 'Community Reviewer'}</span>
                    </div>
                    <div className="text-sm text-slate-800 italic">"{claim.reviewerNote}"</div>
                  </div>
                  <button onClick={handleDispute} disabled={submitting} className="w-full py-2.5 text-sm font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition">
                    ⚠️ Dispute this Verdict (Start Community Vote)
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* COMMUNITY VOTING (Only shown when Disputed) */}
          {isDisputed && (
            <div className="pt-2 border-t border-slate-200 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-indigo-900 text-xs uppercase tracking-wider">🗳️ Community Voting (12h)</span>
                {claim.community?.votingDeadline && !isResolved && (
                  <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                    ⏱ {timeLeft}
                  </span>
                )}
                {isResolved && (
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    ✅ Voting Closed
                  </span>
                )}
              </div>
              
              {/* Vote Bars */}
              {totalVotes > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-14 text-emerald-700 font-semibold">✅ True</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${truePercent}%` }} />
                    </div>
                    <span className="w-12 text-right font-mono text-slate-600">{trueCount} ({truePercent}%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-14 text-rose-700 font-semibold">❌ False</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${falsePercent}%` }} />
                    </div>
                    <span className="w-12 text-right font-mono text-slate-600">{falseCount} ({falsePercent}%)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">
                    {totalVotes} total vote{totalVotes !== 1 ? 's' : ''} · Requires ≥3 votes for auto-resolve
                  </p>
                </div>
              )}

              {/* Voting Buttons */}
              {!isResolved ? (
                hasVoted ? (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <p className="text-xs text-slate-600">
                      You voted <strong className={myVote === 'true' ? 'text-emerald-600' : 'text-rose-600'}>
                        {myVote === 'true' ? '✅ True' : '❌ False'}
                      </strong>
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleVote('true')} disabled={submitting} className="py-3 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-bold flex flex-col items-center gap-1 transition shadow-sm">
                      <span className="text-2xl">✅</span><span className="text-sm">This is True</span>
                    </button>
                    <button onClick={() => handleVote('false')} disabled={submitting} className="py-3 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold flex flex-col items-center gap-1 transition shadow-sm">
                      <span className="text-2xl">❌</span><span className="text-sm">This is False</span>
                    </button>
                  </div>
                )
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600">
                  Voting closed. Final result: <strong>{trueCount} True</strong> vs <strong>{falseCount} False</strong>
                </div>
              )}

              {deadlinePast && !isResolved && totalVotes >= 3 && (
                <button onClick={handleResolve} disabled={submitting} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition">
                  🔄 Apply Final Decision
                </button>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Audit Trail</h4>
            <AuditTimeline history={claim.history} />
          </div>
        </div>
      </div>
    </div>
  );
}