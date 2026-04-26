import React, { useMemo } from 'react';
import authService from '../../../services/authService';

/**
 * Session-end overlay for FocusFlight.
 *
 * Stats: max altitude, orbs collected, avg focus, time in high focus.
 * "Flight Portrait" — altitude-over-time sparkline (unique to this game).
 * Saves to POST /api/sessions with taskContext: 'FocusFlight'.
 */
const SessionEnd = ({
  altitudeHistory,
  scoreHistory,
  maxAltitude,
  orbsCollected,
  zoneReached,
  sessionDurationMs,
  onPlayAgain,
  onExit,
}) => {
  const avgFocus = useMemo(() => {
    if (!scoreHistory || scoreHistory.length === 0) return 0;
    return Math.round(scoreHistory.reduce((a, b) => a + b, 0) / scoreHistory.length);
  }, [scoreHistory]);

  const peakFocus = useMemo(() => {
    if (!scoreHistory || scoreHistory.length === 0) return 0;
    return Math.round(Math.max(...scoreHistory));
  }, [scoreHistory]);

  const highFocusSeconds = useMemo(() => {
    if (!scoreHistory || scoreHistory.length === 0) return 0;
    // Each history sample is 0.5s apart
    const highSamples = scoreHistory.filter((s) => s > 65).length;
    return Math.round(highSamples * 0.5);
  }, [scoreHistory]);

  const peakAltitude = Math.max(maxAltitude, ...altitudeHistory, 0);

  const [saving, setSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState(null); // 'success' | 'error' | null

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const token = authService.getToken();
      const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attentionScore: avgFocus,
          interventionType: 'visual',
          taskContext: 'FocusFlight',
          sessionDuration: Math.round(sessionDurationMs / 60000),
          baselineScore: scoreHistory[0] || 0,
          peakScore: peakFocus,
          averageScore: avgFocus,
          notes: `Reached ${maxAltitude.toLocaleString()}m, ${orbsCollected} orbs, zone: ${zoneReached}`,
          eegData: {
            game: 'FocusFlight',
            maxAltitude,
            orbsCollected,
            zoneReached,
            flightHistory: altitudeHistory.filter((_, i) => i % 5 === 0),
          },
        }),
      });

      if (resp.ok) {
        setSaveStatus('success');
        setTimeout(() => {
          onExit();
        }, 1500);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const durationMin = Math.floor(sessionDurationMs / 60000);
  const durationSec = Math.floor((sessionDurationMs % 60000) / 1000);
  const durationLabel = `${durationMin}m ${durationSec}s`;

  const highFocusLabel =
    highFocusSeconds >= 60
      ? `${Math.floor(highFocusSeconds / 60)}m ${highFocusSeconds % 60}s`
      : `${highFocusSeconds}s`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#05060f]/95 p-4 animate-in fade-in duration-700">
      <div className="w-full max-w-2xl bg-[#0f1118] border border-amber-500/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

        {/* SIDEBAR */}
        <div className="w-full md:w-5/12 bg-black/40 p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/5">
          <div className="text-center mb-8">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-4">
              <ellipse cx="24" cy="18" rx="14" ry="16" fill="#f59e0b" opacity="0.8"/>
              <rect x="17" y="34" width="14" height="8" rx="2" fill="#8b6914"/>
              <line x1="17" y1="34" x2="14" y2="18" stroke="#5d4037" strokeWidth="1.2"/>
              <line x1="31" y1="34" x2="34" y2="18" stroke="#5d4037" strokeWidth="1.2"/>
            </svg>
            <div className="text-3xl font-black text-white">{peakAltitude.toLocaleString()}m</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Max Altitude</div>
          </div>

          <div className="space-y-5">
            <StatRow icon="orb" label="Orbs Collected" value={orbsCollected} color="text-amber-400" />
            <StatRow icon="focus" label="Avg Focus" value={`${avgFocus}%`} color="text-emerald-400" />
            <StatRow icon="clock" label="High Focus Time" value={highFocusLabel} color="text-sky-400" />
            <StatRow icon="duration" label="Duration" value={durationLabel} color="text-slate-300" />
          </div>
        </div>

        {/* MAIN: Flight Portrait */}
        <div className="w-full md:w-7/12 p-8 flex flex-col">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">Flight Portrait</h2>
            <p className="text-amber-500/60 text-sm font-medium">Your altitude profile over time.</p>
          </div>

          {/* Sparkline */}
          <div className="space-y-2 mb-8 flex-1">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Altitude Gain Sparkline</div>
            <div className="h-28 w-full bg-black/40 rounded-2xl overflow-hidden border border-white/5 relative flex items-end px-1 gap-[1px]">
              {altitudeHistory
                .filter((_, i) => i % Math.max(1, Math.floor(altitudeHistory.length / 60)) === 0)
                .map((alt, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm"
                    style={{
                      height: `${(alt / Math.max(peakAltitude, 1)) * 90}%`,
                      background: `linear-gradient(to top, rgba(245,158,11,0.25), rgba(245,158,11,0.6))`,
                    }}
                  />
                ))}
            </div>
          </div>

          <div className="space-y-3 mt-auto">
            <button
              onClick={handleSave}
              disabled={saving || saveStatus === 'success'}
              className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-lg ${
                saveStatus === 'success' ? 'bg-emerald-800 text-emerald-200 cursor-default' : 
                saveStatus === 'error' ? 'bg-rose-600 hover:bg-rose-500 text-white' :
                'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40'
              } ${saving ? 'opacity-70 cursor-wait' : ''}`}
            >
              {saving ? 'Confirming...' : saveStatus === 'success' ? 'Flight Log Saved ✓' : saveStatus === 'error' ? 'Retry Log' : 'Confirm Flight Log'}
            </button>

            {saveStatus === 'error' && (
               <p className="text-rose-400 text-[10px] text-center font-bold uppercase tracking-tight">Log transfer failed. Try again.</p>
            )}
            {saveStatus === 'success' && (
               <p className="text-emerald-400 text-[10px] text-center font-bold uppercase tracking-tight">Returning to hangar...</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onPlayAgain}
                disabled={saving}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-semibold text-sm transition-all disabled:opacity-50"
              >
                New Flight
              </button>
              <button
                onClick={onExit}
                disabled={saving}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-semibold text-sm transition-all disabled:opacity-50"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function StatRow({ icon, label, value, color }) {
  const icons = {
    orb: <circle cx="10" cy="10" r="6" fill="#ffd700" opacity="0.7"/>,
    focus: <><circle cx="10" cy="10" r="5" fill="none" stroke="#34d399" strokeWidth="2"/><circle cx="10" cy="10" r="2" fill="#34d399"/></>,
    clock: <><circle cx="10" cy="10" r="7" fill="none" stroke="#38bdf8" strokeWidth="1.5"/><line x1="10" y1="6" x2="10" y2="10" stroke="#38bdf8" strokeWidth="1.5"/><line x1="10" y1="10" x2="13" y2="12" stroke="#38bdf8" strokeWidth="1.5"/></>,
    duration: <><rect x="4" y="4" width="12" height="12" rx="2" fill="none" stroke="#94a3b8" strokeWidth="1.5"/><line x1="10" y1="7" x2="10" y2="10" stroke="#94a3b8" strokeWidth="1.5"/></>,
  };
  return (
    <div className="flex items-center gap-4">
      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 20 20">{icons[icon]}</svg>
      </div>
      <div>
        <div className={`text-lg font-bold leading-none ${color}`}>{value}</div>
        <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{label}</div>
      </div>
    </div>
  );
}

export default SessionEnd;
