import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitClaim } from '../api/api';
import { analyzeFlagsClient } from '../utils/flagAnalyzer';
import RiskMeter from '../components/RiskMeter';
import RiskFlag from '../components/RiskFlag';
import Tesseract from 'tesseract.js';
import toast from 'react-hot-toast';

export default function SubmitClaim() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [platform, setPlatform] = useState('WhatsApp');
  const [category, setCategory] = useState('Health');
  const [imagePreview, setImagePreview] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Live real-time analysis as user types or OCR extracts text
  const [liveAnalysis, setLiveAnalysis] = useState(() => analyzeFlagsClient(''));

  useEffect(() => {
    setLiveAnalysis(analyzeFlagsClient(text));
  }, [text]);

  // Handle Image Upload & Automatic OCR Extraction
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = async () => {
      setImagePreview(reader.result);
      
      // Run Tesseract OCR in browser
      setOcrLoading(true);
      setOcrProgress(0);
      try {
        const res = await Tesseract.recognize(reader.result, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          },
        });

        const extracted = res.data.text.trim();
        if (extracted) {
          setText((prev) => (prev ? `${prev}\n\n[OCR from Image]:\n${extracted}` : extracted));
          toast.success('Text extracted from screenshot!');
        } else {
          toast('Image uploaded, but no clear text detected.', { icon: 'ℹ️' });
        }
      } catch (err) {
        console.error('OCR Error:', err);
        toast.error('Could not extract text from image.');
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Submit a Viral Claim
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Paste viral post text or upload a screenshot. Our system auto-extracts text and scores risk signals in real-time.
        </p>
      </div>

      {/* Duplicate Warning Banner */}
      {duplicateWarning && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 space-y-2 animate-in fade-in">
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

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Claim Text Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <label htmlFor="claimText">Post Text / Content *</label>
            <span className="font-mono text-slate-400 font-normal">
              {text.length} characters
            </span>
          </div>
          <textarea
            id="claimText"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the viral claim message here (e.g. 'BREAKING!! Share before deleted: 5G towers cause...')"
            className="w-full p-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-indigo-600 text-slate-900 leading-relaxed font-sans transition"
            required
          />
        </div>

        {/* Screenshot Upload with OCR */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span>📷 Attach Screenshot (with Auto-OCR Text Extraction)</span>
            {ocrLoading && (
              <span className="text-indigo-600 font-normal animate-pulse">
                Extracting text... {ocrProgress}%
              </span>
            )}
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
          />

          {imagePreview && (
            <div className="relative mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200 inline-block max-w-xs">
              <img
                src={imagePreview}
                alt="Screenshot Preview"
                className="max-h-36 rounded-lg object-contain"
              />
              <button
                type="button"
                onClick={() => setImagePreview('')}
                className="absolute -top-2 -right-2 w-6 h-6 bg-rose-600 text-white rounded-full text-xs flex items-center justify-center shadow hover:bg-rose-700"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Platform & Category Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Source Platform *
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-indigo-600 text-slate-800"
            >
              <option value="WhatsApp">WhatsApp</option>
              <option value="X">X (Twitter)</option>
              <option value="Instagram">Instagram</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category *
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

        {/* Real-Time Live Analysis Preview */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚡</span> Live Threat Triage
            </span>
            <span className="text-[10px] text-slate-400">Updates as you type</span>
          </div>

          <RiskMeter score={liveAnalysis.riskScore} level={liveAnalysis.riskLevel} />

          <div className="flex flex-wrap gap-1.5 pt-1">
            <RiskFlag type="sensational" active={liveAnalysis.sensational} />
            <RiskFlag type="shouting" active={liveAnalysis.shouting} />
            <RiskFlag type="unsourced" active={liveAnalysis.unsourced} />
            {liveAnalysis.isHighRisk && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-600 text-white animate-pulse">
                🔴 High Risk (2+ Flags Detected)
              </span>
            )}
            {!liveAnalysis.sensational && !liveAnalysis.shouting && !liveAnalysis.unsourced && (
              <span className="text-xs text-slate-400 italic">No flags triggered yet</span>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || ocrLoading}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-xs transition disabled:opacity-50"
        >
          {submitting ? 'Analyzing & Submitting...' : '🚀 Submit Claim for Triage'}
        </button>
      </form>
    </div>
  );
}