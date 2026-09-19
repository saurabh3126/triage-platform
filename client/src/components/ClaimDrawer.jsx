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

  const [confirmDispute, setConfirmDispute] = useState(false);

  const handleDispute = async () => {
    setSubmitting(true);
    try {
      const { data } = await disputeClaim(claim._id);
      toast.success('Sent to community voting!');
      setConfirmDispute(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden max-h-[95vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b-2 border-black flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <StatusBadge status={claim.status} />
            <span className="text-xs font-mono text-slate-400 bg-slate-100 border-2 border-black px-2 py-0.5 rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              ID: {claim._id.slice(-6)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 text-xs font-bold text-black border-2 border-black rounded-lg bg-white hover:bg-[#FFD700] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-px transition-all"
            >
              🔗 Copy Link
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center font-bold text-black border-2 border-black rounded-lg bg-white hover:bg-rose-100 hover:border-rose-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-px transition-all"
            >✕</button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto">

          {/* Risk Meter */}
          <div className="p-4 bg-white rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
            <RiskMeter score={claim.riskScore} level={claim.riskLevel} />
            <div className="flex flex-wrap gap-1.5 pt-1">
              <RiskFlag type="sensational" active={claim.flags?.sensational} />
              <RiskFlag type="shouting"    active={claim.flags?.shouting} />
              <RiskFlag type="unsourced"   active={claim.flags?.unsourced} />
              {claim.isHighRisk && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-rose-100 text-rose-700 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  🔴 High Risk (2+ Flags)
                </span>
              )}
            </div>
          </div>

          {/* Claim Text */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Claim Text</label>
            <div className="p-4 bg-slate-50 rounded-xl border-2 border-black text-black text-sm leading-relaxed whitespace-pre-wrap font-sans select-text shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {claim.text}
            </div>
          </div>

          {/* Image */}
          {claim.imageUrl && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Attached Screenshot</label>
              <div className="rounded-xl overflow-hidden border-2 border-black bg-white max-h-64 flex items-center justify-center p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <img src={claim.imageUrl} alt="Claim Attachment" className="max-h-60 rounded-lg object-contain" />
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 border-2 border-black px-3 py-1.5 rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Platform:</span>
              <span className="text-xs font-black text-black">{claim.platform}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 border-2 border-black px-3 py-1.5 rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Category:</span>
              <span className="text-xs font-black text-black">{claim.category}</span>
            </div>
            <div className="ml-auto text-xs text-slate-500 font-mono bg-white border-2 border-black px-3 py-1.5 rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              {new Date(claim.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          {/* VERDICT / REVIEW SECTION */}
          {!isDisputed && (
            <div className="pt-4 border-t-2 border-black">
              {isUnverified ? (
                !showReviewForm ? (
                  <button onClick={() => setShowReviewForm(true)} className="w-full py-4 mt-2 bg-[#FFD700] text-black font-black text-[12px] uppercase tracking-[0.2em] rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all">
                    ✍️ ADD INITIAL VERDICT
                  </button>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-4 p-5 mt-2 bg-slate-50 border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Submit Verdict</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button type="button" onClick={() => setReviewStatus('Verified True')}
                        className={`py-3 px-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-xl border-2 transition-all ${reviewStatus === 'Verified True' ? 'bg-[#FFD700] text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black border-black hover:bg-emerald-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}>
                        ✅ Verified True
                      </button>
                      <button type="button" onClick={() => setReviewStatus('Verified False')}
                        className={`py-3 px-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-xl border-2 transition-all ${reviewStatus === 'Verified False' ? 'bg-[#FFD700] text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black border-black hover:bg-rose-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}>
                        ❌ Verified False
                      </button>
                      <button type="button" onClick={() => setReviewStatus('Misleading')}
                        className={`py-3 px-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-xl border-2 transition-all ${reviewStatus === 'Misleading' ? 'bg-[#FFD700] text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black border-black hover:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}>
                        ⚠️ Misleading
                      </button>
                    </div>
                    <textarea required value={reviewerNote} onChange={e => setReviewerNote(e.target.value)}
                      placeholder="Provide an explanation or source link..."
                      className="w-full p-4 text-sm bg-white text-black border-2 border-black rounded-xl focus:ring-2 focus:ring-black outline-none placeholder-gray-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all" rows={3} />
                    <div className="flex gap-3">
                      <button type="submit" disabled={submitting}
                        className="flex-1 py-3 bg-black text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:bg-[#FFD700] hover:text-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                        Submit Verdict
                      </button>
                      <button type="button" onClick={() => setShowReviewForm(false)}
                        className="px-5 py-3 bg-white border-2 border-black text-black hover:bg-slate-100 rounded-xl font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-px transition-all">
                        Cancel
                      </button>
                    </div>
                  </form>
                )
              ) : isVerified ? (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-black uppercase tracking-wider">Verdict Note</span>
                      <span className="text-[10px] text-slate-500 font-mono">by {claim.reviewedBy || 'Community Reviewer'}</span>
                    </div>
                    <div className="text-sm text-black italic">"{claim.reviewerNote}"</div>
                  </div>
                  {!confirmDispute ? (
                    <button onClick={() => setConfirmDispute(true)} disabled={submitting}
                      className="w-full py-3 text-sm font-black text-amber-700 bg-amber-50 hover:bg-amber-100 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-px transition-all">
                      ⚠️ Dispute this Verdict (Start Community Vote)
                    </button>
                  ) : (
                    <div className="p-4 bg-amber-50 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-3">
                      <p className="text-sm text-black font-semibold text-center">Are you sure you want to dispute this verdict and start a 12-hour community vote?</p>
                      <div className="flex gap-2">
                        <button onClick={handleDispute} disabled={submitting}
                          className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-500 text-black font-black text-xs uppercase rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-px transition-all">
                          Yes, Start Vote
                        </button>
                        <button onClick={() => setConfirmDispute(false)} disabled={submitting}
                          className="flex-1 py-2.5 bg-white border-2 border-black text-black font-bold text-xs uppercase rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-px transition-all">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* COMMUNITY VOTING */}
          {isDisputed && (
            <div className="pt-4 border-t-2 border-black space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-black uppercase tracking-[0.15em]">🗳️ Community Voting (12h)</span>
                {claim.community?.votingDeadline && !isResolved && (
                  <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border-2 border-black px-2.5 py-1 rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    ⏱ {timeLeft}
                  </span>
                )}
                {isResolved && (
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border-2 border-black px-2.5 py-1 rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    ✅ Voting Closed
                  </span>
                )}
              </div>

              {/* Vote Bars */}
              {totalVotes > 0 && (
                <div className="space-y-2 p-4 bg-slate-50 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-16 text-emerald-700 font-black">✅ True</span>
                    <div className="flex-1 h-3 bg-emerald-100 rounded-full overflow-hidden border-2 border-black">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${truePercent}%` }} />
                    </div>
                    <span className="w-16 text-right font-mono font-bold text-black">{trueCount} ({truePercent}%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-16 text-rose-700 font-black">❌ False</span>
                    <div className="flex-1 h-3 bg-rose-100 rounded-full overflow-hidden border-2 border-black">
                      <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${falsePercent}%` }} />
                    </div>
                    <span className="w-16 text-right font-mono font-bold text-black">{falseCount} ({falsePercent}%)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 text-center font-bold pt-1">
                    {totalVotes} total vote{totalVotes !== 1 ? 's' : ''} · Requires ≥3 votes for auto-resolve
                  </p>
                </div>
              )}

              {/* Voting Buttons */}
              {!isResolved ? (
                hasVoted ? (
                  <div className="p-4 rounded-xl bg-slate-50 border-2 border-black text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-sm font-bold text-black">
                      You voted <span className={myVote === 'true' ? 'text-emerald-600' : 'text-rose-600'}>
                        {myVote === 'true' ? '✅ True' : '❌ False'}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleVote('true')} disabled={submitting}
                      className="py-5 bg-emerald-50 hover:bg-emerald-100 border-2 border-black text-black rounded-xl font-black flex flex-col items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all">
                      <span className="text-3xl">✅</span>
                      <span className="text-sm text-emerald-700">This is True</span>
                    </button>
                    <button onClick={() => handleVote('false')} disabled={submitting}
                      className="py-5 bg-rose-50 hover:bg-rose-100 border-2 border-black text-black rounded-xl font-black flex flex-col items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all">
                      <span className="text-3xl">❌</span>
                      <span className="text-sm text-rose-700">This is False</span>
                    </button>
                  </div>
                )
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border-2 border-black text-center text-sm font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  Voting closed. Final result: <span className="text-emerald-600">{trueCount} True</span> vs <span className="text-rose-600">{falseCount} False</span>
                </div>
              )}

              {deadlinePast && !isResolved && totalVotes >= 3 && (
                <button onClick={handleResolve} disabled={submitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-wider rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all">
                  🔄 Apply Final Decision
                </button>
              )}
            </div>
          )}

          {/* Audit Trail */}
          <div className="pt-4 border-t-2 border-black space-y-3">
            <h4 className="text-xs font-black text-black uppercase tracking-[0.2em]">Audit Trail</h4>
            <AuditTimeline history={claim.history} />
          </div>
        </div>
      </div>
    </div>
  );
}