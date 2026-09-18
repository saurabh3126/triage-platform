import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitClaim, extractLinkContent, analyzeWithGemini } from '../api/api';
import { analyzeFlagsClient } from '../utils/flagAnalyzer';
import RiskMeter from '../components/RiskMeter';
import RiskFlag from '../components/RiskFlag';
import toast from 'react-hot-toast';

export default function SubmitClaim() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [platform, setPlatform] = useState('WhatsApp');
  const [category, setCategory] = useState('Health');
  const [imagePreview, setImagePreview] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReasoning, setAiReasoning] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const [liveAnalysis, setLiveAnalysis] = useState(() => analyzeFlagsClient(''));

  useEffect(() => {
    if (!aiReasoning) {
      setLiveAnalysis(analyzeFlagsClient(text));
    }
  }, [text, aiReasoning]);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAutoExtract = async () => {
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    if (!urlMatch) {
      toast.error('Please paste a link (http:// or https://) in the box first!');
      return;
    }
    setExtracting(true);
    const toastId = toast.loading('Fetching post content from link...');
    try {
      const { data } = await extractLinkContent(urlMatch[0]);
      if (data.text) {
        setText((prev) => (prev ? `${prev}\n\n[Extracted from Link]:\n${data.text}` : data.text));
        if (data.imageUrl && !imagePreview) setImagePreview(data.imageUrl);
        if (data.platform && data.platform !== 'Other') setPlatform(data.platform);
        toast.success('Extracted post content & media!', { id: toastId });
      } else {
        toast.error('Could not extract text from this link', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to extract from link', { id: toastId });
    } finally {
      setExtracting(false);
    }
  };

  const handleGeminiAnalysis = async () => {
    if (!text.trim() && !imagePreview) {
      toast.error('Please provide text or an image first for AI analysis!');
      return;
    }
    setAiLoading(true);
    const toastId = toast.loading('Analyzing claim details...');
    try {
      const { data } = await analyzeWithGemini({ text, imageBase64: imagePreview });
      
      if (data.extractedText) setText(data.extractedText);
      setAiReasoning(data.reasoning);

      // 🪄 AUTO-SELECT DROPDOWNS BASED ON AI RESPONSE
      if (data.category && ['Politics', 'Health', 'Finance', 'Other'].includes(data.category)) {
        setCategory(data.category);
      }
      if (data.platform && ['WhatsApp', 'X', 'Instagram', 'Reddit', 'Other'].includes(data.platform)) {
        setPlatform(data.platform);
      }

      setLiveAnalysis({
        riskScore: data.riskScore,
        riskLevel: data.riskScore >= 75 ? 'Critical Risk' : data.riskScore >= 50 ? 'High Risk' : data.riskScore >= 25 ? 'Medium Risk' : 'Low Risk',
        sensational: data.sensational,
        shouting: data.shouting,
        unsourced: data.unsourced,
        isHighRisk: data.riskScore >= 50,
      });

      toast.success('Analysis Complete!', { id: toastId });
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Analysis failed';
      const is503 = msg.includes('503') || msg.includes('high demand') || msg.includes('unavailable') || msg.includes('overloaded');
      toast.error(is503 ? '⏳ The server is a bit busy right now. Please wait a few seconds and try again!' : 'Unable to analyze this claim right now. Please try again.', { id: toastId });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error('Claim text cannot be empty');
      return;
    }
    setSubmitting(true);
    setDuplicateWarning(null);
    try {
      const { data } = await submitClaim({
        text: text.trim(),
        platform,
        category,
        imageUrl: imagePreview,
      });
      if (data.duplicate) {
        setDuplicateWarning(data.existingClaim);
        toast('A very similar claim already exists in the system!', { icon: '⚠️' });
        setSubmitting(false);
        return;
      }
      toast.success(`Claim submitted! Risk score: ${data.claim.riskScore}/100`);
      navigate(`/?claimId=${data.claim._id}`);
    } catch (err) {
      toast.error('Unable to submit claim. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6 animate-in fade-in duration-500">
      {/* Header matching INFUSED style */}
      <div className="border-b border-black/10 pb-6 mb-8">
        <h1 className="text-3xl font-black italic tracking-tighter text-black uppercase leading-none">
          Submit <span className="text-[#FFD700]">Claim</span>
        </h1>
        <p className="text-[10px] text-gray-600 mt-2 uppercase tracking-widest font-bold">
          Auto-extract text and score risk instantly
        </p>
      </div>

      {duplicateWarning && (
        <div className="p-4 rounded-none border border-amber-500/50 bg-slate-50 text-amber-200 space-y-3">
          <div className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-[0.2em] text-[#FFD700]">
            <span>⚠️</span> Duplicate Claim Detected
          </div>
          <p className="text-xs">
            A 40%+ matching claim was already submitted with status: <strong>{duplicateWarning.status}</strong> (Risk Score: {duplicateWarning.riskScore}/100).
          </p>
          <div className="p-3 bg-white border border-black/10 text-xs italic line-clamp-2 text-gray-500">
            "{duplicateWarning.text}"
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(`/?claimId=${duplicateWarning._id}`)}
              className="px-4 py-2 text-[10px] tracking-[0.2em] font-bold bg-[#FFD700] hover:bg-black hover:text-white text-black transition-colors"
            >
              VIEW EXISTING
            </button>
            <button
              type="button"
              onClick={() => setDuplicateWarning(null)}
              className="px-4 py-2 text-[10px] tracking-[0.2em] font-bold bg-transparent text-gray-500 border border-black/20 hover:text-black transition-colors"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">

        {/* Text Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase">
            <label htmlFor="claimText">Post Text / Content / Link *</label>
            <div className="flex items-center gap-3">
              {text.includes('http') && (
                <button
                  type="button"
                  onClick={handleAutoExtract}
                  disabled={extracting}
                  className="text-[9px] px-3 py-1.5 bg-white text-[#FFD700] hover:bg-[#FFD700] hover:text-white font-bold border border-[#FFD700]/30 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 tracking-widest"
                >
                  {extracting ? '⏳ EXTRACTING...' : '⚡ AUTO-EXTRACT LINK'}
                </button>
              )}
              <span className="font-mono text-gray-600 font-normal">{text.length} CHARS</span>
            </div>
          </div>
          <textarea
            id="claimText"
            rows={5}
            value={text}
            onChange={(e) => { setText(e.target.value); setAiReasoning(''); }}
            placeholder="PASTE THE VIRAL CLAIM MESSAGE HERE..."
            className="w-full p-4 text-sm font-bold tracking-wide bg-slate-50 border-2 border-black rounded-xl focus:border-black focus:ring-2 focus:ring-black text-black leading-relaxed transition-all outline-none placeholder-gray-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            required
          />
        </div>

        {/* Screenshot Upload */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase block">
            📷 ATTACH SCREENSHOT (OPTIONAL)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-[10px] font-bold tracking-widest text-gray-600 file:mr-4 file:py-2.5 file:px-4 file:border-2 file:border-black file:rounded-lg file:text-[10px] file:font-bold file:tracking-widest file:bg-white file:text-black hover:file:bg-[#FFD700] file:transition-all cursor-pointer file:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
          {imagePreview && (
            <div className="relative mt-3 p-2 bg-slate-50 border-2 border-black rounded-xl inline-block max-w-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <img src={imagePreview} alt="Screenshot Preview" className="max-h-36 object-contain rounded-lg" />
              <button
                type="button"
                onClick={() => setImagePreview('')}
                className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 border-2 border-black text-white text-xs font-bold flex items-center justify-center rounded-full hover:bg-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-none transition-all cursor-pointer"
              >✕</button>
            </div>
          )}
        </div>

        {/* ✨ Auto-Analyze Button */}
        <button
          type="button"
          onClick={handleGeminiAnalysis}
          disabled={aiLoading || (!text && !imagePreview)}
          className="w-full py-4 px-4 bg-[#FFD700] text-black font-black text-[12px] uppercase tracking-[0.2em] rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {aiLoading ? ' ANALYZING CONTENT...' : '✨ AUTO-ANALYZE CLAIM'}
        </button>

        {/* Platform & Category — auto-filled */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Source Platform * {aiReasoning && <span className="text-indigo-500 font-normal">(Auto-detected)</span>}
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border-2 border-black rounded-xl focus:border-black focus:ring-2 focus:ring-black text-black font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <option value="WhatsApp">WhatsApp</option>
              <option value="X">X (Twitter)</option>
              <option value="Instagram">Instagram</option>
              <option value="Reddit">Reddit</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Category * {aiReasoning && <span className="text-indigo-500 font-normal">(Auto-detected)</span>}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border-2 border-black rounded-xl focus:border-black focus:ring-2 focus:ring-black text-black font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <option value="Politics">Politics</option>
              <option value="Health">Health</option>
              <option value="Finance">Finance</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Live / AI Triage Panel */}
        <div className="p-5 bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>{aiReasoning ? '✨' : '⚡'}</span>
              {aiReasoning ? 'Analysis Triage' : 'Live Threat Triage'}
            </span>
            <span className="text-[10px] text-slate-500">
              {aiReasoning ? 'Auto-scored' : 'Updates as you type'}
            </span>
          </div>

          <RiskMeter score={liveAnalysis.riskScore} level={liveAnalysis.riskLevel} />

          <div className="flex flex-wrap gap-1.5 pt-1">
            <RiskFlag type="sensational" active={liveAnalysis.sensational} />
            <RiskFlag type="shouting"    active={liveAnalysis.shouting} />
            <RiskFlag type="unsourced"   active={liveAnalysis.unsourced} />
            {liveAnalysis.isHighRisk && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-xs font-semibold bg-rose-600 text-white animate-pulse">
                🔴 High Risk (2+ Flags Detected)
              </span>
            )}
            {!liveAnalysis.sensational && !liveAnalysis.shouting && !liveAnalysis.unsourced && (
              <span className="text-xs text-slate-500 italic">No flags triggered yet</span>
            )}
          </div>

          {aiReasoning && (
            <div className="mt-3 p-3 bg-indigo-900/30 border border-indigo-500/30 rounded-none text-xs text-indigo-300 leading-relaxed shadow-sm">
              <strong className="font-semibold block mb-1">🤖 Analysis Details:</strong>
              {aiReasoning}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || extracting || aiLoading}
          className="w-full py-4 px-4 bg-black text-white font-black text-[13px] uppercase tracking-[0.25em] rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:bg-[#FFD700] hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all disabled:opacity-50 mt-8"
        >
          {submitting ? 'SUBMITTING...' : ' SUBMIT CLAIM FOR TRIAGE'}
        </button>
      </form>
    </div>
  );
}