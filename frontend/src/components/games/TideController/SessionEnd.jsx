import { useState } from 'react';
import authService from '../../../services/authService';

function buildSparklinePath(samples, w = 280, h = 72) {
  if (!samples.length) return '';
  const min = 0;
  const max = 100;
  const pad = 4;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  return samples
    .map((v, i) => {
      const x = pad + (i / Math.max(1, samples.length - 1)) * innerW;
      const t = (v - min) / (max - min);
      const y = pad + innerH * (1 - t);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

export default function SessionEnd({
  tideHistory,
  artifactsFound,
  averageFocus,
  sessionDurationMs,
  onPlayAgain,
  onExit,
}) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const token = authService.getToken();
      const durationMin = sessionDurationMs / 60000;
      const sessionData = {
        timestamp: new Date().toISOString(),
        attentionScore: Math.round(Math.min(100, Math.max(0, averageFocus))),
        interventionType: 'visual',
        taskContext: 'TideController',
        sessionDuration: durationMin,
        baselineScore: tideHistory.length ? tideHistory[0] : averageFocus,
        peakScore: tideHistory.length ? Math.max(...tideHistory) : averageFocus,
        averageScore: averageFocus,
        stressLevel: 'moderate',
        environmentalFactors: {
          noiseLevel: 'moderate',
          lighting: 'normal',
          temperature: 'comfortable',
        },
        notes: `TideController session. Artifacts recovered: ${artifactsFound}/6.`,
        eegData: {
          game: 'TideController',
          artifactsFound,
          tideHistorySample: tideHistory.slice(-200),
        },
      };

      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${base}/sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.error || 'Failed to save session');
      }

      setSaved(true);
      setTimeout(() => {
        onExit?.();
      }, 1500);
    } catch (e) {
      setSaveError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const pathD = buildSparklinePath(tideHistory);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl border border-teal-500/25 bg-slate-900/95 p-8 shadow-2xl text-center">
        <h2 className="text-2xl font-semibold text-teal-300 mb-2">Session complete</h2>
        <p className="text-slate-400 text-sm mb-6">Your tide journey and focus profile</p>

        <div className="mb-6 rounded-xl bg-slate-950/80 border border-white/10 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Session portrait</p>
          <svg
            viewBox="0 0 280 72"
            className="w-full h-20"
            preserveAspectRatio="none"
            aria-hidden
          >
            <rect x={0} y={0} width={280} height={72} fill="rgba(15,23,42,0.5)" rx={6} />
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="url(#tide-spark-grad)"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
            <defs>
              <linearGradient id="tide-spark-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2dd4bf" />
                <stop offset="100%" stopColor="#67e8f9" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 text-left">
          <div className="rounded-lg bg-slate-800/60 p-4 border border-white/5">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Artifacts</div>
            <div className="text-2xl font-semibold text-white mt-1">
              {artifactsFound} / 6
            </div>
          </div>
          <div className="rounded-lg bg-slate-800/60 p-4 border border-white/5">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Avg. focus</div>
            <div className="text-2xl font-semibold text-teal-300 mt-1">
              {averageFocus.toFixed(1)}
            </div>
          </div>
        </div>

        {saveError && (
          <p className="text-red-400 text-sm mb-4">{saveError}</p>
        )}
        {saved && (
          <p className="text-emerald-400 text-sm mb-4">Session saved to Neurotune.</p>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={saving || saved}
            onClick={handleSave}
            className={`w-full py-4 rounded-xl text-white font-bold transition-all ${
              saved ? 'bg-teal-800' : 'bg-teal-600 hover:bg-teal-500'
            } ${saving ? 'opacity-70' : ''}`}
          >
            {saving ? 'Saving...' : saved ? 'Session Saved ✓' : 'Save Session & Exit'}
          </button>
          
          {saved && (
             <p className="text-teal-400 text-[10px] uppercase font-bold tracking-tight">Redirecting to shore...</p>
          )}

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              disabled={saving}
              onClick={onPlayAgain}
              className="flex-1 py-3 rounded-xl border border-slate-600 hover:bg-slate-800 text-slate-200 font-medium transition-colors disabled:opacity-50"
            >
              Play Again
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onExit}
              className="flex-1 py-3 rounded-xl border border-slate-600 hover:bg-slate-800 text-slate-200 font-medium transition-colors disabled:opacity-50"
            >
              Discard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
