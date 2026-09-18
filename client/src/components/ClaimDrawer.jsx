import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import RiskMeter from './RiskMeter';
import RiskFlag from './RiskFlag';
import AuditTimeline from './AuditTimeline';
import { reviewClaim, disputeClaim } from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ClaimDrawer({ claim, onClose, onClaimUpdated }) {
  const { user, isAdmin } = useAuth();
  const [reviewStatus, setReviewStatus] = useState('Verified False');
  const [reviewerNote, setReviewerNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  if (!claim) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?claimId=${claim._id}`);
    toast.success('Link copied to clipboard!');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewerNote.trim()) {
      toast.error('Please write a brief note for your review.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await reviewClaim(claim._id, {
        status: reviewStatus,
        reviewerNote: reviewerNote.trim(),
      });
      toast.success(`Claim marked as "${reviewStatus}"!`);
      setShowReviewForm(false);
      onClaimUpdated(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Review failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispute = async () => {
    if (!confirm('Are you sure you want to dispute this verdict? It will return the claim to Unverified queue.')) {
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await disputeClaim(claim._id);
      toast.success('Verdict disputed. Claim returned to Unverified queue.');
      onClaimUpdated(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to dispute claim');
    } finally {
      setSubmitting(false);
    }
  };

  const isUnverified = claim.status === 'Unverified';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <StatusBadge status={claim.status} />
            <span className="text-xs font-mono text-slate-400">
              ID: {claim._id.slice(-6)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-50 transition"
              title="Copy share link"
            >
              🔗 Copy Link
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="p-6 space-y-6">
          {/* Risk Meter Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <RiskMeter score={claim.riskScore} level={claim.riskLevel} />
            
            {/* Flags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <RiskFlag type="sensational" active={claim.flags?.sensational} />
              <RiskFlag type="shouting" active={claim.flags?.shouting} />
              <RiskFlag type="unsourced" active={claim.flags?.unsourced} />
              {claim.isHighRisk && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-600 text-white">
                  🔴 High Risk (2+ Flags)
                </span>
              )}
            </div>
          </div>

          {/* Full Claim Content */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Claim Text
            </label>
            <div className="p-4 bg-white rounded-xl border border-slate-200 text-slate-900 text-sm leading-relaxed whitespace-pre-wrap font-sans select-text">
              {claim.text}
            </div>
          </div>

          {/* Attached Screenshot / Image */}
          {claim.imageUrl && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Attached Screenshot / Media
              </label>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-64 flex items-center justify-center p-2">
                <img
                  src={claim.imageUrl}
                  alt="Claim Attachment"
                  className="max-h-60 rounded-lg object-contain shadow-xs"
                />
              </div>
            </div>
          )}

          {/* Metadata Chips */}
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
              {new Date(claim.submittedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>

          {/* Review Note Box (if already reviewed) */}
          {!isUnverified && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Official Verdict Note</span>
                <span className="text-slate-500 font-mono">by {claim.reviewedBy || 'Admin'}</span>
              </div>
              <p className="text-sm text-slate-800 italic">
                "{claim.reviewerNote || 'No explanation provided.'}"
              </p>
            </div>
          )}

          {/* Review / Dispute Action Box */}
          <div className="pt-2 border-t border-slate-200">
            {isUnverified ? (
              <div>
                {!showReviewForm ? (
                  <button
                    onClick={() => {
                      if (!isAdmin) {
                        toast.error('Reviewer / Admin login required to submit verdicts.');
                        return;
                      }
                      setShowReviewForm(true);
                    }}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-sm transition"
                  >
                    {isAdmin ? '✍️ Review This Claim' : '🔒 Login as Reviewer to Verify'}
                  </button>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Submit Official Verdict
                    </h3>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Select Verdict
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Verified True', 'Verified False', 'Misleading'].map((v) => (
                          <button
                            type="button"
                            key={v}
                            onClick={() => setReviewStatus(v)}
                            className={`py-2 px-2 text-xs font-semibold rounded-md border text-center transition ${
                              reviewStatus === v
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Reviewer Explanation / Evidence *
                      </label>
                      <textarea
                        rows={3}
                        value={reviewerNote}
                        onChange={(e) => setReviewerNote(e.target.value)}
                        placeholder="Cite official fact-check sources, scientific consensus, or evidence..."
                        className="w-full p-2.5 text-xs bg-white rounded-md border border-slate-300 focus:outline-indigo-500 text-slate-900"
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition"
                      >
                        {submitting ? 'Submitting...' : 'Confirm Verdict'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Believe this verdict is inaccurate?
                </span>
                <button
                  onClick={handleDispute}
                  disabled={submitting}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-300 bg-amber-50 hover:bg-amber-100 rounded-md transition"
                >
                  ⚠️ Dispute Verdict
                </button>
              </div>
            )}
          </div>

          {/* Audit Timeline */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Audit Trail
            </h4>
            <AuditTimeline history={claim.history} />
          </div>
        </div>
      </div>
    </div>
  );
}