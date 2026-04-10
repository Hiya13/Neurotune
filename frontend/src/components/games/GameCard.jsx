import React from 'react';
import { useNavigate } from 'react-router-dom';

const ICONS = {
  wave: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 12c3 0 5 4 8 4s5-4 8-4 5 4 8 4" />
      <path d="M4 18c3 0 5 4 8 4s5-4 8-4 5 4 8 4" />
      <path d="M4 24c3 0 5 4 8 4s5-4 8-4 5 4 8 4" />
    </svg>
  ),
  leaf: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M16 4c0 0-8 6-8 14s4 10 8 10 8-2 8-10-8-14-8-14z" />
      <path d="M16 28V12" />
    </svg>
  ),
  signal: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M16 26a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
      <path d="M9.8 19.8a8.8 8.8 0 0 1 12.4 0" />
      <path d="M6.1 16.1a14 14 0 0 1 19.8 0" />
      <path d="M2.4 12.4a19.2 19.2 0 0 1 27.2 0" />
    </svg>
  )
};

const COLOR_MAP = {
  teal: { accent: '#1d9e75', light: 'rgba(29,158,117,0.10)', lightText: '#9fe1cb' },
  green: { accent: '#639922', light: 'rgba(99,153,34,0.10)', lightText: '#c9e19f' },
  purple: { accent: '#7f77dd', light: 'rgba(127,119,221,0.10)', lightText: '#cbc7f5' },
  amber: { accent: '#ba7517', light: 'rgba(186,117,23,0.10)', lightText: '#f5dcb7' },
  coral: { accent: '#d85a30', light: 'rgba(216,90,48,0.10)', lightText: '#f5c3b2' }
};

const GameCard = ({ game }) => {
  const navigate = useNavigate();
  const colors = COLOR_MAP[game.gradient] || COLOR_MAP.teal;
  const isAvailable = game.status === 'available';

  return (
    <div 
      onClick={isAvailable ? () => navigate(game.path) : undefined}
      className={`
        glass-panel p-5 rounded-[14px] border border-white/5 transition-all duration-300
        ${isAvailable ? 'cursor-pointer hover:border-[0.5px] hover:-translate-y-0.5' : 'cursor-default opacity-80'}
      `}
      style={{
        borderColor: isAvailable ? undefined : 'rgba(255,255,255,0.05)',
        '--hover-border': colors.accent
      }}
    >
      <style>{`
        .glass-panel:hover {
          border-color: var(--hover-border) !important;
        }
      `}</style>
      
      {/* ICON STRIP */}
      <div 
        className="w-full h-20 rounded-xl flex items-center justify-center mb-5"
        style={{ backgroundColor: colors.light, color: colors.accent }}
      >
        <div className="w-8 h-8">
          {ICONS[game.icon]}
        </div>
      </div>

      {/* TAGS ROW */}
      <div className="flex flex-wrap gap-2 mb-4">
        {game.tags.map(tag => (
          <span 
            key={tag}
            className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
            style={{ backgroundColor: colors.light, color: colors.accent + 'cc' }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* TITLE */}
      <h3 className="text-[16px] font-medium text-white mb-2">
        {game.title}
      </h3>

      {/* DESCRIPTION */}
      <p className="text-[13px] text-slate-400 leading-[1.6] line-clamp-3 mb-6">
        {game.description}
      </p>

      {/* FOOTER ROW */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {game.duration}
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 20h.01M7 20h.01M12 20h.01M17 20h.01M22 20h.01M12 11l-4-4-4 4M12 11v8M20 11l-4-4" />
            </svg>
            {game.difficulty}
          </div>
        </div>

        {isAvailable ? (
          <button 
            className="text-[13px] font-medium py-1.5 px-4 rounded-lg border transition-all"
            style={{ color: colors.accent, borderColor: colors.accent + '4d' }}
          >
            Play →
          </button>
        ) : (
          <span className="text-[12px] text-slate-500 font-medium py-1.5 px-3 border border-white/5 rounded-lg">
            Coming soon
          </span>
        )}
      </div>
    </div>
  );
};

export default GameCard;
