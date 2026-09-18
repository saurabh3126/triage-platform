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
    const toastId = toast.loading('Gemini AI is analyzing image and text...');
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

      toast.success('AI Analysis Complete!', { id: toastId });
    } catch (err) {
      console.error(err);
            const msg = err.response?.data?.error || 'Gemini analysis failed';
      const is503 = msg.includes('503') || msg.includes('high demand') || msg.includes('unavailable');
      toast.error(is503 ? '⏳ Gemini is overloaded right now. Please wait 30 seconds and try again!' : msg, { id: toastId });
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
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Submit a Viral Claim</h1>
        <p className="text-sm text-slate-500 mt-1">
          Paste viral post text, a link, or upload a screenshot. Use Gemini AI to extract text and score risk accurately.
        </p>
      </div>

      {duplicateWarning && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-800">
            <span>⚠️</span> Duplicate Claim Detected
          </div>
          <p className="text-xs">
            A 40%+ matching claim was already submitted with status: <strong>{duplicateWarning.status}</strong> (Risk Score: {duplicateWarning.riskScore}/100).
          </p>
          <div className="p-2.5 bg-white/80 rounded border border-amber-200 text-xs italic line-clamp-2">
            "{duplicateWarning.text}"
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => navigate(`/?claimId=${duplicateWarning._id}`)}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-md transition"
            >
              View Existing Claim
            </button>
            <button
              type="button"
              onClick={() => setDuplicateWarning(null)}
              className="px-3 py-1.5 text-xs font-medium bg-white text-slate-700 border border-slate-300 rounded-md hover:bg-slate-100 transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">

        {/* Text Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <label htmlFor="claimText">Post Text / Content / Link *</label>
            <div className="flex items-center gap-3">
              {text.includes('http') && (
                <button
                  type="button"
                  onClick={handleAutoExtract}
                  disabled={extracting}
                  className="text-[11px] px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md font-semibold border border-indigo-200 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {extracting ? '⏳ Extracting...' : '⚡ Auto-Extract Link'}
                </button>
              )}
              <span className="font-mono text-slate-400 font-normal">{text.length} characters</span>
            </div>
          </div>
          <textarea
            id="claimText"
            rows={5}
            value={text}
            onChange={(e) => { setText(e.target.value); setAiReasoning(''); }}
            placeholder="Paste the viral claim message here (e.g. 'BREAKING!! Share before deleted: 5G towers cause...')"
            className="w-full p-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-indigo-600 text-slate-900 leading-relaxed font-sans transition"
            required
          />
        </div>

        {/* Screenshot Upload */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 block">
            📷 Attach Screenshot (for Gemini AI Analysis)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
          />
          {imagePreview && (
            <div className="relative mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200 inline-block max-w-xs">
              <img src={imagePreview} alt="Screenshot Preview" className="max-h-36 rounded-lg object-contain" />
              <button
                type="button"
                onClick={() => setImagePreview('')}
                className="absolute -top-2 -right-2 w-6 h-6 bg-rose-600 text-white rounded-full text-xs flex items-center justify-center shadow hover:bg-rose-700"
              >✕</button>
            </div>
          )}
        </div>

        {/* ✨ Gemini AI Button */}
        <button
          type="button"
          onClick={handleGeminiAnalysis}
          disabled={aiLoading || (!text && !imagePreview)}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm transition flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {aiLoading ? '🤖 Gemini is analyzing...' : '✨ Analyze Image & Text with Gemini AI'}
        </button>

        {/* Platform & Category — auto-filled by Gemini */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Source Platform * {aiReasoning && <span className="text-indigo-500 font-normal">(AI selected)</span>}
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-indigo-600 text-slate-800"
            >
              <option value="WhatsApp">WhatsApp</option>
              <option value="X">X (Twitter)</option>
              <option value="Instagram">Instagram</option>
              <option value="Reddit">Reddit</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category * {aiReasoning && <span className="text-indigo-500 font-normal">(AI selected)</span>}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-indigo-600 text-slate-800"
            >
              <option value="Politics">Politics</option>
              <option value="Health">Health</option>
              <option value="Finance">Finance</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Live / AI Triage Panel */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>{aiReasoning ? '✨' : '⚡'}</span>
              {aiReasoning ? 'Gemini AI Triage' : 'Live Threat Triage'}
            </span>
            <span className="text-[10px] text-slate-400">
              {aiReasoning ? 'Analyzed by AI' : 'Updates as you type'}
            </span>
          </div>

          <RiskMeter score={liveAnalysis.riskScore} level={liveAnalysis.riskLevel} />

          <div className="flex flex-wrap gap-1.5 pt-1">
            <RiskFlag type="sensational" active={liveAnalysis.sensational} />
            <RiskFlag type="shouting"    active={liveAnalysis.shouting} />
            <RiskFlag type="unsourced"   active={liveAnalysis.unsourced} />
            {liveAnalysis.isHighRisk && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-600 text-white animate-pulse">
                🔴 High Risk (2+ Flags Detected)
              </span>
            )}
            {!liveAnalysis.sensational && !liveAnalysis.shouting && !liveAnalysis.unsourced && (
              <span className="text-xs text-slate-400 italic">No flags triggered yet</span>
            )}
          </div>

          {aiReasoning && (
            <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-900 leading-relaxed shadow-sm">
              <strong className="font-semibold block mb-1">🤖 Gemini Analysis:</strong>
              {aiReasoning}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || extracting || aiLoading}
          className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-xs transition disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : '🚀 Submit Claim for Triage'}
        </button>
      </form>
    </div>
  );
}